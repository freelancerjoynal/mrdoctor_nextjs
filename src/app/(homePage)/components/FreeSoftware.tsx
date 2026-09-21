const FEATURES = [
  {
    emoji: "📅",
    title: "অনলাইন সিরিয়াল বুকিং",
    text: "রোগী ফর্ম পূরণ করলেই সিরিয়াল জমা হয়। ডাক্তার ও স্টাফ মোবাইলেই দেখতে পান — কে, কখন, কী সমস্যা নিয়ে আসছে।",
  },
  {
    emoji: "💬",
    title: "হোয়াটসঅ্যাপে অটো মেসেজ",
    text: "নতুন সিরিয়াল এলে সঙ্গে সঙ্গে হোয়াটসঅ্যাপে খবর যায়। রোগীকে ফোন করে জানানোর দরকার নেই।",
  },
  {
    emoji: "🖥️",
    title: "চেম্বার ব্যবস্থাপনা",
    text: "কোন দিন কয়টা থেকে চেম্বার, নতুন-পুরনো রোগীর ফি কত — সব মোবাইল থেকে বদলানো যায়।",
  },
  {
    emoji: "📺",
    title: "লাইভ সিরিয়াল বোর্ড",
    text: "চেম্বারের টিভিতে চালান — এখন কত নম্বর চলছে, পরের রোগী কে, সবাই দেখতে পায়। হট্টগোল কমে।",
  },
  {
    emoji: "🌐",
    title: "নিজস্ব ওয়েবসাইট",
    text: "প্রতিটি ডাক্তার ও হাসপাতাল পায় নিজের নামে সুন্দর ওয়েবসাইট — ভিজিটিং কার্ডে লিংক দিলেই হয়।",
  },
  {
    emoji: "⭐",
    title: "রেটিং ও মতামত",
    text: "রোগীরা মতামত লিখতে পারে। ভালো রেটিং মানে নতুন রোগীর আস্থা — হাসপাতালের সুনামও বাড়ে।",
  },
];

/**
 * "সম্পূর্ণ ফ্রি সফটওয়্যার" — ডাক্তার ও হাসপাতাল কী কী টুল
 * বিনা পয়সায় পাচ্ছে, সহজ বাংলায়।
 */
export function FreeSoftware() {
  return (
    <section id="software" className="scroll-mt-20 bg-gradient-to-b from-white to-indigo-50/60 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
              ১০০% ফ্রি সফটওয়্যার
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
              খাতা-কলম বাদ দিন, মোবাইলেই চেম্বার চালান
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500 sm:text-base">
              ডাক্তার ও হাসপাতালের জন্য আমাদের সব সফটওয়্যার{" "}
              <strong className="text-slate-800">সম্পূর্ণ ফ্রি</strong>। আলাদা
              কম্পিউটার লাগে না, ইংরেজি জানার দরকার নেই — সাধারণ স্মার্টফোনই
              যথেষ্ট। নিচের প্রতিটি সুবিধা আজই ব্যবহার করতে পারবেন।
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="/apply/doctor"
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700"
              >
                ডাক্তার — ফ্রি শুরু করুন →
              </a>
              <a
                href="/apply/hospital"
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                হাসপাতাল — ফ্রি শুরু করুন →
              </a>
            </div>
            <div className="mt-5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 p-4 text-sm leading-relaxed text-amber-900 ring-1 ring-amber-300">
              🎉 <strong>ডাক্তার ও হাসপাতালের জন্য সম্পূর্ণ ফ্রি</strong> — কোনো
              মাসিক ফি নেই, কোনো সেটআপ চার্জ নেই। আজই শুরু করুন।
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <p className="text-3xl">{f.emoji}</p>
                <h3 className="mt-3 font-black text-slate-900">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
