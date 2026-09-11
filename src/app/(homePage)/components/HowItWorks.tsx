const STEPS = [
  {
    no: "১",
    title: "এলাকা বেছে নিন",
    text: "উপরে আপনার বিভাগ ও জেলায় ক্লিক করে থানা দেখুন।",
    color: "from-indigo-500 to-violet-500",
  },
  {
    no: "২",
    title: "ডাক্তার ঠিক করুন",
    text: "আপনার থানার ডাক্তার, চেম্বার ও সময় বেছে নিন।",
    color: "from-emerald-500 to-teal-500",
  },
  {
    no: "৩",
    title: "সময়মতো ভিজিট করুন",
    text: "দেরি নয়, লাইনে দাঁড়িয়ে অপেক্ষা নয় — ঠিক সময়ে সেবা।",
    color: "from-amber-500 to-rose-500",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
          কীভাবে কাজ করে?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 sm:text-base">
          মাত্র তিন ধাপে রোগী পৌঁছে যান ডাক্তারের কাছে।
        </p>
        <div className="mt-8 grid gap-4 min-[480px]:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.no}
              className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl sm:p-7"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-xl font-black text-white shadow-lg`}
              >
                {s.no}
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
