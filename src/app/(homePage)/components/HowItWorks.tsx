"use client";

import { useState } from "react";

type Tab = "patient" | "doctor" | "hospital";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "patient", label: "রোগী", emoji: "🧑‍🦱" },
  { id: "doctor", label: "ডাক্তার", emoji: "🩺" },
  { id: "hospital", label: "হাসপাতাল", emoji: "🏥" },
];

const FLOWS: Record<Tab, { no: string; title: string; text: string }[]> = {
  patient: [
    {
      no: "১",
      title: "আপনার এলাকা খুঁজুন",
      text: "নিচের তালিকা থেকে বিভাগ → জেলা → থানায় ক্লিক করুন। আপনার থানার পেজে সব ডাক্তার, চেম্বারের ঠিকানা, ভিজিট ফি ও বসার সময় বাংলায় দেখতে পাবেন।",
    },
    {
      no: "২",
      title: "ডাক্তার বেছে সিরিয়াল নিন",
      text: "পছন্দের ডাক্তারের পেজে ঢুকে অনলাইন ফর্ম পূরণ করুন — নাম, মোবাইল, সমস্যা লিখলেই হবে। চাইলে হোয়াটসঅ্যাপ বোতামে চাপ দিয়ে সরাসরি মেসেজও পাঠাতে পারেন।",
    },
    {
      no: "৩",
      title: "কনফার্মেশন নিয়ে সময়মতো যান",
      text: "হোয়াটসঅ্যাপে সিরিয়াল নম্বর ও সময় জানিয়ে দেওয়া হয়। নির্ধারিত সময়ের ১০–১৫ মিনিট আগে চেম্বারে পৌঁছালেই হবে — ঘণ্টার পর ঘণ্টা বসে থাকতে হবে না।",
    },
    {
      no: "৪",
      title: "দেখিয়ে এসে মতামত দিন",
      text: "ডাক্তার দেখানোর পর পেজে রেটিং ও মতামত লিখুন। আপনার মতামত দেখে অন্য রোগীরা সঠিক ডাক্তার বেছে নিতে পারে।",
    },
  ],
  doctor: [
    {
      no: "১",
      title: "আবেদন করুন (২ মিনিট)",
      text: "উপরের ‘আবেদন করুন’ বোতামে চাপ দিয়ে ডাক্তার ফর্ম পূরণ করুন — নাম, ডিগ্রি, বিশেষজ্ঞ বিভাগ, ছবি ও চেম্বারের তথ্য দিন।",
    },
    {
      no: "২",
      title: "যাচাই শেষে পোর্টাল চালু",
      text: "আমাদের টিম আপনার ডিগ্রি ও পরিচয় যাচাই করে অনুমোদন দেয়। অনুমোদনের সঙ্গে সঙ্গেই আপনার নামে নিজস্ব ওয়েবসাইট চালু হয়ে যায়।",
    },
    {
      no: "৩",
      title: "চেম্বার নিজেই সাজান",
      text: "মোবাইল থেকে লগইন করে চেম্বারের ঠিকানা, নতুন-পুরনো রোগীর ফি, সপ্তাহের কোন দিন কয়টা থেকে বসবেন — সব নিজেই বসান। চাইলে সহকারীকেও দায়িত্ব দিতে পারেন।",
    },
    {
      no: "৪",
      title: "হোয়াটসঅ্যাপে সিরিয়াল পান",
      text: "রোগীরা আপনার পেজ থেকে সিরিয়াল নিলে সঙ্গে সঙ্গে আপনার হোয়াটসঅ্যাপে মেসেজ আসে। খাতায় লেখার ঝামেলা নেই — সব হিসাব সফটওয়্যারে জমা থাকে।",
    },
  ],
  hospital: [
    {
      no: "১",
      title: "হাসপাতালের আবেদন করুন",
      text: "‘আবেদন করুন’ থেকে হাসপাতাল ফর্ম পূরণ করুন — হাসপাতালের নাম, ঠিকানা, ফোন ও ছবি দিন।",
    },
    {
      no: "২",
      title: "ডাক্তারদের যুক্ত করুন",
      text: "অনুমোদনের পর ড্যাশবোর্ড থেকে আপনার হাসপাতালে বসেন এমন ডাক্তারদের যুক্ত করুন। প্রতিটি ডাক্তারের চেম্বার-সময় আলাদা করে বসানো যায়।",
    },
    {
      no: "৩",
      title: "স্টাফদের দায়িত্ব দিন",
      text: "রিসেপশন বা ম্যানেজারকে স্টাফ অ্যাকাউন্ট দিন — তারাই প্রতিদিনের সিরিয়াল, সময় পরিবর্তন ও রোগীর মেসেজ সামলাতে পারবে।",
    },
    {
      no: "৪",
      title: "রোগী আসা বাড়ান",
      text: "আপনার থানার পেজ ও হাসপাতাল পোর্টাল থেকে রোগীরা সরাসরি ডাক্তার খুঁজে সিরিয়াল নেয়। ভালো সেবা দিলে রেটিং বাড়ে, নতুন রোগীও বাড়ে।",
    },
  ],
};

/**
 * "আমরা কীভাবে কাজ করি" — রোগী / ডাক্তার / হাসপাতাল, তিন দৃষ্টিকোণ
 * থেকে ধাপে ধাপে সহজ বাংলায় বোঝানো।
 */
export function HowItWorks() {
  const [tab, setTab] = useState<Tab>("patient");
  const steps = FLOWS[tab];

  return (
    <section id="how" className="scroll-mt-20 bg-gradient-to-b from-indigo-50 via-white to-violet-50 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-700 ring-1 ring-indigo-200">
            আমরা কীভাবে কাজ করি?
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
            প্রথমবার ব্যবহার করছেন? ২ মিনিটে বুঝে নিন
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
            আপনি রোগী, ডাক্তার নাকি হাসপাতালের মালিক — নিচে আপনার ট্যাবে ক্লিক
            করুন। প্রতিটি ধাপ সহজ বাংলায় লেখা, কোনো ইংরেজি জানার দরকার নেই।
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-5 py-2.5 text-sm font-black transition ${
                tab === t.id
                  ? "bg-slate-900 text-white shadow-xl"
                  : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-indigo-50 hover:text-slate-900"
              }`}
            >
              {t.emoji} {t.label}
              {t.id === "patient" ? " (রোগী)" : t.id === "doctor" ? " (ডাক্তার)" : " (মালিক)"}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:gap-5 lg:grid-cols-2">
          {steps.map((s, i) => (
            <div
              key={s.no}
              className="flex gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-indigo-100 transition hover:-translate-y-0.5 hover:shadow-xl sm:p-6"
            >
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-xl font-black text-white shadow-lg">
                  {s.no}
                </div>
                {i < steps.length - 1 && <div className="mt-2 w-px flex-1 bg-indigo-100" />}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{s.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-gradient-to-r from-emerald-50 to-amber-50 p-5 text-center ring-1 ring-emerald-200 sm:p-6">
          <p className="text-sm font-bold text-emerald-900 sm:text-base">
            💡 মনে রাখুন: রোগীর সিরিয়াল নেওয়া ফ্রি · ডাক্তার ও হাসপাতালের সফটওয়্যারও ফ্রি
          </p>
          <p className="mx-auto mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
            শুধু চেম্বারে গিয়ে ডাক্তারের নির্ধারিত ভিজিট ফি দেবেন। অনলাইনে
            আমাদেরকে কোনো টাকা দিতে হয় না।
          </p>
        </div>
      </div>
    </section>
  );
}
