import Link from "next/link";

const CARDS = [
  {
    emoji: "🩺",
    title: "আপনি কি ডাক্তার?",
    text: "আবেদন করুন, যাচাই শেষে চেম্বার, ফি ও সময়সূচি যোগ করুন। রোগীরা হোয়াটসঅ্যাপেই সিরিয়াল নেবে — আপনার ফোনে বাড়তি ঝামেলা নেই।",
    perks: ["নিজের নামে ওয়েবসাইট", "হোয়াটসঅ্যাপে রোগীর সিরিয়াল", "লাইভ সিরিয়াল বোর্ড"],
    href: "/apply/doctor",
    cta: "ডাক্তার হিসেবে যোগ দিন →",
  },
  {
    emoji: "🏥",
    title: "হাসপাতাল বা ক্লিনিক আছে?",
    text: "হাসপাতাল নিবন্ধন করুন, ডাক্তারদের যুক্ত করুন, স্টাফদের দায়িত্ব দিন। আপনার এলাকার রোগীরাই অনলাইনে খুঁজে পাবে।",
    perks: ["হাসপাতালের নিজস্ব পোর্টাল", "স্টাফদের জন্য আলাদা লগইন", "বিভাগ অনুযায়ী ডাক্তার তালিকা"],
    href: "/apply/hospital",
    cta: "হাসপাতাল নিবন্ধন করুন →",
  },
];

/**
 * ডাক্তার + হাসপাতাল — দুই পক্ষের যোগদান কার্ড।
 */
export function DoctorJoin() {
  return (
    <section className="bg-gradient-to-br from-amber-50 via-white to-emerald-50 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-800 ring-1 ring-amber-200">
            ডাক্তার ও হাসপাতালদের জন্য
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
            আপনার চেম্বার নিন অনলাইনে — সম্পূর্ণ ফ্রি
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
            রেজিস্টার নয় — আবেদন করুন, যাচাই শেষে আপনার পোর্টাল চালু হবে।
            কম্পিউটার জানার দরকার নেই, মোবাইল দিয়েই সব করা যায়।
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:gap-5 lg:grid-cols-2">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-amber-100 transition hover:-translate-y-1 hover:shadow-2xl sm:p-8"
            >
              <p className="text-4xl">{c.emoji}</p>
              <h3 className="mt-3 text-xl font-black text-slate-900">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{c.text}</p>
              <ul className="mt-4 space-y-2">
                {c.perks.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-sm font-bold text-slate-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-700 ring-1 ring-emerald-200">
                      ✓
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={c.href}
                  className="rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 px-5 py-2.5 text-sm font-black text-emerald-950 shadow-lg transition hover:brightness-105"
                >
                  {c.cta}
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  লগইন করুন
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
