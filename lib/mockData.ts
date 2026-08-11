export interface Category {
  id: number;
  nameEn: string;
  nameBn: string;
  slug: string;
  icon: string;
}

export interface LocationDivision {
  id: number;
  nameEn: string;
  nameBn: string;
  districts: LocationDistrict[];
}

export interface LocationDistrict {
  id: number;
  nameEn: string;
  nameBn: string;
  upazilas: LocationUpazila[];
}

export interface LocationUpazila {
  id: number;
  nameEn: string;
  nameBn: string;
}

export interface MeasurementUnit {
  id: number;
  nameEn: string;
  nameBn: string;
  symbol: string;
}

export type ListingStatus = 
  | 'draft' 
  | 'active' 
  | 'negotiating' 
  | 'reserved' 
  | 'sold' 
  | 'expired' 
  | 'reported' 
  | 'removed';

export interface SupplyListing {
  id: string;
  createdByUserId: string;
  ownerUserId: string;
  sellerName: string;
  sellerPhone: string;
  isSellerVerified: boolean;
  sellerType: 'farmer' | 'aggregator' | 'cooperative';
  categoryId: number;
  categoryNameEn: string;
  categoryNameBn: string;
  title: string;
  description: string;
  quantity: number;
  unitId: number;
  unitSymbol: string;
  unitSymbolBn: string;
  expectedPricePerUnit: number;
  currency: string;
  divisionId: number;
  divisionNameEn: string;
  districtId: number;
  districtNameEn: string;
  districtNameBn: string;
  upazilaId: number;
  upazilaNameEn: string;
  upazilaNameBn: string;
  unionName?: string;
  status: ListingStatus;
  images: string[];
  availableFrom: string;
  viewCount: number;
  contactCount: number;
  createdAt: string;
}

export const CATEGORIES: Category[] = [
  { id: 1, nameEn: 'Potato', nameBn: 'আলু', slug: 'potato', icon: '🥔' },
  { id: 2, nameEn: 'Egg & Poultry', nameBn: 'ডিম ও পোল্ট্রি', slug: 'egg-poultry', icon: '🥚' },
  { id: 3, nameEn: 'Fish & Aquaculture', nameBn: 'মাছ ও মৎস্য', slug: 'fish', icon: '🐟' },
  { id: 4, nameEn: 'Rice & Paddy', nameBn: 'ধান ও চাল', slug: 'rice-paddy', icon: '🌾' },
  { id: 5, nameEn: 'Onion & Garlic', nameBn: 'পেঁয়াজ ও রসুন', slug: 'onion-garlic', icon: '🧅' },
  { id: 6, nameEn: 'Vegetables', nameBn: 'শাক-সবজি', slug: 'vegetables', icon: '🥦' },
  { id: 7, nameEn: 'Livestock & Cattle', nameBn: 'গবাদিপশু', slug: 'livestock', icon: '🐄' },
  { id: 8, nameEn: 'Fruits & Mango', nameBn: 'ফল ও আম', slug: 'fruits', icon: '🥭' }
];

export const MEASUREMENT_UNITS: MeasurementUnit[] = [
  { id: 1, nameEn: 'Kilogram (kg)', nameBn: 'কেজি', symbol: 'kg' },
  { id: 2, nameEn: 'Ton', nameBn: 'টন', symbol: 'ton' },
  { id: 3, nameEn: 'Maund (40kg)', nameBn: 'মন', symbol: 'maund' },
  { id: 4, nameEn: 'Piece', nameBn: 'পিস', symbol: 'pcs' },
  { id: 5, nameEn: 'Dozen (12 pcs)', nameBn: 'ডজন', symbol: 'dz' },
  { id: 6, nameEn: 'Hundred (100 pcs)', nameBn: 'শ', symbol: '100pcs' },
  { id: 7, nameEn: 'Crate (1000 pcs)', nameBn: 'ক্যারেট', symbol: 'crate' },
  { id: 8, nameEn: 'Bag / Sack', nameBn: 'বস্তা', symbol: 'bag' }
];

