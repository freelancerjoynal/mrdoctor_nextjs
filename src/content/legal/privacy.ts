/**
 * EDITABLE — Privacy Policy (প্রাইভেসি পলিসি)
 * Route: /privacy
 */

export const PRIVACY_UPDATED = "২০২৬-০৯-২২";

export const PRIVACY_BN: { heading: string; body: string[] }[] = [
  {
    heading: "১. আমরা কী তথ্য নিই",
    body: [
      "সিরিয়াল বুক করতে: রোগীর নাম, মোবাইল নম্বর, বয়স/ওজন (ঐচ্ছিক), এলাকা, সমস্যার বিবরণ, তারিখ ও চেম্বার।",
      "পেমেন্ট করতে: পেমেন্ট গেটওয়ের প্রয়োজনীয় তথ্য (কার্ড/মোবাইল ব্যাংকিং তথ্য আমাদের সার্ভারে সংরক্ষণ করা হয় না — গেটওয়ে প্রসেস করে)।",
    ],
  },
  {
    heading: "২. তথ্য কী কাজে লাগে",
    body: [
      "সিরিয়াল কনফার্ম করা, ডাক্তারের পেন্ডিং তালিকায় পাঠানো, কনফার্মেশন/রিমাইন্ডার SMS বা হোয়াটসঅ্যাপ পাঠানো, এবং রিফান্ড/সাপোর্ট দেওয়া।",
      "সমষ্টিগত (de-identified) পরিসংখ্যান সেবার মান উন্নয়নে ব্যবহার হতে পারে।",
    ],
  },
  {
    heading: "৩. তথ্য কার সঙ্গে শেয়ার হয়",
    body: [
      "সংশ্লিষ্ট ডাক্তার/হাসপাতাল ডেস্ক (যাতে তারা সিরিয়াল ও রোগী চিনতে পারেন), পেমেন্ট গেটওয়ে (লেনদেন সম্পন্ন করতে), এবং আইনগত বাধ্যবাধকতায় সরকারি কর্তৃপক্ষ।",
      "আমরা রোগীর তথ্য বিজ্ঞাপনদাতার কাছে বিক্রি করি না।",
    ],
  },
  {
    heading: "৪. সংরক্ষণ ও নিরাপত্তা",
    body: [
      "তথ্য নিরাপদ সার্ভারে সংরক্ষিত থাকে, অ্যাক্সেস শুধু অনুমোদিত স্টাফের। লেনদেনের রেকর্ড হিসাব ও অডিটের জন্য সংরক্ষণ করা হয়।",
    ],
  },
  {
    heading: "৫. আপনার অধিকার",
    body: [
      "আপনি আপনার তথ্য দেখতে, সংশোধন করতে বা মুছে ফেলার অনুরোধ করতে পারেন — /contact ঠিকানায় লিখুন। মার্কেটিং মেসেজ বন্ধ করতে রিপ্লাইয়ে STOP লিখুন।",
    ],
  },
];

export const PRIVACY_EN: { heading: string; body: string[] }[] = [
  {
    heading: "1. Data we collect",
    body: [
      "Booking: patient name, mobile number, age/weight (optional), area, problem description, date and chamber. Payments are processed by the gateway; we do not store card credentials.",
    ],
  },
  {
    heading: "2. How we use it",
    body: [
      "To confirm serials, notify the doctor's desk, send confirmations/reminders, and handle refunds and support.",
    ],
  },
  {
    heading: "3. Sharing",
    body: [
      "With the treating doctor/hospital desk, the payment gateway, and authorities when legally required. We never sell patient data.",
    ],
  },
];
