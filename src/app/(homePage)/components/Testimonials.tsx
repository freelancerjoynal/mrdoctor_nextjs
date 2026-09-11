const QUOTES = [
  {
    text: "জ্বর নিয়ে সকালে সিরিয়াল নিলাম, দুপুরেই ডাক্তার দেখিয়ে বাসায়। আগে হলে সারাদিন চেম্বারে বসে থাকতে হতো।",
    name: "রহিমা বেগম",
    area: "সৈয়দপুর, নীলফামারী",
    color: "from-emerald-500 to-teal-500",
  },
  {
    text: "বাবার প্রেশারের জন্য প্রতি মাসে ফলো-আপ লাগে। এখন সময় দেখে যাই — এক মিনিটও অপেক্ষা করতে হয় না।",
    name: "করিম উদ্দিন",
    area: "নীলফামারী সদর",
    color: "from-indigo-500 to-violet-500",
  },
  {
    text: "হোয়াটসঅ্যাপেই সিরিয়াল, হোয়াটসঅ্যাপেই মনে করিয়ে দেয়। বয়স্ক মানুষের জন্য এর চেয়ে সহজ আর কী হতে পারে!",
    name: "শারমিন আক্তার",
    area: "জলঢাকা, নীলফামারী",
    color: "from-amber-500 to-rose-500",
  },
];

export function Testimonials() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
          রোগীরা যা বললেন
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 sm:text-base">
          সময়মতো সেবা পেয়ে খুশি হাজারো রোগী ও তাদের পরিবার।
        </p>
        <div className="mt-8 grid gap-4 sm:gap-5 lg:grid-cols-3">
          {QUOTES.map((q) => (
            <figure
              key={q.name}
              className="flex flex-col rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="text-3xl leading-none text-amber-400">“</div>
              <blockquote className="mt-1 flex-1 text-sm leading-relaxed text-slate-600">
                {q.text}
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${q.color} text-lg font-black text-white shadow`}
                >
                  {q.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-black text-slate-900">{q.name}</span>
                  <span className="block text-xs text-slate-400">📍 {q.area}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
