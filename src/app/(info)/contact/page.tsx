import type { Metadata } from "next";
import { InfoShell } from "@/components/legal/InfoShell";
import { ContactForm } from "@/components/contact/ContactForm";
import { COMPANY } from "@/content/company";

export const metadata: Metadata = {
  title: "যোগাযোগ ও ঠিকানা",
  description:
    "মিস্টার ডাক্তার — অফিস ঠিকানা, ফোন, ইমেইল ও ট্রেড লাইসেন্স নম্বর।",
};

export default function ContactPage() {
  return (
    <InfoShell
      eyebrow="Business Address · যোগাযোগ"
      title="অফিস ঠিকানা ও যোগাযোগ"
      description="যেকোনো বুকিং, রিফান্ড বা সাপোর্টের জন্য নিচের ফর্মে লিখুন বা ঠিকানায় যোগাযোগ করুন।"
    >
      <ContactForm />

      <section className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 md:p-6">
        <h2 className="text-lg font-black text-emerald-950">📍 ফিজিক্যাল অফিস</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
          {COMPANY.address}
        </p>
        <p className="mt-1 text-sm text-slate-500">{COMPANY.addressEn}</p>
      </section>

      <section className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 md:p-6">
        <h2 className="text-lg font-black text-emerald-950">📞 ফোন ও ইমেইল</h2>
        <p className="mt-2 text-[15px] text-slate-700">
          ফোন:{" "}
          <a href={`tel:${COMPANY.phone.replace(/[^+\d]/g, "")}`} className="font-bold text-emerald-700 underline">
            {COMPANY.phone}
          </a>
        </p>
        <p className="mt-1 text-[15px] text-slate-700">
          ইমেইল:{" "}
          <a href={`mailto:${COMPANY.email}`} className="font-bold text-emerald-700 underline">
            {COMPANY.email}
          </a>
        </p>
        <p className="mt-1 text-sm text-slate-500">
          সাপোর্ট সময়: {COMPANY.supportHours}
        </p>
      </section>

      <section className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200 md:p-6">
        <h2 className="text-lg font-black text-amber-900">🧾 ট্রেড লাইসেন্স</h2>
        <p className="mt-2 text-[15px] text-slate-700">
          ট্রেড লাইসেন্স নং:{" "}
          <span className="font-black text-slate-900">{COMPANY.tradeLicense}</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          এই নম্বরটি .env ফাইলের NEXT_PUBLIC_TRADE_LICENSE_NUMBER থেকে আসে — সার্ভার রিস্টার্ট ছাড়াই পরিবর্তন করা যায় (পরবর্তী ডিপ্লয়ে কার্যকর)।
        </p>
      </section>
    </InfoShell>
  );
}
