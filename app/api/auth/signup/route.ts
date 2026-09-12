import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizePhone, isValidBdPhone } from '@/lib/client/api';
import { decodeImageDataUrl, uploadNidImage, removeNidImages } from '@/lib/server/kycUpload';

/**
 * POST /api/auth/signup
 *
 * Server-side user registration. Creates the Supabase Auth user + profile row.
 *
 * The auth user is created with the admin client and email_confirm: true. The
 * email is synthetic ({phone}@amararoth.com), so a confirmation link could never
 * be clicked, and supabase.auth.signUp() would return session: null — which made
 * the profile insert that follows it run as `anon` and RLS rejected it.
 *
 * The profile insert also uses the admin client: it is the server that vouches
 * for the row. If it fails, the auth user is deleted so the phone number is not
 * left in a state where signup returns 409 and login returns 404 forever.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, fullName, phone, password, nidNumber, divisionId, districtId, upazilaId, address, nidFrontUrl, nidBackUrl } = body;
    const normalizedPhone = normalizePhone(phone);

    // Validation
    if (!isValidBdPhone(normalizedPhone)) {
      return NextResponse.json({ success: false, error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' }, { status: 400 });
    }
    if (!fullName || fullName.trim().length < 3) {
      return NextResponse.json({ success: false, error: 'আপনার পুরো নাম লিখুন (কমপক্ষে ৩ অক্ষর)' }, { status: 400 });
    }
    if (!nidNumber || nidNumber.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'সঠিক ১০ বা ১৭ ডিজিটের এনআইডি নম্বর দিন' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'পাসওয়ার্ড বা পিন কমপক্ষে ৬ অক্ষরের হতে হবে' }, { status: 400 });
    }

    // The NID photos are required by the signup form, so they are required here too.
    // Decoding before the auth user is created avoids a rollback for a bad file.
    const nidFrontImage = decodeImageDataUrl(nidFrontUrl);
    const nidBackImage = decodeImageDataUrl(nidBackUrl);

    if (!nidFrontImage || !nidBackImage) {
      return NextResponse.json(
        { success: false, error: 'এনআইডির ছবি দুটি JPG, PNG বা WEBP হতে হবে এবং ৫ এমবির কম হতে হবে' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const supabase = await createClient();
    const email = `${normalizedPhone}@amararoth.com`;

    // Direct role to DB user_type mapping (farmer, arathdar, dokandar)
    const userType = role || 'farmer';

    // 1. Auth user, already confirmed — the synthetic email can never be verified.
    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { phone: normalizedPhone, full_name: fullName.trim() },
    });

    if (authError || !created?.user) {
      const em = String(authError?.message || '').toLowerCase();

      if (em.includes('rate limit')) {
        return NextResponse.json(
          { success: false, error: 'অল্প সময়ের মধ্যে অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।' },
          { status: 429 }
        );
      }

      if (em.includes('already registered') || em.includes('already exists') || em.includes('user exists')) {
        return NextResponse.json({ success: false, error: 'এই ফোন নম্বরে ইতিমধ্যে একাউন্ট আছে' }, { status: 409 });
      }

      console.error('[auth/signup] createUser failed:', authError);
      return NextResponse.json({ success: false, error: 'একাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।' }, { status: 400 });
    }

    const userId = created.user.id;

    // 2. NID photos into the private kyc-documents bucket. Only the object path
    //    reaches the profile row; the images are never public and never base64
    //    in the database.
    const uploadedPaths: string[] = [];
    let nidFrontPath: string;
    let nidBackPath: string;

    try {
      nidFrontPath = await uploadNidImage(admin, userId, 'front', nidFrontImage);
      uploadedPaths.push(nidFrontPath);
      nidBackPath = await uploadNidImage(admin, userId, 'back', nidBackImage);
      uploadedPaths.push(nidBackPath);
    } catch (uploadError) {
      await admin.auth.admin.deleteUser(userId);
      await removeNidImages(admin, uploadedPaths);
      console.error('[auth/signup] NID upload failed, rolled back auth user', userId, uploadError);
      return NextResponse.json(
        { success: false, error: 'এনআইডির ছবি আপলোড করা যায়নি। আবার চেষ্টা করুন।' },
        { status: 500 }
      );
    }

    // 3. Profile row. Admin client bypasses RLS — the server vouches for this row.
    const { error: profileError } = await admin.from('profiles').insert({
      id: userId,
      phone: normalizedPhone,
      full_name: fullName.trim(),
      user_type: userType,
      nid_number: nidNumber.trim(),
      division_id: divisionId || null,
      district_id: districtId || null,
      upazila_id: upazilaId || null,
      address: address || null,
      nid_front_url: nidFrontPath,
      nid_back_url: nidBackPath,
      is_verified: false,
      kyc_status: 'pending',
    });

    // 4. Several writes, no transaction between them. Undo them all if the profile
    //    fails, otherwise the phone number is stuck: 409 on signup, 404 on login.
    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      await removeNidImages(admin, uploadedPaths);
      console.error('[auth/signup] profile insert failed, rolled back auth user', userId, profileError);
      return NextResponse.json({ success: false, error: 'প্রোফাইল তৈরি করতে ত্রুটি হয়েছে' }, { status: 500 });
    }

    // 5. Establish the session so the client lands on a page that sees a logged-in user.
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      console.error('[auth/signup] post-signup sign-in failed for', userId, signInError);
    }

    // 6. Device footprint. Written with the admin client: user_device_logs feeds risk
    //    scoring, so client-supplied rows are not trusted here.
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    try {
      await admin.from('user_device_logs').insert({
        user_id: userId,
        ip_address: ip,
        user_agent: request.headers.get('user-agent') || null,
        action: 'signup',
      });
    } catch {}

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        phone: normalizedPhone,
        fullName: fullName.trim(),
        userType: userType,
        isVerified: false,
        kycStatus: 'pending',
      },
    });
  } catch (err: any) {
    console.error('[auth/signup] Error:', err);
    return NextResponse.json({ success: false, error: 'সার্ভার ত্রুটি হয়েছে' }, { status: 500 });
  }
}
