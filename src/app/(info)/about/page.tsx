import type { Metadata } from "next";
import { InfoShell } from "@/components/legal/InfoShell";
import { COMPANY } from "@/content/company";

export const metadata: Metadata = {
  title: "আমাদের সম্পর্কে",
  description:
    "মিস্টার ডাক্তার — আমরা রোগীকে সবার আগে ডাক্তারের কাছে পৌঁছে দিই। আমাদের গল্প, কাজের মডেল, দায়মুক্তি ও ঠিকানা।",
};

export default function AboutPage() {
  return (
    <InfoShell
      eyebrow="About Us · আমাদের সম্পর্কে"
      title={COMPANY.tagline}
      description="মিস্টার ডাক্তারের সংক্ষিপ্ত গল্প — আমরা কী করি, কীভাবে করি।"
    >
      {COMPANY.storyBn.map((p, i) => (
        <section
          key={i}
          className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 md:p-6"
        >
          <p className="text-[15px] leading-relaxed text-slate-700">{p}</p>
        </section>
      ))}

      <section className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200 md:p-6">
        <h2 className="text-lg font-black text-emerald-950">
          কীভাবে কাজ করে (সংক্ষেপে)
        </h2>
        <ol className="mt-3 space-y-2 text-[15px] leading-relaxed text-slate-700">
          <li>১. রোগী সফটওয়্যারে সিরিয়াল বুক করেন ও অগ্রিম পেমেন্টে (BDT) সিরিয়াল কনফার্ম করেন।</li>
          <li>২. সিরিয়ালটি সফটওয়্যারে যোগ হয় — ডাক্তারের ডেস্ক দেখতে পান।</li>
          <li>৩. রোগী চেম্বারে গিয়ে সেবা নিয়ে চলে আসেন।</li>
          <li>৪. পরবর্তীতে ডাক্তারকে তার প্রাপ্য পরিশোধ করা হয়।</li>
          <li>৫. সরাসরি চেম্বারের বুকিংও একই সফটওয়্যারে কানেক্ট হয়।</li>
        </ol>
      </section>

      <section className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 md:p-6">
        <h2 className="text-lg font-black text-slate-900">
          প্ল্যাটফর্মের ভূমিকা ও দায়মুক্তি (Disclaimer)
        </h2>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-700">
          <p>
            <strong>সেতুবন্ধন হিসেবে কার্যক্রম:</strong> মিস্টার ডাক্তার শুধুমাত্র একটি প্রযুক্তিগত প্ল্যাটফর্ম বা সেতুবন্ধন হিসেবে কাজ করে, যা রোগীকে সর্বোচ্চ ও আগাম সিরিয়াল পেতে এবং ডাক্তারকে তাদের রোগী পেতে সাহায্য করে। আমরা সরাসরি কোনো চিকিৎসা সেবা প্রদান করি না।
          </p>
          <p>
            <strong>চিকিৎসা সংক্রান্ত দায়মুক্তি:</strong> চিকিৎসাগত সমাধান, রোগ নির্ণয়, প্রেসক্রিপশন কিংবা স্বাস্থ্যগত যেকোনো ঝুঁকি বা সেবার মানের জন্য মিস্টার ডাক্তার কোনোভাবেই দায়ী নয়। সমস্ত চিকিৎসা সংক্রান্ত বিষয়ের জন্য সরাসরি সংশ্লিষ্ট ডাক্তার ও হাসপাতাল কর্তৃপক্ষ দায়ী থাকবেন।
          </p>
          <p>
            <strong>আর্থিক লেনদেন ও রিফান্ড নীতি:</strong> মাঝখানে শুধুমাত্র মিস্টার ডাক্তার টাকা নিয়ে নিরাপদে জমা রাখে, যাতে চিকিৎসা সম্পন্ন হওয়ার পর ডাক্তার তার ফি সঠিকভাবে পায়। তবে যদি কোনো কারণে ডাক্তার চিকিৎসা বা সেবা সম্পন্ন না করেন, শুধুমাত্র সেই প্রাপ্ত অর্থ ফেরত দিতে মিস্টার ডাক্তার বাধ্য থাকে।
          </p>
        </div>
      </section>

      <details className="rounded-2xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer text-sm font-black text-slate-800">
          English summary
        </summary>
        <div className="mt-3 space-y-2">
          {COMPANY.storyEn.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-slate-600">
              {p}
            </p>
          ))}
          <p className="text-sm leading-relaxed text-slate-600">
            MrDoctor acts solely as a technological bridge connecting patients and doctors for serial management and escrow payment holding. We do not assume any responsibility or liability for medical treatment, clinical decisions, or health risks. Fees are held securely and disbursed to doctors upon successful service delivery, and refunds are only issued if the doctor fails to complete the service.
          </p>
        </div>
      </details>
    </InfoShell>
  );
}