export const BANGLADESH_LOCATIONS: LocationDivision[] = [
  {
    id: 1,
    nameEn: 'Dhaka',
    nameBn: 'ঢাকা',
    districts: [
      { id: 101, nameEn: 'Dhaka', nameBn: 'ঢাকা', upazilas: [{ id: 1001, nameEn: 'Savar', nameBn: 'সাভার' }, { id: 1002, nameEn: 'Dhamrai', nameBn: 'ধামরাই' }, { id: 1003, nameEn: 'Keraniganj', nameBn: 'কেরানীগঞ্জ' }] },
      { id: 102, nameEn: 'Gazipur', nameBn: 'গাজীপুর', upazilas: [{ id: 1004, nameEn: 'Sreepur', nameBn: 'শ্রীপুর' }, { id: 1005, nameEn: 'Kapasia', nameBn: 'কাপাসিয়া' }, { id: 1006, nameEn: 'Kaliakair', nameBn: 'কালিয়াকৈর' }] },
      { id: 103, nameEn: 'Tangail', nameBn: 'টাঙ্গাইল', upazilas: [{ id: 1007, nameEn: 'Ghatail', nameBn: 'ঘাটাইল' }, { id: 1008, nameEn: 'Madhupur', nameBn: 'মধুপুর' }, { id: 1009, nameEn: 'Sakhipur', nameBn: 'সখিপুর' }] },
      { id: 104, nameEn: 'Munshiganj', nameBn: 'মুন্সীগঞ্জ', upazilas: [{ id: 1010, nameEn: 'Sirajdikhan', nameBn: 'সিরাজদিখান' }, { id: 1011, nameEn: 'Tongibari', nameBn: 'টঙ্গিবাড়ী' }] },
      { id: 105, nameEn: 'Narsingdi', nameBn: 'নরসিংদী', upazilas: [{ id: 1012, nameEn: 'Shibpur', nameBn: 'শিবপুর' }, { id: 1013, nameEn: 'Raipura', nameBn: 'রায়পুরা' }] },
      { id: 106, nameEn: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ', upazilas: [{ id: 1014, nameEn: 'Araihazar', nameBn: 'আড়াইহাজার' }, { id: 1015, nameEn: 'Sonargaon', nameBn: 'সোনারগাঁ' }] },
      { id: 107, nameEn: 'Faridpur', nameBn: 'ফরিদপুর', upazilas: [{ id: 1014, nameEn: 'Bhanga', nameBn: 'ভাঙ্গা' }, { id: 1015, nameEn: 'Boalmari', nameBn: 'বোয়ালমারী' }] },
      { id: 108, nameEn: 'Madaripur', nameBn: 'মাদারীপুর', upazilas: [{ id: 1016, nameEn: 'Shibchar', nameBn: 'শিবচর' }, { id: 1017, nameEn: 'Rajoir', nameBn: 'রাজৈর' }] },
      { id: 109, nameEn: 'Gopalganj', nameBn: 'গোপালগঞ্জ', upazilas: [{ id: 1018, nameEn: 'Kotalipara', nameBn: 'কোটালীপাড়া' }, { id: 1019, nameEn: 'Tungipara', nameBn: 'টুঙ্গিপাড়া' }] },
      { id: 110, nameEn: 'Rajbari', nameBn: 'রাজবাড়ী', upazilas: [{ id: 1020, nameEn: 'Pangsha', nameBn: 'পাংশা' }] },
      { id: 111, nameEn: 'Manikganj', nameBn: 'মানিকগঞ্জ', upazilas: [{ id: 1021, nameEn: 'Singair', nameBn: 'সিংগাইর' }] },
      { id: 112, nameEn: 'Shariatpur', nameBn: 'শরীয়তপুর', upazilas: [{ id: 1022, nameEn: 'Naria', nameBn: 'নড়িয়া' }] },
      { id: 113, nameEn: 'Kishoreganj', nameBn: 'কিশোরগঞ্জ', upazilas: [{ id: 1023, nameEn: 'Bhairab', nameBn: 'ভৈরব' }] }
    ]
  },
  {
    id: 2,
    nameEn: 'Chattogram',
    nameBn: 'চট্টগ্রাম',
    districts: [
      { id: 114, nameEn: 'Chattogram', nameBn: 'চট্টগ্রাম', upazilas: [{ id: 1016, nameEn: 'Hathazari', nameBn: 'হাটহাজারী' }, { id: 1017, nameEn: 'Mirsarai', nameBn: 'মীরসরাই' }, { id: 1018, nameEn: 'Patiya', nameBn: 'পটিয়া' }] },
      { id: 115, nameEn: 'Cox\'s Bazar', nameBn: 'কক্সবাজার', upazilas: [{ id: 1019, nameEn: 'Chakaria', nameBn: 'চকোরিয়া' }, { id: 1020, nameEn: 'Teknaf', nameBn: 'টেকনাফ' }] },
      { id: 116, nameEn: 'Cumilla', nameBn: 'কুমিল্লা', upazilas: [{ id: 1021, nameEn: 'Chandina', nameBn: 'চান্দিনা' }, { id: 1022, nameEn: 'Daudkandi', nameBn: 'দাউদকান্দি' }] },
      { id: 117, nameEn: 'Feni', nameBn: 'ফেনী', upazilas: [{ id: 1023, nameEn: 'Daganbhuiyan', nameBn: 'দাগনভূঞা' }] },
      { id: 118, nameEn: 'Noakhali', nameBn: 'নোয়াখালী', upazilas: [{ id: 1024, nameEn: 'Begumganj', nameBn: 'বেগমগঞ্জ' }] },
      { id: 119, nameEn: 'Lakshmipur', nameBn: 'লক্ষ্মীপুর', upazilas: [{ id: 1025, nameEn: 'Ramgati', nameBn: 'রামগতি' }] },
      { id: 120, nameEn: 'Brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া', upazilas: [{ id: 1026, nameEn: 'Nabinagar', nameBn: 'নবীনগর' }] },
      { id: 121, nameEn: 'Chandpur', nameBn: 'চাঁদপুর', upazilas: [{ id: 1027, nameEn: 'Hajiganj', nameBn: 'হাজীগঞ্জ' }] },
      { id: 122, nameEn: 'Khagrachhari', nameBn: 'খাগড়াছড়ি', upazilas: [{ id: 1028, nameEn: 'Dighinala', nameBn: 'দীঘিনালা' }] },
      { id: 123, nameEn: 'Rangamati', nameBn: 'রাঙ্গামাটি', upazilas: [{ id: 1029, nameEn: 'Kaptai', nameBn: 'কাপ্তাই' }] },
      { id: 134, nameEn: 'Bandarban', nameBn: 'বান্দরবান', upazilas: [{ id: 1030, nameEn: 'Lama', nameBn: 'লামা' }] }
    ]
  },
  {
    id: 3,
    nameEn: 'Rajshahi',
    nameBn: 'রাজশাহী',
    districts: [
      { id: 125, nameEn: 'Rajshahi', nameBn: 'রাজশাহী', upazilas: [{ id: 1023, nameEn: 'Godagari', nameBn: 'গোদাগাড়ী' }, { id: 1024, nameEn: 'Tanore', nameBn: 'তানোর' }, { id: 1025, nameEn: 'Paba', nameBn: 'পবা' }] },
      { id: 126, nameEn: 'Bogura', nameBn: 'বগুড়া', upazilas: [{ id: 1026, nameEn: 'Shibganj', nameBn: 'শিবগঞ্জ' }, { id: 1027, nameEn: 'Shahjahanpur', nameBn: 'শাহজাহানপুর' }, { id: 1028, nameEn: 'Kahaloo', nameBn: 'কাহালু' }, { id: 1029, nameEn: 'Sherpur', nameBn: 'শেরপুর' }] },
      { id: 127, nameEn: 'Naogaon', nameBn: 'নওগাঁ', upazilas: [{ id: 1030, nameEn: 'Mahadevpur', nameBn: 'মহাদেবপুর' }, { id: 1031, nameEn: 'Dhamoirhat', nameBn: 'ধামইরহাট' }, { id: 1032, nameEn: 'Patnitala', nameBn: 'পত্নীতলা' }] },
      { id: 128, nameEn: 'Pabna', nameBn: 'পাবনা', upazilas: [{ id: 1033, nameEn: 'Santhia', nameBn: 'সাঁথিয়া' }, { id: 1034, nameEn: 'Ishwardi', nameBn: 'ঈশ্বরদী' }, { id: 1035, nameEn: 'Sujanagar', nameBn: 'সুজানগর' }] },
      { id: 129, nameEn: 'Sirajganj', nameBn: 'সিরাজগঞ্জ', upazilas: [{ id: 1036, nameEn: 'Shahjadpur', nameBn: 'শাহজাদপুর' }, { id: 1037, nameEn: 'Ullahpara', nameBn: 'উল্লাপাড়া' }] },
      { id: 130, nameEn: 'Natore', nameBn: 'নাটোর', upazilas: [{ id: 1038, nameEn: 'Singra', nameBn: 'সিংড়া' }] },
      { id: 131, nameEn: 'Chapainawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ', upazilas: [{ id: 1038, nameEn: 'Shibganj', nameBn: 'শিবগঞ্জ' }, { id: 1039, nameEn: 'Nachole', nameBn: 'নাচোল' }] },
      { id: 132, nameEn: 'Joypurhat', nameBn: 'জয়পুরহাট', upazilas: [{ id: 1040, nameEn: 'Panchbibi', nameBn: 'পাঁচবিবি' }] }
    ]
  },
  {
    id: 4,
    nameEn: 'Rangpur',
    nameBn: 'রংপুর',
    districts: [
      { id: 133, nameEn: 'Rangpur', nameBn: 'রংপুর', upazilas: [{ id: 1040, nameEn: 'Mithapukur', nameBn: 'মিঠাপুকুর' }, { id: 1041, nameEn: 'Pirganj', nameBn: 'পীরগঞ্জ' }] },
      { id: 134, nameEn: 'Dinajpur', nameBn: 'দিনাজপুর', upazilas: [{ id: 1042, nameEn: 'Birganj', nameBn: 'বীরগঞ্জ' }, { id: 1043, nameEn: 'Nawabganj', nameBn: 'নবাবগঞ্জ' }, { id: 1044, nameEn: 'Phulbari', nameBn: 'ফুলবাড়ী' }] },
      { id: 135, nameEn: 'Gaibandha', nameBn: 'গাইবান্ধা', upazilas: [{ id: 1045, nameEn: 'Gobindaganj', nameBn: 'গোবিন্দগঞ্জ' }] },
      { id: 136, nameEn: 'Kurigram', nameBn: 'কুড়িগ্রাম', upazilas: [{ id: 1046, nameEn: 'Nageshwari', nameBn: 'নাগেশ্বরী' }] },
      { id: 137, nameEn: 'Lalmonirhat', nameBn: 'লালমনিরহাট', upazilas: [{ id: 1047, nameEn: 'Patgram', nameBn: 'পাটগ্রাম' }] },
      { id: 138, nameEn: 'Nilphamari', nameBn: 'নীলফামারী', upazilas: [{ id: 1048, nameEn: 'Saidpur', nameBn: 'সৈয়দপুর' }] },
      { id: 139, nameEn: 'Panchagarh', nameBn: 'পঞ্চগড়', upazilas: [{ id: 1045, nameEn: 'Tetulia', nameBn: 'তেঁতুলিয়া' }] },
      { id: 140, nameEn: 'Thakurgaon', nameBn: 'ঠাকুরগাঁও', upazilas: [{ id: 1049, nameEn: 'Pirganj', nameBn: 'পীরগঞ্জ' }] }
    ]
  },
  {
    id: 5,
    nameEn: 'Khulna',
    nameBn: 'খুলনা',
    districts: [
      { id: 141, nameEn: 'Khulna', nameBn: 'খুলনা', upazilas: [{ id: 1046, nameEn: 'Dumuria', nameBn: 'ডুমুরিয়া' }] },
      { id: 142, nameEn: 'Satkhira', nameBn: 'সাতক্ষীরা', upazilas: [{ id: 1047, nameEn: 'Shyamnagar', nameBn: 'শ্যামনগর' }, { id: 1048, nameEn: 'Kaliganj', nameBn: 'কালীগঞ্জ' }] },
      { id: 143, nameEn: 'Jessore', nameBn: 'যশোর', upazilas: [{ id: 1049, nameEn: 'Jhikargacha', nameBn: 'ঝিকরগাছা' }, { id: 1050, nameEn: 'Sharsha', nameBn: 'শার্শা' }] },
      { id: 144, nameEn: 'Bagerhat', nameBn: 'বাগেরহাট', upazilas: [{ id: 1051, nameEn: 'Mongla', nameBn: 'মংলা' }] },
      { id: 145, nameEn: 'Chuadanga', nameBn: 'চুয়াডাঙ্গা', upazilas: [{ id: 1052, nameEn: 'Damurhuda', nameBn: 'দামুড়হুদা' }] },
      { id: 146, nameEn: 'Jhenaidah', nameBn: 'ঝিনাইদহ', upazilas: [{ id: 1053, nameEn: 'Shailkupa', nameBn: 'শৈলকুপা' }] },
      { id: 147, nameEn: 'Kushtia', nameBn: 'কুষ্টিয়া', upazilas: [{ id: 1051, nameEn: 'Kumarkhali', nameBn: 'কুমারখালী' }, { id: 1052, nameEn: 'Daulatpur', nameBn: 'দৌলতপুর' }] },
      { id: 148, nameEn: 'Magura', nameBn: 'মাগুরা', upazilas: [{ id: 1054, nameEn: 'Shreepur', nameBn: 'শ্রীপুর' }] },
      { id: 149, nameEn: 'Meherpur', nameBn: 'মেহেরপুর', upazilas: [{ id: 1055, nameEn: 'Gangni', nameBn: 'গাংনী' }] },
      { id: 150, nameEn: 'Narail', nameBn: 'নড়াইল', upazilas: [{ id: 1056, nameEn: 'Kalia', nameBn: 'কালিয়া' }] }
    ]
  },
  {
    id: 6,
    nameEn: 'Barishal',
    nameBn: 'বরিশাল',
    districts: [
      { id: 151, nameEn: 'Barishal', nameBn: 'বরিশাল', upazilas: [{ id: 1053, nameEn: 'Babuganj', nameBn: 'বাবুগঞ্জ' }, { id: 1054, nameEn: 'Gournadi', nameBn: 'গৌরনদী' }] },
      { id: 152, nameEn: 'Barguna', nameBn: 'বরগুনা', upazilas: [{ id: 1057, nameEn: 'Amtali', nameBn: 'আমতলী' }] },
      { id: 153, nameEn: 'Bhola', nameBn: 'ভোলা', upazilas: [{ id: 1055, nameEn: 'Char Fasson', nameBn: 'চরফ্যাশন' }] },
      { id: 154, nameEn: 'Jhalokati', nameBn: 'ঝালকাঠি', upazilas: [{ id: 1058, nameEn: 'Rajapur', nameBn: 'রাজাপুর' }] },
      { id: 155, nameEn: 'Patuakhali', nameBn: 'পটুয়াখালী', upazilas: [{ id: 1059, nameEn: 'Kalapara', nameBn: 'কলাপাড়া' }] },
      { id: 156, nameEn: 'Pirojpur', nameBn: 'পিরোজপুর', upazilas: [{ id: 1060, nameEn: 'Mathbaria', nameBn: 'মঠবাড়িয়া' }] }
    ]
  },
  {
    id: 7,
    nameEn: 'Sylhet',
    nameBn: 'সিলেট',
    districts: [
      { id: 157, nameEn: 'Sylhet', nameBn: 'সিলেট', upazilas: [{ id: 1056, nameEn: 'Beanibazar', nameBn: 'বিয়ানীবাজার' }, { id: 1057, nameEn: 'Golapganj', nameBn: 'গোলাপগঞ্জ' }] },
      { id: 158, nameEn: 'Habiganj', nameBn: 'হবিগঞ্জ', upazilas: [{ id: 1061, nameEn: 'Madhabpur', nameBn: 'মাধবপুর' }] },
      { id: 159, nameEn: 'Moulvibazar', nameBn: 'মৌলভীবাজার', upazilas: [{ id: 1058, nameEn: 'Sreemangal', nameBn: 'শ্রীমঙ্গল' }] },
      { id: 160, nameEn: 'Sunamganj', nameBn: 'সুনামগঞ্জ', upazilas: [{ id: 1062, nameEn: 'Jagannathpur', nameBn: 'জগন্নাথপুর' }] }
    ]
  },
  {
    id: 8,
    nameEn: 'Mymensingh',
    nameBn: 'ময়মনসিংহ',
    districts: [
      { id: 161, nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ', upazilas: [{ id: 1059, nameEn: 'Trishal', nameBn: 'ত্রিশাল' }, { id: 1060, nameEn: 'Muktagachha', nameBn: 'মুক্তাগাছা' }, { id: 1061, nameEn: 'Bhaluka', nameBn: 'ভালুকা' }] },
      { id: 162, nameEn: 'Jamalpur', nameBn: 'জামালপুর', upazilas: [{ id: 1062, nameEn: 'Islampur', nameBn: 'ইসলামপুর' }] },
      { id: 163, nameEn: 'Netrokona', nameBn: 'নেত্রকোণা', upazilas: [{ id: 1063, nameEn: 'Kendua', nameBn: 'কেন্দুয়া' }] },
      { id: 164, nameEn: 'Sherpur', nameBn: 'শেরপুর', upazilas: [{ id: 1063, nameEn: 'Nalitabari', nameBn: 'নালিতাবাড়ী' }] }
    ]
  }
];

export const INITIAL_LISTINGS: SupplyListing[] = [
  {
    id: 'lst-101',
    createdByUserId: 'usr-farm-1',
    ownerUserId: 'usr-farm-1',
    sellerName: 'Hafizur Rahman',
    sellerPhone: '+8801711987654',
    isSellerVerified: true,
    sellerType: 'farmer',
    categoryId: 1,
    categoryNameEn: 'Potato',
    categoryNameBn: 'আলু',
    title: '৫ টন প্রিমিয়াম বগুড়া গ্রানোলা ডায়মন্ড আলু (5 Tons Bogra Diamond Potato)',
    description: 'শিবগঞ্জ হিমাগার সংলগ্ন ক্ষেত থেকে তাজা সংগৃহীত ডায়মন্ড গ্রেড-১ আলু। সরাসরি বাল্ক ট্রাক লোড সুবিধা রয়েছে।',
    quantity: 5,
    unitId: 2,
    unitSymbol: 'ton',
    unitSymbolBn: 'টন',
    expectedPricePerUnit: 24000,
    currency: 'BDT',
    divisionId: 1,
    divisionNameEn: 'Rajshahi',
    districtId: 101,
    districtNameEn: 'Bogra',
    districtNameBn: 'বগুড়া',
    upazilaId: 1001,
    upazilaNameEn: 'Shibganj',
    upazilaNameBn: 'শিবগঞ্জ',
    unionName: 'মহাস্থান ইউনিয়ন',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fit=crop&w=800&q=80'
    ],
    availableFrom: '2026-08-05',
    viewCount: 142,
    contactCount: 18,
    createdAt: '2026-08-03T10:15:00Z'
  },
  {
    id: 'lst-102',
    createdByUserId: 'usr-farm-2',
    ownerUserId: 'usr-farm-2',
    sellerName: 'Gazipur Layer Poultry Farm (Kabir Hossain)',
    sellerPhone: '+8801819223344',
    isSellerVerified: true,
    sellerType: 'farmer',
    categoryId: 2,
    categoryNameEn: 'Egg & Poultry',
    categoryNameBn: 'ডিম ও পোল্ট্রি',
    title: '১০,০০০ পিস তাজা ফার্মের লাল ডিম (10,000 Pcs Brown Farm Eggs)',
    description: 'শ্রীপুর উপজেলার আধুনিক লেয়ার ফার্ম থেকে দৈনন্দিন তাজা ডিম। খামারে এসে সরাসরি পাইকারি গাড়িতে লোডের সুযোগ।',
    quantity: 10000,
    unitId: 4,
    unitSymbol: 'pcs',
    unitSymbolBn: 'পিস',
    expectedPricePerUnit: 10.20,
    currency: 'BDT',
    divisionId: 2,
    divisionNameEn: 'Dhaka',
    districtId: 201,
    districtNameEn: 'Gazipur',
    districtNameBn: 'গাজীপুর',
    upazilaId: 2001,
    upazilaNameEn: 'Sreepur',
    upazilaNameBn: 'শ্রীপুর',
    unionName: 'মাওনা ইউনিয়ন',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80'
    ],
    availableFrom: '2026-08-04',
    viewCount: 215,
    contactCount: 34,
    createdAt: '2026-08-03T14:30:00Z'
  },
  {
    id: 'lst-103',
    createdByUserId: 'usr-farm-3',
    ownerUserId: 'usr-farm-3',
    sellerName: 'Shatkhira White Gold Shrimp (Abul Kashem)',
    sellerPhone: '+8801733445566',
    isSellerVerified: true,
    sellerType: 'farmer',
    categoryId: 3,
    categoryNameEn: 'Fish & Aquaculture',
    categoryNameBn: 'মাছ ও মৎস্য',
    title: '৮০০ কেজি তাজা গলদা ও বাগদা চিংড়ি (800 Kg Fresh Golda & Bagda Shrimp)',
    description: 'শ্যামনগর উপজেলার লবণাক্ত পানির ঘের থেকে সরাসরি আহরণকৃত এক্সপোর্ট গ্রেড বাগদা চিংড়ি। বরফসহ ইনসুলেটেড গাড়িতে লোড যোগ্য।',
    quantity: 800,
    unitId: 1,
    unitSymbol: 'kg',
    unitSymbolBn: 'কেজি',
    expectedPricePerUnit: 780,
    currency: 'BDT',
    divisionId: 3,
    divisionNameEn: 'Khulna',
    districtId: 301,
    districtNameEn: 'Shatkhira',
    districtNameBn: 'সাতক্ষীরা',
    upazilaId: 3001,
    upazilaNameEn: 'Shyamnagar',
    upazilaNameBn: 'শ্যামনগর',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80'
    ],
    availableFrom: '2026-08-06',
    viewCount: 98,
    contactCount: 12,
    createdAt: '2026-08-03T16:00:00Z'
  },
  {
    id: 'lst-104',
    createdByUserId: 'usr-farm-4',
    ownerUserId: 'usr-farm-4',
    sellerName: 'Naogaon Miniket Rice Mill (Jamal Uddin)',
    sellerPhone: '+8801912345678',
    isSellerVerified: true,
    sellerType: 'aggregator',
    categoryId: 4,
    categoryNameEn: 'Rice & Paddy',
    categoryNameBn: 'ধান ও চাল',
    title: '২০ টন সরু মিনিকেট চাল - ৫০ কেজি বস্তা (20 Tons Miniket Rice Sacks)',
    description: 'মহাদেবপুর হাস্কিং মিল থেকে অটোমেটিক রাইস মিলিংকৃত প্রিমিয়াম মিনিকেট চাল। ৫০ কেজি বস্তায় প্রসেসড।',
    quantity: 20,
    unitId: 2,
    unitSymbol: 'ton',
    unitSymbolBn: 'টন',
    expectedPricePerUnit: 68000,
    currency: 'BDT',
    divisionId: 1,
    divisionNameEn: 'Rajshahi',
    districtId: 102,
    districtNameEn: 'Naogaon',
    districtNameBn: 'নওগাঁ',
    upazilaId: 1005,
    upazilaNameEn: 'Mohadevpur',
    upazilaNameBn: 'মহাদেবপুর',
    status: 'reserved',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80'
    ],
    availableFrom: '2026-08-04',
    viewCount: 310,
    contactCount: 45,
    createdAt: '2026-08-02T09:00:00Z'
  },
  {
    id: 'lst-105',
    createdByUserId: 'usr-agent-1',
    ownerUserId: 'usr-farm-5',
    sellerName: 'Tangail Agro Cooperative (Babul Miah)',
    sellerPhone: '+8801555667788',
    isSellerVerified: true,
    sellerType: 'cooperative',
    categoryId: 2,
    categoryNameEn: 'Egg & Poultry',
    categoryNameBn: 'ডিম ও পোল্ট্রি',
    title: '৫০,০০০ পিস সাদা ফার্ম ডিম (50,000 Pcs White Farm Eggs)',
    description: 'ঘাটাইল সমন্বিত খামার থেকে একলপ্তে সরবরাহের জন্য প্রস্তুত ৫০ হাজার ডিম। প্রতি ক্যারেটে ৩০০ পিস।',
    quantity: 50000,
    unitId: 4,
    unitSymbol: 'pcs',
    unitSymbolBn: 'পিস',
    expectedPricePerUnit: 9.80,
    currency: 'BDT',
    divisionId: 2,
    divisionNameEn: 'Dhaka',
    districtId: 202,
    districtNameEn: 'Tangail',
    districtNameBn: 'টাঙ্গাইল',
    upazilaId: 2004,
    upazilaNameEn: 'Ghatail',
    upazilaNameBn: 'ঘাটাইল',
    status: 'negotiating',
    images: [
      'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80'
    ],
    availableFrom: '2026-08-05',
    viewCount: 180,
    contactCount: 22,
    createdAt: '2026-08-03T11:20:00Z'
  },
  {
    id: 'lst-106',
    createdByUserId: 'usr-farm-6',
    ownerUserId: 'usr-farm-6',
    sellerName: 'Munshiganj Cold Storage Farmers (Alamin Sheikh)',
    sellerPhone: '+8801677889900',
    isSellerVerified: false,
    sellerType: 'farmer',
    categoryId: 1,
    categoryNameEn: 'Potato',
    categoryNameBn: 'আলু',
    title: '১৫ টন কার্ডিনাল আলু কোল্ড স্টোরেজ লট (15 Tons Cardinal Potato Lot)',
    description: 'সিরাজদিখান কোল্ড স্টোরেজে সংরক্ষিত এক গ্রেডের লাল আলু। টেস্ট ফ্রেশ এবং কালার আকর্ষণীয়।',
    quantity: 15,
    unitId: 2,
    unitSymbol: 'ton',
    unitSymbolBn: 'টন',
    expectedPricePerUnit: 26000,
    currency: 'BDT',
    divisionId: 2,
    divisionNameEn: 'Dhaka',
    districtId: 203,
    districtNameEn: 'Munshiganj',
    districtNameBn: 'মুন্সীগঞ্জ',
    upazilaId: 2006,
    upazilaNameEn: 'Sirajdikhan',
    upazilaNameBn: 'সিরাজদিখান',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fit=crop&w=800&q=80'
    ],
    availableFrom: '2026-08-04',
    viewCount: 88,
    contactCount: 9,
    createdAt: '2026-08-03T17:45:00Z'
  }
];
