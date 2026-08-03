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
    nameEn: 'Rajshahi',
    nameBn: 'রাজশাহী',
    districts: [
      {
        id: 101,
        nameEn: 'Bogra',
        nameBn: 'বগুড়া',
        upazilas: [
          { id: 1001, nameEn: 'Shibganj', nameBn: 'শিবগঞ্জ' },
          { id: 1002, nameEn: 'Mahasthangarh', nameBn: 'মহাস্থানগড়' },
          { id: 1003, nameEn: 'Saharjan', nameBn: 'শাহজাহানপুর' },
          { id: 1004, nameEn: 'Kahaloo', nameBn: 'কাহালু' }
        ]
      },
      {
        id: 102,
        nameEn: 'Naogaon',
        nameBn: 'নওগাঁ',
        upazilas: [
          { id: 1005, nameEn: 'Mohadevpur', nameBn: 'মহাদেবপুর' },
          { id: 1006, nameEn: 'Dhamoirhat', nameBn: 'ধামইরহাট' }
        ]
      }
    ]
  },
  {
    id: 2,
    nameEn: 'Dhaka',
    nameBn: 'ঢাকা',
    districts: [
      {
        id: 201,
        nameEn: 'Gazipur',
        nameBn: 'গাজীপুর',
        upazilas: [
          { id: 2001, nameEn: 'Sreepur', nameBn: 'শ্রীপুর' },
          { id: 2002, nameEn: 'Kapasia', nameBn: 'কাপাসিয়া' },
          { id: 2003, nameEn: 'Kaliakair', nameBn: 'কালিয়াকৈর' }
        ]
      },
      {
        id: 202,
        nameEn: 'Tangail',
        nameBn: 'টাঙ্গাইল',
        upazilas: [
          { id: 2004, nameEn: 'Ghatail', nameBn: 'ঘাটাইল' },
          { id: 2005, nameEn: 'Sakhipur', nameBn: 'সখিপুর' }
        ]
      },
      {
        id: 203,
        nameEn: 'Munshiganj',
        nameBn: 'মুন্সীগঞ্জ',
        upazilas: [
          { id: 2006, nameEn: 'Sirajdikhan', nameBn: 'সিরাজদিখান' },
          { id: 2007, nameEn: 'Tongibari', nameBn: 'টঙ্গিবাড়ী' }
        ]
      }
    ]
  },
  {
    id: 3,
    nameEn: 'Khulna',
    nameBn: 'খুলনা',
    districts: [
      {
        id: 301,
        nameEn: 'Shatkhira',
        nameBn: 'সাতক্ষীরা',
        upazilas: [
          { id: 3001, nameEn: 'Shyamnagar', nameBn: 'শ্যামনগর' },
          { id: 3002, nameEn: 'Kaliganj', nameBn: 'কালীগঞ্জ' }
        ]
      },
      {
        id: 302,
        nameEn: 'Jessore',
        nameBn: 'যশোর',
        upazilas: [
          { id: 3003, nameEn: 'Jhikargachha', nameBn: 'ঝিকরগাছা' },
          { id: 3004, nameEn: 'Sharsha', nameBn: 'শার্শা' }
        ]
      }
    ]
  },
  {
    id: 4,
    nameEn: 'Mymensingh',
    nameBn: 'ময়মনসিংহ',
    districts: [
      {
        id: 401,
        nameEn: 'Mymensingh Sadar',
        nameBn: 'ময়মনসিংহ সদর',
        upazilas: [
          { id: 4001, nameEn: 'Trishal', nameBn: 'ত্রিশাল' },
          { id: 4002, nameEn: 'Fulbaria', nameBn: 'ফুলবাড়ীয়া' }
        ]
      }
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
