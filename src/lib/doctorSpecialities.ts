export interface DoctorSpeciality {
  specialty_en: string;
  specialty_bn: string;
}

/** Doctor/hospital category master list (Bangla labels shown as option buttons). */
export const DOCTOR_SPECIALITIES: DoctorSpeciality[] = [
  {
    "specialty_en": "General Medicine",
    "specialty_bn": "মেডিসিন বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Gynecology and Obstetrics",
    "specialty_bn": "গাইনি ও প্রসূতি বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Pediatrics",
    "specialty_bn": "শিশু রোগ বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Cardiology",
    "specialty_bn": "হৃদরোগ বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Orthopedic Surgery",
    "specialty_bn": "অর্থোপেডিক বা হাড়-জোড় ও ট্রমা বিশেষজ্ঞ"
  },
  {
    "specialty_en": "ENT (Otolaryngology)",
    "specialty_bn": "নাক, কান ও গলা বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Dermatology and Venereology",
    "specialty_bn": "চর্ম ও যৌন রোগ বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Ophthalmology",
    "specialty_bn": "চক্ষু বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Dentistry",
    "specialty_bn": "ডেন্টিস্ট বা দন্ত চিকিৎসক"
  },
  {
    "specialty_en": "Neuromedicine",
    "specialty_bn": "নিউরোমেডিসিন বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Gastroenterology",
    "specialty_bn": "গ্যাস্ট্রোএন্টারোলজি বা পরিপাকতন্ত্র বিশেষজ্ঞ"
  },
  {
    "specialty_en": "General Surgery",
    "specialty_bn": "সাধারণ শল্যচিকিৎসক"
  },
  {
    "specialty_en": "Nephrology",
    "specialty_bn": "কিডনি রোগ বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Endocrinology and Diabetology",
    "specialty_bn": "ডায়াবেটিস ও হরমোন রোগ বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Psychiatry",
    "specialty_bn": "মনোরোগ বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Oncology",
    "specialty_bn": "ক্যান্সার বা অনকোলজি বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Pulmonology / Chest Medicine",
    "specialty_bn": "বক্ষব্যাধি বা ফুসফুস রোগ বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Physical Medicine and Rheumatology",
    "specialty_bn": "বাত, ব্যথা ও ফিজিক্যাল মেডিসিন বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Urology",
    "specialty_bn": "ইউরোলজি বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Hematology",
    "specialty_bn": "রক্ত রোগ বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Hepatology",
    "specialty_bn": "লিভার ও পরিপাকতন্ত্র বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Burn and Plastic Surgery",
    "specialty_bn": "বার্ন ও প্লাস্টিক সার্জারি বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Vascular Surgery",
    "specialty_bn": "রক্তনালী ও শিরা সংক্রান্ত সার্জারি বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Breast and Onco-Surgery",
    "specialty_bn": "ব্রেস্ট ও অনকো-সার্জারি বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Neurosurgery",
    "specialty_bn": "ব্রেন ও স্পাইনাল কর্ড সার্জারি বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Radiology and Imaging",
    "specialty_bn": "রেডিওলজি ও ইমেজিং বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Pathology and Laboratory Medicine",
    "specialty_bn": "প্যাথোলজি ও ল্যাবরেটরি মেডিসিন"
  },
  {
    "specialty_en": "Physiotherapy",
    "specialty_bn": "ফিজিওথেরাপিস্ট"
  },
  {
    "specialty_en": "Nutrition and Dietetics",
    "specialty_bn": "পুষ্টিবিদ বা ডায়েটিশিয়ান"
  },
  {
    "specialty_en": "Homeopathic and Alternative Medicine",
    "specialty_bn": "হোমিওপ্যাথিক বা অলটারনেটিভ মেডিকেল প্র্যাকটিশনার"
  },
  {
    "specialty_en": "Ayurvedic Medicine",
    "specialty_bn": "আয়ুর্বেদিক চিকিৎসক"
  },
  {
    "specialty_en": "Unani Medicine",
    "specialty_bn": "ইউনানি চিকিৎসক"
  },
  {
    "specialty_en": "Neonatology",
    "specialty_bn": "নবজাতক ও শিশু রোগ বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Infectious Diseases",
    "specialty_bn": "সংক্রামক ব্যাধি বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Geriatric Medicine",
    "specialty_bn": "বয়স্কদের রোগ ও জেরিয়াট্রিক বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Critical Care Medicine",
    "specialty_bn": "আইসিইউ ও ক্রিটিক্যাল কেয়ার বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Emergency Medicine",
    "specialty_bn": "জরুরি বিভাগ বা ইমার্জেন্সি মেডিসিন বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Pain Management",
    "specialty_bn": "পেইন ম্যানেজমেন্ট বা ব্যথা নিরাময় বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Sports Medicine",
    "specialty_bn": "স্পোর্টস মেডিসিন বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Cardiothoracic Surgery",
    "specialty_bn": "হৃদপিণ্ড ও বক্ষব্যাধি শল্যচিকিৎসক"
  },
  {
    "specialty_en": "Pediatric Surgery",
    "specialty_bn": "শিশু সার্জারি বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Colorectal Surgery",
    "specialty_bn": "পাইলস, ফিস্টুলা ও কোলরেকটাল সার্জারি বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Maxillofacial Surgery",
    "specialty_bn": "মুখ ও চোদালের সার্জারি বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Orthodontics",
    "specialty_bn": "অর্থোডন্টিক্স বা ডেন্টাল ব্রেসেস বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Prosthodontics",
    "specialty_bn": "প্রোস্থোডন্টিক্স বা দাঁত বাঁধানো বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Conservative Dentistry and Endodontics",
    "specialty_bn": "রুট ক্যানেল ও ডেন্টাল কনজারভেশন বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Periodontology",
    "specialty_bn": "মাড়ির রোগ ও ডেন্টাল বিশেষজ্ঞ"
  },
  {
    "specialty_en": "Clinical Psychology",
    "specialty_bn": "ক্লিনিক্যাল সাইকোলজি বা মানসিক স্বাস্থ্য পরামর্শক"
  },
  {
    "specialty_en": "Speech and Language Therapy",
    "specialty_bn": "স্পিচ ও ল্যাঙ্গুয়েজ থেরাপিস্ট"
  },
  {
    "specialty_en": "Occupational Therapy",
    "specialty_bn": "অকুপেশনাল থেরাপিস্ট"
  }
];
