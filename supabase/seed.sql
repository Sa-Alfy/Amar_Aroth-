-- Seed script for Amar Aroth database
-- Populates all 8 Divisions, 64 Districts, and major agricultural Upazilas of Bangladesh.

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

-- 3. SEED ALL 8 DIVISIONS OF BANGLADESH
insert into public.divisions (id, name_en, name_bn) values
  (1, 'Dhaka', 'ঢাকা'),
  (2, 'Chattogram', 'চট্টগ্রাম'),
  (3, 'Rajshahi', 'রাজশাহী'),
  (4, 'Rangpur', 'রংপুর'),
  (5, 'Khulna', 'খুলনা'),
  (6, 'Barishal', 'বরিশাল'),
  (7, 'Sylhet', 'সিলেট'),
  (8, 'Mymensingh', 'ময়মনসিংহ')
on conflict (id) do nothing;

-- 4. SEED ALL 64 DISTRICTS OF BANGLADESH
insert into public.districts (id, division_id, name_en, name_bn) values
  -- Dhaka Division (101 - 113)
  (101, 1, 'Dhaka', 'ঢাকা'),
  (102, 1, 'Gazipur', 'গাজীপুর'),
  (103, 1, 'Tangail', 'টাঙ্গাইল'),
  (104, 1, 'Munshiganj', 'মুন্সীগঞ্জ'),
  (105, 1, 'Narsingdi', 'নরসিংদী'),
  (106, 1, 'Narayanganj', 'নারায়ণগঞ্জ'),
  (107, 1, 'Faridpur', 'ফরিদপুর'),
  (108, 1, 'Madaripur', 'মাদারীপুর'),
  (109, 1, 'Gopalganj', 'গোপালগঞ্জ'),
  (110, 1, 'Rajbari', 'রাজবাড়ী'),
  (111, 1, 'Manikganj', 'মানিকগঞ্জ'),
  (112, 1, 'Shariatpur', 'শরীয়তপুর'),
  (113, 1, 'Kishoreganj', 'কিশোরগঞ্জ'),

  -- Chattogram Division (114 - 124)
  (114, 2, 'Chattogram', 'চট্টগ্রাম'),
  (115, 2, 'Cox''s Bazar', 'কক্সবাজার'),
  (116, 2, 'Cumilla', 'কুমিল্লা'),
  (117, 2, 'Feni', 'ফেনী'),
  (118, 2, 'Noakhali', 'নোয়াখালী'),
  (119, 2, 'Lakshmipur', 'লক্ষ্মীপুর'),
  (120, 2, 'Brahmanbaria', 'ব্রাহ্মণবাড়িয়া'),
  (121, 2, 'Chandpur', 'চাঁদপুর'),
  (122, 2, 'Khagrachhari', 'খাগড়াছড়ি'),
  (123, 2, 'Rangamati', 'রাঙ্গামাটি'),
  (124, 2, 'Bandarban', 'বান্দরবান'),

  -- Rajshahi Division (125 - 132)
  (125, 3, 'Rajshahi', 'রাজশাহী'),
  (126, 3, 'Bogura', 'বগুড়া'),
  (127, 3, 'Naogaon', 'নওগাঁ'),
  (128, 3, 'Pabna', 'পাবনা'),
  (129, 3, 'Sirajganj', 'সিরাজগঞ্জ'),
  (130, 3, 'Natore', 'নাটোর'),
  (131, 3, 'Chapainawabganj', 'চাঁপাইনবাবগঞ্জ'),
  (132, 3, 'Joypurhat', 'জয়পুরহাট'),

  -- Rangpur Division (133 - 140)
  (133, 4, 'Rangpur', 'রংপুর'),
  (134, 4, 'Dinajpur', 'দিনাজপুর'),
  (135, 4, 'Gaibandha', 'গাইবান্ধা'),
  (136, 4, 'Kurigram', 'কুড়িগ্রাম'),
  (137, 4, 'Lalmonirhat', 'লালমনিরহাট'),
  (138, 4, 'Nilphamari', 'নীলফামারী'),
  (139, 4, 'Panchagarh', 'পঞ্চগড়'),
  (140, 4, 'Thakurgaon', 'ঠাকুরগাঁও'),

  -- Khulna Division (141 - 150)
  (141, 5, 'Khulna', 'খুলনা'),
  (142, 5, 'Satkhira', 'সাতক্ষীরা'),
  (143, 5, 'Jessore', 'যশোর'),
  (144, 5, 'Bagerhat', 'বাগেরহাট'),
  (145, 5, 'Chuadanga', 'চুয়াডাঙ্গা'),
  (146, 5, 'Jhenaidah', 'ঝিনাইদহ'),
  (147, 5, 'Kushtia', 'কুষ্টিয়া'),
  (148, 5, 'Magura', 'মাগুরা'),
  (149, 5, 'Meherpur', 'মেহেরপুর'),
  (150, 5, 'Narail', 'নড়াইল'),

  -- Barishal Division (151 - 156)
  (151, 6, 'Barishal', 'বরিশাল'),
  (152, 6, 'Barguna', 'বরগুনা'),
  (153, 6, 'Bhola', 'ভোলা'),
  (154, 6, 'Jhalokati', 'ঝালকাঠি'),
  (155, 6, 'Patuakhali', 'পটুয়াখালী'),
  (156, 6, 'Pirojpur', 'পিরোজপুর'),

  -- Sylhet Division (157 - 160)
  (157, 7, 'Sylhet', 'সিলেট'),
  (158, 7, 'Habiganj', 'হবিগঞ্জ'),
  (159, 7, 'Moulvibazar', 'মৌলভীবাজার'),
  (160, 7, 'Sunamganj', 'সুনামগঞ্জ'),

  -- Mymensingh Division (161 - 164)
  (161, 8, 'Mymensingh', 'ময়মনসিংহ'),
  (162, 8, 'Jamalpur', 'জামালপুর'),
  (163, 8, 'Netrokona', 'নেত্রকোণা'),
  (164, 8, 'Sherpur', 'শেরপুর')
