import type { Metadata } from "next";
import { InfoShell } from "@/components/legal/InfoShell";
import { COMPANY } from "@/content/company";

export const metadata: Metadata = {
  title: "আমাদের সম্পর্কে",
  description:
    "মিস্টার ডাক্তার — আমরা রোগীকে সবার আগে ডাক্তারের কাছে পৌঁছে দিই। আমাদের গল্প, কাজের মডেল ও ঠিকানা।",
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
        </div>
      </details>
    </InfoShell>
  );
}
