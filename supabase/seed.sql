-- Seed script for Amar Aroth database
-- Run this script in your Supabase SQL Editor to populate initial categories, units, locations, profiles, and 10 realistic crop supply listings.

-- 1. SEED CATEGORIES
insert into public.categories (id, name_en, name_bn, slug, icon, description, sort_order) values
  (1, 'Potato', 'আলু', 'potato', '🥔', 'Holland & Granola potatoes from Bogura & Dinajpur', 1),
  (2, 'Egg & Poultry', 'ডিম ও পোল্ট্রি', 'egg-poultry', '🥚', 'White & Brown farm eggs from Tangail & Gazipur', 2),
  (3, 'Fish & Aquaculture', 'মাছ ও মৎস্য', 'fish', '🐟', 'Black Tiger Shrimp, Rui, Katla, Tilapia from Satkhira & Mymensingh', 3),
  (4, 'Rice & Paddy', 'ধান ও চাল', 'rice-paddy', '🌾', 'Miniket, Nazirshail, BR-28 Paddy from Naogaon & Dinajpur', 4),
  (5, 'Onion & Garlic', 'পেঁয়াজ ও রসুন', 'onion-garlic', '🧅', 'Local Taherpuri onion & garlic from Pabna & Faridpur', 5),
  (6, 'Vegetables', 'শাক-সবজি', 'vegetables', '🥦', 'Fresh Cauliflower, Tomato, Eggplant from Narsingdi & Jessore', 6),
  (7, 'Livestock & Cattle', 'গবাদিপশু', 'livestock', '🐄', 'Friesian & Local bulls from Sirajganj & Kushtia', 7),
  (8, 'Fruits & Mango', 'ফল ও আম', 'fruits', '🥭', 'Haribhanga & Himsagar mangoes from Rajshahi & Chapainawabganj', 8)
on conflict (id) do nothing;

-- 2. SEED MEASUREMENT UNITS
insert into public.measurement_units (id, name_en, name_bn, symbol_en, symbol_bn, category_id) values
  (1, 'Kilogram', 'কেজি', 'kg', 'কেজি', 1),
  (2, 'Maund', 'মন', 'mon', 'মন', 1),
  (3, 'Metric Ton', 'মেট্রিক টন', 'ton', 'টন', 1),
  (4, 'Piece / Item', 'টি', 'pc', 'টি', 2),
  (5, 'Dozen', 'ডজন', 'dz', 'ডজন', 2),
  (6, 'Crate (100 pcs)', 'কোটলা/কেস', 'crate', 'কেস', 2),
  (7, 'Bag (50 kg)', 'বস্তা', 'bag', 'বস্তা', 4)
on conflict (id) do nothing;

-- 3. SEED LOCATIONS (Divisions, Districts, Upazilas)
insert into public.divisions (id, name_en, name_bn) values
  (1, 'Dhaka', 'ঢাকা'),
  (2, 'Rajshahi', 'রাজশাহী'),
  (3, 'Rangpur', 'রংপুর'),
  (4, 'Khulna', 'খুলনা'),
  (5, 'Mymensingh', 'ময়মনসিংহ')
on conflict (id) do nothing;

insert into public.districts (id, division_id, name_en, name_bn) values
  (101, 2, 'Bogura', 'বগুড়া'),
  (102, 1, 'Gazipur', 'গাজীপুর'),
  (103, 4, 'Satkhira', 'সাতক্ষীরা'),
  (104, 2, 'Naogaon', 'নওগাঁ'),
  (105, 1, 'Pabna', 'পাবনা'),
  (106, 3, 'Dinajpur', 'দিনাজপুর'),
  (107, 2, 'Sirajganj', 'সিরাজগঞ্জ'),
  (108, 3, 'Rangpur', 'রংপুর'),
  (109, 5, 'Mymensingh', 'ময়মনসিংহ'),
  (110, 4, 'Jessore', 'যশোর')
on conflict (id) do nothing;