on conflict (id) do nothing;

-- 5. SEED MAJOR AGRICULTURAL UPAZILAS
insert into public.upazilas (id, district_id, name_en, name_bn) values
  -- Dhaka (101)
  (1001, 101, 'Savar', 'সাভার'),
  (1002, 101, 'Dhamrai', 'ধামরাই'),
  (1003, 101, 'Keraniganj', 'কেরানীগঞ্জ'),

  -- Gazipur (102)
  (1004, 102, 'Sreepur', 'শ্রীপুর'),
  (1005, 102, 'Kapasia', 'কাপাসিয়া'),
  (1006, 102, 'Kaliakair', 'কালিয়াকৈর'),

  -- Tangail (103)
  (1007, 103, 'Ghatail', 'ঘাটাইল'),
  (1008, 103, 'Madhupur', 'মধুপুর'),
  (1009, 103, 'Sakhipur', 'সখিপুর'),

  -- Munshiganj (104)
  (1010, 104, 'Sirajdikhan', 'সিরাজদিখান'),
  (1011, 104, 'Tongibari', 'টঙ্গিবাড়ী'),

  -- Narsingdi (105)
  (1012, 105, 'Shibpur', 'শিবপুর'),
  (1013, 105, 'Raipura', 'রায়পুরা'),

  -- Faridpur (107)
  (1014, 107, 'Bhanga', 'ভাঙ্গা'),
  (1015, 107, 'Boalmari', 'বোয়ালমারী'),

  -- Chattogram (114)
  (1016, 114, 'Hathazari', 'হাটহাজারী'),
  (1017, 114, 'Mirsarai', 'মীরসরাই'),
  (1018, 114, 'Patiya', 'পটিয়া'),

  -- Cox''s Bazar (115)
  (1019, 115, 'Chakaria', 'চকোরিয়া'),
  (1020, 115, 'Teknaf', 'টেকনাফ'),

  -- Cumilla (116)
  (1021, 116, 'Chandina', 'চান্দিনা'),
  (1022, 116, 'Daudkandi', 'দাউদকান্দি'),

  -- Rajshahi (125)
  (1023, 125, 'Godagari', 'গোদাগাড়ী'),
  (1024, 125, 'Tanore', 'তানোর'),
  (1025, 125, 'Paba', 'পবা'),

  -- Bogura (126)
  (1026, 126, 'Shibganj', 'শিবগঞ্জ'),
  (1027, 126, 'Shahjahanpur', 'শাহজাহানপুর'),
  (1028, 126, 'Kahaloo', 'কাহালু'),
  (1029, 126, 'Sherpur', 'শেরপুর'),

  -- Naogaon (127)
  (1030, 127, 'Mahadevpur', 'মহাদেবপুর'),
  (1031, 127, 'Dhamoirhat', 'ধামইরহাট'),
  (1032, 127, 'Patnitala', 'পত্নীতলা'),

  -- Pabna (128)
  (1033, 128, 'Santhia', 'সাঁথিয়া'),
  (1034, 128, 'Ishwardi', 'ঈশ্বরদী'),
  (1035, 128, 'Sujanagar', 'সুজানগর'),

  -- Sirajganj (129)
  (1036, 129, 'Shahjadpur', 'শাহজাদপুর'),
  (1037, 129, 'Ullahpara', 'উল্লাপাড়া'),

  -- Chapainawabganj (131)
  (1038, 131, 'Shibganj', 'শিবগঞ্জ'),
  (1039, 131, 'Nachole', 'নাচোল'),

  -- Rangpur (133)
  (1040, 133, 'Mithapukur', 'মিঠাপুকুর'),
  (1041, 133, 'Pirganj', 'পীরগঞ্জ'),

  -- Dinajpur (134)
  (1042, 134, 'Birganj', 'বীরগঞ্জ'),
  (1043, 134, 'Nawabganj', 'নবাবগঞ্জ'),
  (1044, 134, 'Phulbari', 'ফুলবাড়ী'),

  -- Panchagarh (139)
  (1045, 139, 'Tetulia', 'তেঁতুলিয়া'),

  -- Khulna (141)
  (1046, 141, 'Dumuria', 'ডুমুরিয়া'),

  -- Satkhira (142)
  (1047, 142, 'Shyamnagar', 'শ্যামনগর'),
  (1048, 142, 'Kaliganj', 'কালীগঞ্জ'),

  -- Jessore (143)
  (1049, 143, 'Jhikargacha', 'ঝিকরগাছা'),
  (1050, 143, 'Sharsha', 'শার্শা'),

  -- Kushtia (147)
  (1051, 147, 'Kumarkhali', 'কুমারখালী'),
  (1052, 147, 'Daulatpur', 'দৌলতপুর'),

  -- Barishal (151)
  (1053, 151, 'Babuganj', 'বাবুগঞ্জ'),
  (1054, 151, 'Gournadi', 'গৌরনদী'),

  -- Bhola (153)
  (1055, 153, 'Char Fasson', 'চরফ্যাশন'),

  -- Sylhet (157)
  (1056, 157, 'Beanibazar', 'বিয়ানীবাজার'),
  (1057, 157, 'Golapganj', 'গোলাপগঞ্জ'),

  -- Moulvibazar (159)
  (1058, 159, 'Sreemangal', 'শ্রীমঙ্গল'),

  -- Mymensingh (161)
  (1059, 161, 'Trishal', 'ত্রিশাল'),
  (1060, 161, 'Muktagachha', 'মুক্তাগাছা'),
  (1061, 161, 'Bhaluka', 'ভালুকা'),

  -- Jamalpur (162)
  (1062, 162, 'Islampur', 'ইসলামপুর'),

  -- Sherpur (164)
  (1063, 164, 'Nalitabari', 'নালিতাবাড়ী')
