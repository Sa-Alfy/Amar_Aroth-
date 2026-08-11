import { createClient } from '@/lib/supabase/server';

export interface PhoneRevealResult {
  success: boolean;
  phone?: string;
  sellerName?: string;
  isVerified?: boolean;
  error?: string;
}

export interface FraudAlert {
  id: string;
  userId?: string;
  listingId?: string;
  alertType: 'price_outlier' | 'phone_scraping' | 'ip_cluster' | 'velocity_spike' | 'syndicate_match';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata?: Record<string, any>;
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  createdAt: string;
}

/**
 * Call secure database RPC to reveal seller phone number with server-enforced rate limits.
 */
export async function revealSellerPhone(
  listingId: string,
  userIp: string = '127.0.0.1'
): Promise<PhoneRevealResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('reveal_seller_phone_number', {
      p_listing_id: listingId,
      p_viewer_ip: userIp,
    });

    if (error) {
      console.warn('Phone reveal RPC error:', error.message);
      return { success: false, error: error.message };
    }

    if (data && data.length > 0) {
      const row = data[0];
      return {
        success: true,
        phone: row.phone,
        sellerName: row.seller_name,
        isVerified: row.is_verified,
      };
    }

    return { success: false, error: 'Seller phone details not found.' };
  } catch (err: any) {
    console.error('Error revealing seller phone:', err);
    return { success: false, error: err?.message || 'Unexpected server error' };
  }
}

/**
 * Record user device footprint for anomaly detection.
 */
export async function logUserDeviceFootprint(payload: {
  userId?: string;
  ipAddress: string;
  action: 'login' | 'signup' | 'create_listing' | 'update_listing' | 'phone_reveal';
  deviceFingerprint?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from('user_device_logs').insert({
      user_id: payload.userId || null,
      ip_address: payload.ipAddress,
      device_fingerprint: payload.deviceFingerprint || null,
      user_agent: payload.userAgent || null,
      action: payload.action,
    });
  } catch (err) {
    console.error('Failed to record device footprint:', err);
  }
}

/**
 * Fetch pending fraud alerts for admin review.
 */
export async function getPendingFraudAlerts(): Promise<FraudAlert[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('fraud_alerts')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any): FraudAlert => ({
      id: row.id,
      userId: row.user_id,
      listingId: row.listing_id,
      alertType: row.alert_type,
      severity: row.severity,
      description: row.description,
      metadata: row.metadata,
      status: row.status,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('Error fetching fraud alerts:', err);
    return [];
  }
}