insert into public.upazilas (id, district_id, name_en, name_bn) values
  (1001, 101, 'Shibganj', 'শিবগঞ্জ'),
  (1002, 102, 'Sreepur', 'শ্রীপুর'),
  (1003, 103, 'Shyamnagar', 'শ্যামনগর'),
  (1004, 104, 'Mahadevpur', 'মহাদেবপুর'),
  (1005, 105, 'Santhia', 'সাঁথিয়া'),
  (1006, 106, 'Birganj', 'বীরগঞ্জ'),
  (1007, 107, 'Shahjadpur', 'শাহজাদপুর'),
  (1008, 108, 'Mithapukur', 'মিঠাপুকুর'),
  (1009, 109, 'Trishal', 'ত্রিশাল'),
  (1010, 110, 'Jhikargacha', 'ঝিকরগাছা')
on conflict (id) do nothing;

-- 4. SEED DEMO PROFILES
-- Note: Dummy UUIDs generated for seed testing
insert into public.profiles (id, phone, full_name, user_type, district_id, upazila_id, is_verified) values
  ('11111111-1111-1111-1111-111111111111', '01711223344', 'মোঃ কাশেম আলী (Farmer Kashem)', 'farmer', 101, 1001, true),
  ('22222222-2222-2222-2222-222222222222', '01899887766', 'আলহাজ্ব আব্দুর রহিম (Rahim Agro)', 'aggregator', 102, 1002, true),
  ('33333333-3333-3333-3333-333333333333', '01655443322', 'সাতক্ষীরা মৎস্য সমবায় (Satkhira Fishery Coop)', 'farmer', 103, 1003, true),
  ('44444444-4444-4444-4444-444444444444', '01733445566', 'হাজী জসিম উদ্দিন (Naogaon Grain Hub)', 'aggregator', 104, 1004, true),
  ('55555555-5555-5555-5555-555555555555', '01911224455', 'আতাউর রহমান (Farmer Ataur)', 'farmer', 105, 1005, true)
on conflict (id) do nothing;