on conflict (id) do nothing;

-- 6. SEED DEMO PROFILES
insert into public.profiles (id, phone, full_name, user_type, district_id, upazila_id, is_verified) values
  ('11111111-1111-1111-1111-111111111111', '01711223344', 'মোঃ কাশেম আলী (Farmer Kashem)', 'farmer', 126, 1026, true),
  ('22222222-2222-2222-2222-222222222222', '01899887766', 'আলহাজ্ব আব্দুর রহিম (Rahim Agro)', 'aggregator', 102, 1004, true),
  ('33333333-3333-3333-3333-333333333333', '01655443322', 'সাতক্ষীরা মৎস্য সমবায় (Satkhira Fishery Coop)', 'farmer', 142, 1047, true),
  ('44444444-4444-4444-4444-444444444444', '01733445566', 'হাজী জসিম উদ্দিন (Naogaon Grain Hub)', 'aggregator', 127, 1030, true),
  ('55555555-5555-5555-5555-555555555555', '01911224455', 'আতাউর রহমান (Farmer Ataur)', 'farmer', 128, 1033, true)
on conflict (id) do nothing;

-- 7. SEED REALISTIC SUPPLY LISTINGS
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
    3, 126, 1026, 'মহাস্থান গড় কোল্ড স্টোরেজ রোড',
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
    1, 102, 1004, 'মাওনা চৌরাস্তা পোল্ট্রি জোন',
    'active', 289, 42
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    3,
    'রপ্তানি যোগ্য গলদা ও বাগদা চিংড়ি (Export Grade Black Tiger Shrimp)',
    'শ্যামনগরের মিষ্টি পানির ঘেরের তাজা চিংড়ি। বরফ প্যাকেজিংয়ে ঢাকা ও চট্টগ্রাম ডেলিভারি সাপোর্ট।',
    800.00, 1, 750.00,
    5, 142, 1047, 'বুড়িগোয়ালিনী মৎস্য আড়ত',
    'active', 95, 12
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    4,
    'অটো রাইস মিলের মিনিকেট চাল (Premium Miniket Rice - 50kg Sack)',
    'নওগাঁর চাতালের প্রিমিয়াম পলিশড মিনিকেট চাল। সরাসরি মিলগেট রেট। নূন্যতম ৫০ বস্তা।',
    200.00, 7, 3400.00,
    3, 127, 1030, 'মহাদেবপুর রাইস মিল আড়ত',
    'active', 178, 25
  ),
  (
    'a5555555-5555-5555-5555-555555555555',
    '55555555-5555-5555-5555-555555555555',
    '55555555-5555-5555-5555-555555555555',
    5,
    'পাবনার দেশি তাহেরপুরী পেঁয়াজ (Local Taherpuri Dry Onion)',
    'পাবনার বিখ্যাত শুকনো তাহেরপুরী পেঁয়াজ। পচনমুক্ত ও ঝরঝরে। সরাসরি কৃষকের ঘর থেকে সংগ্রহ করুন।',
    120.00, 2, 2200.00,
    3, 128, 1033, 'সাঁথিয়া বাজার পাইকারি আড়ত',
    'active', 310, 39
  )
