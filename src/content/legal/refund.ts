/**
 * EDITABLE — Return & Refund Policy (রিটার্ন ও রিফান্ড নীতি)
 * Route: /refund
 * Business model: patient pays to confirm serial → service delivered →
 * doctor paid later. Refund rules must reflect this.
 */

export const REFUND_UPDATED = "২০২৬-০৯-২৩";

export const REFUND_BN: { heading: string; body: string[] }[] = [
  {
    heading: "১. মূলনীতি",
    body: [
      "সিরিয়াল কনফার্ম করতে রোগী অগ্রিম পেমেন্ট করেন (BDT)। সেবা নেওয়ার পর সেই টাকা ডাক্তারকে পরিশোধ করা হয়। তাই সেবা না হলে বা নিয়ম অনুযায়ী বাতিল হলে নির্দিষ্ট শর্ত সাপেক্ষে রিফান্ড বা রিশিডিউল প্রদান করা হয়।",
    ],
  },
  {
    heading: "২. ডক্টর শিডিউল বা সেবা প্রদান না করলে",
    body: [
      "যদি ডক্টর শিডিউল না দেন অথবা প্রয়োজনীয় সেবা বা সাপোর্ট প্রদানে ব্যর্থ হন (কিংবা উপস্থিত না থাকেন), সেক্ষেত্রে শুধুমাত্র ২% সার্ভিস চার্জ কেটে নিয়ে বাকি ৯৮% অর্থ রিফান্ড করা হবে।",
      "এই রিফান্ড ৫ থেকে ৮ কর্মদিবসের মধ্যে পেমেন্টের একই মাধ্যমে পাঠানো হয়।",
    ],
  },
  {
    heading: "৩. ভুলবশত বুকিং হলে (৩০ মিনিটের নিয়ম)",
    body: [
      "যদি আপনার ভুলবশত কোনো অ্যাপয়েন্টমেন্ট বুকিং হয়ে যায়, তবে তা অবশ্যই বুকিংয়ের **৩০ মিনিটের মধ্যে** আমাদের সাপোর্টে জানাতে হবে। ৩০ মিনিটের মধ্যে জানালে তা ভুলবশত বুকিং হিসেবে গণ্য করা হবে।",
      "তবে ৩০ মিনিট পার হয়ে গেলে সেটি আর ভুলবশত বলে গণ্য হবে না; বরং তা **ইচ্ছাকৃত বা স্বেচ্ছায় ক্যানসেল** হিসেবে ধরা হবে।",
    ],
  },
  {
    heading: "৪. রোগী কর্তৃক স্বেচ্ছায় বা ইচ্ছাকৃত বাতিলকরণ",
    body: [
      "বুকিংয়ের ৩০ মিনিট পার হয়ে যাওয়ার পর থেকে নিয়ে **ডক্টরের চেম্বার শুরু হওয়ার পূর্ব পর্যন্ত** সময়টিকে ইচ্ছাকৃত ক্যান্সেলেশনের সময় হিসেবে ধরা হবে।",
      "এই সময়ের মধ্যে (৩০ মিনিট পর থেকে চেম্বার শুরুর পূর্ব পর্যন্ত) অ্যাপয়েন্টমেন্ট বাতিল করলে **৩৫% সার্ভিস চার্জ** কেটে রেখে বাকি ৬৫% অর্থ ৫ থেকে ৮ কর্মদিবসের মধ্যে ফেরত দেওয়া হবে।",
    ],
  },
  {
    heading: "৫. চেম্বার শুরু হওয়ার পরে জানালে বা না জানালে (নন-রিফান্ডেবল)",
    body: [
      "ডক্টরের চেম্বার শুরু হয়ে যাওয়ার পর ক্যানসেল করলে বা না জানালে সেই আবেদন আর গণ্য করা হবে না। সেক্ষেত্রে আপনাকে হয় নির্ধারিত সময়ে সেবা গ্রহণ করতে হবে, অথবা আপনার প্রদানকৃত অর্থটি সম্পূর্ণ বাতিল বলে গণ্য হবে এবং কোনো রিফান্ড দেওয়া হবে না।",
    ],
  },
  {
    heading: "৬. কীভাবে আবেদন করবেন",
    body: [
      "/contact পেজের ফোন/ইমেইলে বুকিং মোবাইল নম্বর, তারিখ ও ট্রানজেকশন আইডি পাঠান। প্রতিটি আবেদনের টিকিট নম্বর দেওয়া হয়।",
    ],
  },
];

export const REFUND_EN: { heading: string; body: string[] }[] = [
  {
    heading: "1. Principle",
    body: [
      "Patients pay in advance (BDT) to confirm a serial; doctors are paid after service delivery. Refunds are processed according to the rules below.",
    ],
  },
  {
    heading: "2. Doctor's Failure to Provide Service",
    body: [
      "If the doctor fails to provide the schedule or service, only a 2% service charge is deducted and the remaining 98% is refunded within 5 to 8 working days.",
    ],
  },
  {
    heading: "3. Accidental Booking (30-Minute Rule)",
    body: [
      "If an appointment is booked by mistake, you must inform our support team within 30 minutes of booking. After 30 minutes, it is no longer treated as a mistake.",
    ],
  },
  {
    heading: "4. Voluntary/Intentional Cancellation",
    body: [
      "From 30 minutes after booking up until the doctor's chamber begins is considered the voluntary cancellation window. Cancelling during this period will incur a 35% service charge, and the remaining 65% will be refunded within 5 to 8 working days.",
    ],
  },
  {
    heading: "5. Late Notification or Failure to Inform (Non-Refundable)",
    body: [
      "Cancellations requested after the doctor's chamber has started will not be entertained. You must either avail the service or the payment will be treated as non-refundable and forfeited.",
    ],
  },
];