-- 5. SEED 10 REALISTIC SUPPLY LISTINGS
insert into public.listings (
  id, seller_id, created_by_user_id, category_id, title, description, quantity, unit_id, expected_price,
  division_id, district_id, upazila_id, specific_location, status, view_count, phone_reveal_count
) values
  (
    'a1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    1,
    'সদ্য তোলা হল্যান্ড আলু (Fresh Holland Potato - Granola Variety)',
    'শিবগঞ্জের কোল্ড স্টোরেজ সংলগ্ন তাজা এ গ্রেড আলু। সর্বনিম্ন ১০ মন পাইকারি বিক্রি। পরিবহন সুবিধা আছে।',
    5000.00, 1, 28.50,
    2, 101, 1001, 'মহাস্থান গড় কোল্ড স্টোরেজ রোড',
    'active', 142, 18
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    2,
    'ফার্মের তাজা লাল ডিম (Fresh Farm Brown Eggs - Grade A Large)',
    'দৈনিক ২০,০০০ পিস উৎপাদন। সরাসরি ফার্মগেট রেটে বিক্রয়। ট্রে সহ পিকআপ পয়েন্টে সরাসরি সরবরাহ।',
    15000.00, 4, 10.20,
    1, 102, 1002, 'মাওনা চৌরাস্তা পোল্ট্রি জোন',
    'active', 289, 42
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    3,
    'রপ্তানি যোগ্য গলদা ও বাগদা চিংড়ি (Export Grade Black Tiger Shrimp)',
    'শ্যামনগরের মিষ্টি পানির ঘেরের তাজা চিংড়ি। বরফ প্যাকেজিংয়ে ঢাকা ও চট্টগ্রাম ডেলিভারি সাপোর্ট।',
    800.00, 1, 750.00,
    4, 103, 1003, 'বুড়িগোয়ালিনী মৎস্য আড়ত',
    'active', 95, 12
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    4,
    'অটো রাইস মিলের মিনিকেট চাল (Premium Miniket Rice - 50kg Sack)',
    'নওগাঁর চাতালের প্রিমিয়াম পলিশড মিনিকেট চাল। সরাসরি মিলগেট রেট। নূন্যতম ৫০ বস্তা।',
    200.00, 7, 3400.00,
    2, 104, 1004, 'মহাদেবপুর রাইস মিল আড়ত',
    'active', 178, 25
  ),
  (
    'a5555555-5555-5555-5555-555555555555',
    '55555555-5555-5555-5555-555555555555',
    5,
    'পাবনার দেশি তাহেরপুরী পেঁয়াজ (Local Taherpuri Dry Onion)',
    'পাবনার বিখ্যাত শুকনো তাহেরপুরী পেঁয়াজ। পচনমুক্ত ও ঝরঝরে। সরাসরি কৃষকের ঘর থেকে সংগ্রহ করুন।',
    120.00, 2, 2200.00,
    2, 105, 1005, 'সাঁথিয়া বাজার পাইকারি আড়ত',
    'active', 310, 39
  ),
  (
    'a6666666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    1,
    'দিনাজপুরের তাজা বীজ আলু (Dinajpur Seed Potatoes)',
    'সার্টিফাইড বীজ আলু কোল্ড স্টোরেজ প্রস্তুত। বিএডিসি অনুমোদিত জাত।',
    25.00, 3, 38000.00,
    3, 106, 1006, 'বীরগঞ্জ বীজ ভান্ডার',
    'negotiating', 84, 9
  ),
  (
    'a7777777-7777-7777-7777-777777777777',
    '22222222-2222-2222-2222-222222222222',
    2,
    'শাহজাদপুরের খামারজাত দেশি গাভী দুধ (Fresh Dairy Milk)',
    'প্রতিদিন ৫০০ লিটার তাজা তরল দুধ। চিলিং সেন্টার স্পেসিফিকেশন মাফিক সরবরাহ।',
    500.00, 1, 65.00,
    2, 107, 1007, 'শাহজাদপুর ডেইরি চিলিং পয়েন্ট',
    'active', 112, 14
  ),
  (
    'a8888888-8888-8888-8888-888888888888',
    '33333333-3333-3333-3333-333333333333',
    3,
    'রংপুরের তাজা ফুলকপি ও বাঁধাকপি (Fresh Cauliflower & Cabbage Lot)',
    'খেত থেকে সরাসরি কাটা তাজা সবজি। ট্রাক লোড ডেলিভারি সুবিধা।',
    3000.00, 4, 18.00,
    3, 108, 1008, 'মিঠাপুকুর খেত পাইকারি পয়েন্ট',
    'active', 64, 7
  ),
  (
    'a9999999-9999-9999-9999-999999999999',
    '44444444-4444-4444-4444-444444444444',
    4,
    'ত্রিশালের তাজা লাইভ পাঙ্গাস ও তেলাপিয়া (Live Farm Pond Fish)',
    'পুকুর থেকে সরাসরি তাজা মাছ শিকারের সাথে সাথে ডেলিভারি। ঢাকা পাইকারি আড়তদারদের জন্য প্রস্তুত।',
    1500.00, 1, 140.00,
    5, 109, 1009, 'ত্রিশাল মৎস্য জোন',
    'active', 153, 21
  ),
  (
    'a0000000-0000-0000-0000-000000000000',
    '55555555-5555-5555-5555-555555555555',
    5,
    'ঝিকরগাছার সুগন্ধি রজনীগন্ধা ও গ্ল্যাডিওলাস ফুল (Export Grade Flowers)',
    'জাতীয় আড়ত ও ইভেন্ট ম্যানেজমেন্ট সরবরাহকারীদের জন্য তাজা কাটা রজনীগন্ধা ফুল।',
    10000.00, 4, 4.50,
    4, 110, 1010, 'গদখালী ফুল বাজার আড়ত',
    'active', 215, 33
  )
on conflict (id) do nothing;

-- 6. SEED LISTING IMAGES
insert into public.listing_images (listing_id, image_url, sort_order) values
  ('a1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80', 1),
  ('a2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80', 1),
  ('a3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80', 1),
  ('a4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80', 1),
  ('a5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8ce?auto=format&fit=crop&w=800&q=80', 1),
  ('a6666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80', 1),
  ('a7777777-7777-7777-7777-777777777777', 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=800&q=80', 1),
  ('a8888888-8888-8888-8888-888888888888', 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80', 1),
  ('a9999999-9999-9999-9999-999999999999', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', 1),
  ('a0000000-0000-0000-0000-000000000000', 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80', 1)
on conflict (id) do nothing;
