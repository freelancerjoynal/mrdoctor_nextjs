const ITEMS = [
  { emoji: "🩺", name: "মেডিসিন", desc: "জ্বর, ডায়াবেটিস, প্রেশার", color: "from-emerald-500 to-teal-500" },
  { emoji: "👶", name: "শিশু", desc: "নবজাতক ও শিশুস্বাস্থ্য", color: "from-sky-500 to-blue-500" },
  { emoji: "🤰", name: "গাইনি", desc: "মা ও প্রসূতি সেবা", color: "from-pink-500 to-rose-500" },
  { emoji: "🦴", name: "অর্থোপেডিক", desc: "হাড়, জয়েন্ট ও ব্যথা", color: "from-amber-500 to-orange-500" },
  { emoji: "👁️", name: "চক্ষু", desc: "চোখের সব সমস্যা", color: "from-cyan-500 to-sky-500" },
  { emoji: "🦷", name: "দন্ত", desc: "দাঁত ও মাড়ির যত্ন", color: "from-violet-500 to-purple-500" },
  { emoji: "❤️", name: "হৃদরোগ", desc: "হার্ট ও বুকের যত্ন", color: "from-red-500 to-rose-500" },
  { emoji: "🧴", name: "চর্ম ও যৌন", desc: "ত্বক ও অ্যালার্জি", color: "from-lime-500 to-emerald-500" },
];

export function Specialities() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
              বিশেষজ্ঞ বিভাগ
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
              কোন ডাক্তার দরকার?
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate-500">
            সব বিভাগের যাচাইকৃত ডাক্তার — আপনার সমস্যা অনুযায়ী সঠিক বিশেষজ্ঞ বেছে নিন।
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {ITEMS.map((s) => (
            <div
              key={s.name}
              className="group rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl sm:p-5"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-2xl shadow-lg transition group-hover:scale-110`}
              >
                {s.emoji}
              </div>
              <h3 className="mt-3 font-black text-slate-900">{s.name}</h3>
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