on conflict (id) do nothing;

-- 8. SEED LISTING IMAGES
insert into public.listing_images (listing_id, image_url, sort_order) values
  ('a1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80', 1),
  ('a2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80', 1),
  ('a3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80', 1),
  ('a4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80', 1),
  ('a5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8ce?auto=format&fit=crop&w=800&q=80', 1)
on conflict (id) do nothing;

-- 9. SEED INITIAL MARKET PRICE AGGREGATES
insert into public.market_price_aggregates (category_id, upazila_id, district_id, avg_price, min_price, max_price, std_dev, sample_count, period_date) values
  (1, 1026, 126, 28.50, 25.00, 32.00, 2.10, 15, current_date), -- Potato in Shibganj, Bogura
  (2, 1004, 102, 10.20, 9.80, 11.00, 0.40, 28, current_date),  -- Eggs in Sreepur, Gazipur
  (3, 1047, 142, 750.00, 700.00, 820.00, 35.00, 8, current_date), -- Shrimp in Shyamnagar, Satkhira
  (4, 1030, 127, 3400.00, 3300.00, 3550.00, 80.00, 12, current_date), -- Miniket Rice in Mahadevpur, Naogaon
  (5, 1033, 128, 2200.00, 2000.00, 2450.00, 110.00, 20, current_date) -- Onion in Santhia, Pabna
on conflict (category_id, upazila_id, period_date) do nothing;
