/**
 * EDITABLE — Return & Refund Policy (রিটার্ন ও রিফান্ড নীতি)
 * Route: /refund
 * Business model: patient pays to confirm serial → service delivered →
 * doctor paid later. Refund rules must reflect this.
 */

export const REFUND_UPDATED = "২০২৬-০৯-২২";

export const REFUND_BN: { heading: string; body: string[] }[] = [
  {
    heading: "১. মূলনীতি",
    body: [
      "সিরিয়াল কনফার্ম করতে রোগী অগ্রিম পেমেন্ট করেন (BDT)। সেবা নেওয়ার পর সেই টাকা ডাক্তারকে পরিশোধ করা হয়। তাই সেবা না হলে টাকা আটকে থাকে না — নিচের নিয়মে রিফান্ড বা রিশিডিউল পাবেন।",
    ],
  },
  {
    heading: "২. কখন পূর্ণ রিফান্ড (১০০%)",
    body: [
      "ডাক্তার/চেম্বার কর্তৃক বাতিল হলে, ভুল তারিখে সিরিয়াল যোগ হলে (আমাদের ত্রুটি), বা ডাবল পেমেন্ট হলে — সম্পূর্ণ টাকা ফেরত।",
      "রিফান্ড একই মাধ্যমে (বিকাশ/নগদ/কার্ড/ব্যাংক) ৭–১০ কর্মদিবসের মধ্যে পাঠানো হয়।",
    ],
  },
  {
    heading: "৩. রোগী বাতিল করলে",
    body: [
      "নির্ধারিত সময়ের ২৪ ঘণ্টা আগে বাতিল করলে: ফ্রি রিশিডিউল (১ বার) অথবা গেটওয়ে চার্জ বাদে রিফান্ড।",
      "২৪ ঘণ্টার মধ্যে বা নো-শো হলে: রিফান্ড প্রযোজ্য নয়, তবে মানবিক কারণে (হাসপাতালে ভর্তি, দুর্ঘটনা — প্রমাণসহ) রিশিডিউল বিবেচনা করা হয়।",
    ],
  },
  {
    heading: "৪. রিশিডিউল",
    body: [
      "একই ডাক্তারের পরবর্তী উপলব্ধ তারিখে ১ বার ফ্রি রিশিডিউল করা যায় (২৪ ঘণ্টা আগে জানালে)।",
    ],
  },
  {
    heading: "৫. কীভাবে আবেদন করবেন",
    body: [
      "/contact পেজের ফোন/ইমেইলে বুকিং মোবাইল নম্বর, তারিখ ও ট্রানজেকশন আইডি পাঠান। প্রতিটি আবেদনের টিকিট নম্বর দেওয়া হয়।",
    ],
  },
];

export const REFUND_EN: { heading: string; body: string[] }[] = [
  {
    heading: "1. Principle",
    body: [
      "Patients pay in advance (BDT) to confirm a serial; doctors are paid after the service. If no service occurs, you get a refund or free rescheduling per the rules below.",
    ],
  },
  {
    heading: "2. Full refund (100%)",
    body: [
      "Doctor/chamber cancellation, our booking error, or double payment — full refund to the source within 7–10 working days.",
    ],
  },
  {
    heading: "3. Patient cancellation",
    body: [
      "24h+ before: one free reschedule or refund minus gateway charges. Within 24h / no-show: non-refundable, reschedule considered on genuine grounds with proof.",
    ],
  },
];
