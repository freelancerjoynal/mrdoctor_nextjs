/**
 * EDITABLE — Delivery Policy (ডেলিভারি/সেবা প্রদান নীতি)
 * Route: /delivery
 * Physical product delivery নয় — "delivery" মানে serial/service delivery.
 */

export const DELIVERY_UPDATED = "২০২৬-০৯-২৩";

export const DELIVERY_BN: { heading: string; body: string[] }[] = [
  {
    heading: "১. সেবা ডেলিভারি ও সম্পূর্ণ হওয়ার নিয়ম",
    body: [
      "মিস্টার ডাক্তার সম্পূর্ণভাবে একটি ডিজিটাল সেবা প্ল্যাটফর্ম; এখানে কোনো ধরনের ভৌত পণ্য (Physical Product) ডেলিভারি করা হয় না।",
      "অনলাইন পেমেন্ট সফল হওয়ার পর সিরিয়াল কনফার্ম হওয়া মানেই সিস্টেমের প্রাথমিক ধাপ সম্পন্ন হওয়া। তবে মূল সেবা বা ডেলিভারি তখনই সম্পন্ন বলে গণ্য হবে, যখন রোগী নির্ধারিত সময়ে নিজ দায়িত্বে ডক্টরের চেম্বারে উপস্থিত হবেন এবং ডক্টরের সাথে সরাসরি সাক্ষাৎ করে চিকিৎসা সেবা গ্রহণ করবেন।",
    ],
  },
  {
    heading: "২. রোগীর নিজস্ব দায়িত্ব ও যাতায়াত",
    body: [
      "যেহেতু এটি কোনো হোম ভিজিট সার্ভিস নয়, তাই ডক্টর রোগীর বাড়িতে যাবেন না। রোগীকে অবশ্যই নিজস্ব দায়িত্বে এবং নির্ধারিত সময়ের মধ্যে সংশ্লিষ্ট ডক্টরের চেম্বার বা হাসপাতালে উপস্থিত হতে হবে।",
      "চেম্বারে পৌঁছানোর পর ডক্টরের সাথে দেখা করা এবং সেবা নেওয়া পর্যন্ত সম্পূর্ণ যাতায়াত ও উপস্থিতির দায়িত্ব রোগীর নিজের।",
    ],
  },
  {
    heading: "৩. চিকিৎসা সেবা ও সিদ্ধান্তের দায়মুক্তি",
    body: [
      "সেবা সম্পন্ন হওয়ার পর চিকিৎসাকালীন বা সেবা প্রদানের ক্ষেত্রে কোনো ধরনের ভুল চিকিৎসা, ভুল রোগ নির্ণয় বা ভুল সিদ্ধান্ত দেখা দিলে তার শতভাগ দায় সংশ্লিষ্ট ডাক্তার ও হাসপাতাল কর্তৃপক্ষকে নিজ দায়িত্বে বহন করতে হবে।",
      "এ বিষয়ে মিস্টার ডাক্তার প্ল্যাটফর্ম কোনোভাবেই দায়ী থাকবে না। যদি কোনো ধরনের অনভিপ্রেত সমস্যা বা জটিলতা সৃষ্টি হয়, তবে সংশ্লিষ্ট নিকটস্থ থানা কিংবা উপযুক্ত স্বাস্থ্যকেন্দ্রে অভিযোগ জানানোর জন্য পরামর্শ দেওয়া যাচ্ছে।",
    ],
  },
  {
    heading: "৪. কোনো ডেলিভারি বা হিডেন চার্জ নেই",
    body: [
      "এই সেবার জন্য কোনো অতিরিক্ত ডেলিভারি চার্জ বা শিপিং ফি প্রযোজ্য নয়। বুকিং করার সময় যে নির্দিষ্ট ভিজিট ফি এবং প্ল্যাটফর্ম সার্ভিস চার্জ দেখানো হয়, কেবল সেটিই প্রযোজ্য।",
    ],
  },
  {
    heading: "৫. সময়সীমা ও কনফার্মেশন",
    body: [
      "অনলাইন পেমেন্টের সঙ্গে সঙ্গে (সাধারণত কয়েক মিনিটের মধ্যে) কনফার্মেশন SMS বা নোটিফিকেশন পাঠানো হয়। সেবা প্রদানের তারিখ ও সময় হলো বুকিংয়ের সময় নির্ধারিত সাক্ষাতের সময়।",
    ],
  },
  {
    heading: "৬. ডেলিভারি না হলে (সেবা মিস হলে)",
    body: [
      "ডাক্তার চেম্বারে না থাকলে বা সেবা দিতে ব্যর্থ হলে নিয়ম অনুযায়ী রিশিডিউল বা রিফান্ড দেওয়া হয় (বিস্তারিত জানতে /refund দেখুন)।",
      "পক্ষান্তরে, রোগী নিজ দায়িত্বে সময়মতো চেম্বারে উপস্থিত না হলে (নো-শো) সেবাটি 'ডেলিভারড হয়নি — রোগীর অনুপস্থিতি' হিসেবে গণ্য হবে এবং এর জন্য প্ল্যাটফর্ম বা ডাক্তার দায়ী থাকবেন না।",
    ],
  },
];

export const DELIVERY_EN: { heading: string; body: string[] }[] = [
  {
    heading: "1. Service Delivery & Completion",
    body: [
      "MrDoctor is strictly a digital service platform; no physical goods are delivered. Service delivery is officially considered complete once the patient visits the doctor's chamber at the scheduled time and meets the doctor in person for consultation.",
    ],
  },
  {
    heading: "2. Patient's Responsibility & Travel",
    body: [
      "This is not a home-visit service; the doctor will not travel to the patient. Patients must reach the doctor's chamber or hospital independently and on time at their own responsibility.",
    ],
  },
  {
    heading: "3. Medical Treatment Liability & Disclaimer",
    body: [
      "Any incorrect treatment, misdiagnosis, or clinical decisions during or after service delivery shall be the sole responsibility of the respective doctor and hospital authority. MrDoctor bears no liability whatsoever for medical outcomes. In case of any serious issues or disputes, patients are advised to report to the nearest police station or healthcare center.",
    ],
  },
  {
    heading: "4. No Delivery or Hidden Charges",
    body: [
      "There are no physical delivery charges or shipping fees applicable. Only the specified visit fee and platform service charges shown during booking apply.",
    ],
  },
  {
    heading: "5. Timeline",
    body: [
      "Confirmation messages are sent within minutes of successful payment. The service date and time correspond to the appointment scheduled during booking.",
    ],
  },
  {
    heading: "6. Missed Service",
    body: [
      "Doctor cancellations lead to a reschedule or refund (see /refund). Patient no-shows are marked as undelivered due to absence, with no liability on the platform or doctor.",
    ],
  },
];