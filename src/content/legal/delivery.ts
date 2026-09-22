/**
 * EDITABLE — Delivery Policy (ডেলিভারি/সেবা প্রদান নীতি)
 * Route: /delivery
 * Physical product delivery নয় — "delivery" মানে serial/service delivery.
 */

export const DELIVERY_UPDATED = "২০২৬-০৯-২২";

export const DELIVERY_BN: { heading: string; body: string[] }[] = [
  {
    heading: "১. সেবা কীভাবে ডেলিভার হয়",
    body: [
      "পেমেন্ট সফল হলেই সিরিয়ালটি আমাদের সফটওয়্যারে যোগ হয় — এটাই 'ডেলিভারি কনফার্মেশন'। রোগী নির্ধারিত তারিখ ও সময়ে চেম্বারে গিয়ে ডাক্তারের সেবা নেন।",
      "সরাসরি চেম্বারে গিয়ে সিরিয়াল বুক করলেও সেটি একই সফটওয়্যারে কানেক্ট হয়, ফলে সিরিয়াল নম্বর ও সময় সবাই একইভাবে পান।",
    ],
  },
  {
    heading: "২. সময়সীমা",
    body: [
      "অনলাইন পেমেন্টের সঙ্গে সঙ্গে (সাধারণত কয়েক মিনিটে) কনফার্মেশন SMS/হোয়াটসঅ্যাপ যায়। সেবা প্রদানের তারিখ = বুকিংয়ে বেছে নেওয়া সাক্ষাতের তারিখ।",
      "কোনো ভৌত পণ্য কুরিয়ার করা হয় না — তাই শিপিং চার্জ বা ডেলিভারি ঠিকানা প্রযোজ্য নয়।",
    ],
  },
  {
    heading: "৩. ডেলিভারি না হলে (সেবা মিস হলে)",
    body: [
      "ডাক্তার না বসলে বা চেম্বার বন্ধ থাকলে রিশিডিউল বা পূর্ণ রিফান্ড দেওয়া হয় (দেখুন /refund)।",
      "রোগী সময়মতো না গেলে (নো-শো) সেবাটি 'ডেলিভারড হয়নি — রোগীর অনুপস্থিতি' হিসেবে গণ্য হয়।",
    ],
  },
  {
    heading: "৪. ফি ও মুদ্রা",
    body: [
      "সকল মূল্য বাংলাদেশি টাকায় (BDT / ৳) দেখানো হয়। চেম্বারভেদে নতুন/পুরনো রোগীর ফি আলাদা হতে পারে — বুকিং ফর্মে চূড়ান্ত ফি BDT-তে দেখে তবেই পেমেন্ট করুন।",
    ],
  },
];

export const DELIVERY_EN: { heading: string; body: string[] }[] = [
  {
    heading: "1. How service is delivered",
    body: [
      "Successful payment adds the serial to our software — that is the delivery confirmation. The patient then visits the chamber at the scheduled time for care. Walk-in bookings sync into the same software.",
    ],
  },
  {
    heading: "2. Timeline",
    body: [
      "Confirmation is sent within minutes of payment. No physical goods are shipped.",
    ],
  },
  {
    heading: "3. If service is missed",
    body: [
      "Doctor cancellation → reschedule or full refund (see /refund). Patient no-show → marked as missed due to absence.",
    ],
  },
];
