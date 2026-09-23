/**
 * EDITABLE — Terms & Conditions (শর্তাবলী)
 * Route: /terms
 * Ekhane text change korlei website e update hobe.
 */

export const TERMS_UPDATED = "২০২৬-০৯-২৩";

export const TERMS_BN: { heading: string; body: string[] }[] = [
  {
    heading: "১. প্ল্যাটফর্ম কী করে",
    body: [
      "মিস্টার ডাক্তার রোগীকে সবার আগে ডাক্তারের কাছে পৌঁছে দেয়। রোগী আমাদের সফটওয়্যারের মাধ্যমে ডাক্তারের সিরিয়াল বুক করেন এবং অগ্রিম পেমেন্ট দিয়ে সিরিয়াল কনফার্ম করেন। নির্ধারিত সময়ে রোগী চেম্বারে গিয়ে ডাক্তারের সেবা নেন।",
      "রোগীর পেমেন্ট সেবা দেওয়ার পর পরবর্তীতে ডাক্তার/হাসপাতালকে পরিশোধ করা হয়। সরাসরি চেম্বারে গিয়ে সিরিয়াল বুক করলেও সেটি আমাদের সফটওয়্যারে কানেক্ট/সিঙ্ক হয়, ফলে ডাবল বুকিং হয় না।",
    ],
  },
  {
    heading: "২. সিরিয়াল বুকিং ও পেমেন্ট (BDT)",
    body: [
      "সকল ফি বাংলাদেশি টাকায় (BDT / ৳) দেখানো হয়। অনলাইনে সিরিয়াল কনফার্ম করতে নির্ধারিত ভিজিট ফি + প্রযোজ্য সার্ভিস চার্জ অগ্রিম পরিশোধ করতে হয়।",
      "পেমেন্ট সফল হলেই সিরিয়ালটি সফটওয়্যারে যোগ হয় ও কনফার্ম বলে গণ্য হয়। পেমেন্ট ছাড়া অনুরোধটি পেন্ডিং থাকে।",
    ],
  },
  {
    heading: "৩. ডাক্তার ও হাসপাতালের দায়িত্ব এবং ম্যানেজমেন্ট",
    body: [
      "ডাক্তার এবং হাসপাতাল কর্তৃপক্ষ শুধুমাত্র **আজকের পেন্ডিং অ্যাপয়েন্টমেন্টগুলো** গ্রহণ ও পরিচালনা করতে পারবেন।",
      "তাদের নিজ নিজ চেম্বার বা হাসপাতালের অভ্যন্তরীণ লোকাল ম্যানেজমেন্ট ও ব্যবস্থাপনা তাদেরকে সম্পূর্ণ নিজ দায়িত্বে পালন করতে হবে।",
      "মিস্টার ডাক্তার শুধুমাত্র অনলাইনে বুকিংয়ের ক্ষেত্রে হিসাব-নিকাশ এবং অন্যান্য প্রাসঙ্গিক বিষয়গুলোর ওপর মনিটরিং করে থাকে; বাকি অভ্যন্তরীণ অপারেশন ও ব্যবস্থাপনা সম্পূর্ণ সংশ্লিষ্ট কর্তৃপক্ষ নিজেদের দায়িত্বে পরিচালনা করবে।",
    ],
  },
  {
    heading: "৪. রোগীর দায়িত্ব",
    body: [
      "সঠিক নাম, মোবাইল নম্বর ও সমস্যার বিবরণ দিতে হবে। ভুল তথ্যের কারণে সিরিয়াল মিস হলে কর্তৃপক্ষ দায়ী থাকবে না।",
      "নির্ধারিত সময়ের কমপক্ষে ১৫–৩০ মিনিট আগে চেম্বারে উপস্থিত থাকুন এবং কনফার্মেশন SMS/মেসেজটি সঙ্গে রাখুন।",
    ],
  },
  {
    heading: "৫. ডাক্তার/চেম্বারের পরিবর্তন",
    body: [
      "অনিবার্য কারণে (জরুরি অপারেশন, অসুস্থতা, প্রাকৃতিক দুর্যোগ) ডাক্তারের সময় পরিবর্তন বা বাতিল হতে পারে। এমন হলে রোগীকে আগেই জানানো হবে এবং রিশিডিউল বা রিফান্ডের অপশন দেওয়া হবে (দেখুন /refund)।",
    ],
  },
  {
    heading: "৬. চিকিৎসা সংক্রান্ত দাবিত্যাগ",
    body: [
      "মিস্টার ডাক্তার নিজে চিকিৎসা দেয় না — চিকিৎসা দেন সংশ্লিষ্ট নিবন্ধিত ডাক্তার। রোগ নির্ণয়, প্রেসক্রিপশন ও চিকিৎসার সম্পূর্ণ দায়িত্ব সেই ডাক্তারের।",
      "জরুরি অবস্থায় (শ্বাসকষ্ট, বুকে ব্যথা, দুর্ঘটনা) অনলাইন সিরিয়ালের অপেক্ষা না করে নিকটস্থ জরুরি বিভাগে যান।",
    ],
  },
  {
    heading: "৭. অপব্যবহার",
    body: [
      "ভুয়া বুকিং, ভুয়া রিভিউ, বা সিস্টেমের অপব্যবহার প্রমাণিত হলে অ্যাকাউন্ট/সিরিয়াল বাতিল করা হতে পারে।",
    ],
  },
  {
    heading: "৮. যোগাযোগ",
    body: [
      "শর্তাবলী নিয়ে প্রশ্ন থাকলে /contact পেজের ঠিকানা ও ফোনে যোগাযোগ করুন।",
    ],
  },
];

export const TERMS_EN: { heading: string; body: string[] }[] = [
  {
    heading: "1. What the platform does",
    body: [
      "MrDoctor connects patients to doctors first. Patients book a serial through our software and pay in advance to confirm it, then visit the chamber at the scheduled time to receive care.",
      "Patient payments are settled to the doctor/hospital after the service is delivered. Walk-in bookings made directly at the chamber are also synced into the same software.",
    ],
  },
  {
    heading: "2. Booking & payment (BDT)",
    body: [
      "All fees are shown in Bangladeshi Taka (BDT / ৳). A serial is confirmed only after successful advance payment; unpaid requests remain pending.",
    ],
  },
  {
    heading: "3. Doctor and Hospital Management",
    body: [
      "Doctors and hospitals can only accept and process today's pending appointments. They must manage their internal local administration independently and at their own responsibility. MrDoctor solely monitors online bookings and accounting, while all other operational matters are handled by the respective authorities.",
    ],
  },
  {
    heading: "4. Patient responsibilities",
    body: [
      "Provide accurate name, mobile number and problem description. Arrive 15–30 minutes early with your confirmation message.",
    ],
  },
  {
    heading: "5. Rescheduling",
    body: [
      "Schedules may change for emergencies. Affected patients are offered rescheduling or a refund (see /refund).",
    ],
  },
  {
    heading: "6. Medical disclaimer",
    body: [
      "MrDoctor does not provide treatment; the registered doctor does. In emergencies, go to the nearest emergency department immediately.",
    ],
  },
];