const CARDS = [
  {
    emoji: "🧑‍🦱",
    title: "রোগীদের জন্য",
    subtitle: "ঘরে বসেই সিরিয়াল",
    color: "from-sky-500 to-blue-600",
    bg: "bg-sky-50",
    points: [
      "এলাকা বেছে ডাক্তার ও সময় দেখুন — বাংলায়, ছবিসহ",
      "অনলাইন ফর্ম বা হোয়াটসঅ্যাপে ১ মিনিটে সিরিয়াল",
      "লাইনে দাঁড়িয়ে অপেক্ষা নয় — সময়মতো চেম্বারে যান",
      "সিরিয়াল নেওয়া সম্পূর্ণ ফ্রি, কোনো বাড়তি টাকা নেই",
    ],
    cta: { href: "#areas", label: "এলাকা খুঁজুন →" },
  },
  {
    emoji: "🩺",
    title: "ডাক্তারদের জন্য",
    subtitle: "ফ্রি চেম্বার সফটওয়্যার",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    points: [
      "আপনার নামে নিজস্ব ওয়েবসাইট (যেমন: আপনারনাম.মিস্টারডাক্তার)",
      "চেম্বার, ফি ও সময়সূচি নিজেই মোবাইল থেকে বসান",
      "রোগীর সিরিয়াল আসবে হোয়াটসঅ্যাপে — খাতা-কলমের ঝামেলা শেষ",
      "লাইভ সিরিয়াল বোর্ড — চেম্বারে টিভিতে চালান",
    ],
    cta: { href: "/apply/doctor", label: "ডাক্তার হিসেবে যোগ দিন →" },
  },
  {
    emoji: "🏥",
    title: "হাসপাতাল মালিকদের জন্য",
    subtitle: "ফ্রি হাসপাতাল ড্যাশবোর্ড",
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    points: [
      "হাসপাতালের নামে পোর্টাল — সব ডাক্তার এক জায়গায়",
      "কোন ডাক্তার কখন বসেন, স্টাফরাই আপডেট রাখতে পারে",
      "বিভাগ অনুযায়ী ডাক্তার খোঁজা + এক ক্লিকে সিরিয়াল",
      "রোগীর মতামত ও রেটিং — হাসপাতালের সুনাম বাড়ে",
    ],
    cta: { href: "/apply/hospital", label: "হাসপাতাল নিবন্ধন করুন →" },
  },
];

/**
 * "আমরা তিনজনকে যুক্ত করি" — রোগী, ডাক্তার, হাসপাতাল।
 * প্রতিটি কার্ডে সহজ বাংলায় কার কী লাভ, তা বোঝানো হয়েছে।
 */
export function ConnectionTrio() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-violet-700">
            আমরা কী করি?
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
            ডাক্তার, হাসপাতাল ও রোগী — তিনজনকে যুক্ত করি
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
            ভাবুন একটা ব্রিজের মতো: একপাশে রোগী, আরেকপাশে ডাক্তার ও হাসপাতাল।
            মাঝখানে মিস্টার ডাক্তার — অনলাইন সিরিয়াল আর ফ্রি সফটওয়্যার দিয়ে
            সবাইকে মিলিয়ে দেয়।
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:gap-5 lg:grid-cols-3">
          {CARDS.map((c) => (
            <article
              key={c.title}
              className={`flex flex-col rounded-3xl ${c.bg} p-6 ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl sm:p-7`}
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${c.color} text-3xl shadow-lg`}
              >
                {c.emoji}
              </div>
              <h3 className="mt-4 text-xl font-black text-slate-900">{c.title}</h3>
              <p className="mt-0.5 text-sm font-bold text-slate-500">{c.subtitle}</p>
              <ul className="mt-4 flex-1 space-y-2.5">
                {c.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-black text-emerald-600 shadow-sm">
                      ✓
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <a
                href={c.cta.href}
                className="mt-5 inline-block rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-slate-700"
              >
                {c.cta.label}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
