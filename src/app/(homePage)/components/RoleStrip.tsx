const ROLES = [
  { emoji: "👑", name: "সুপার অ্যাডমিন", color: "from-violet-500 to-fuchsia-500" },
  { emoji: "🩺", name: "ডাক্তার", color: "from-emerald-500 to-cyan-500" },
  { emoji: "🧑‍⚕️", name: "ডাক্তারের সহকারী", color: "from-sky-500 to-indigo-500" },
  { emoji: "💼", name: "ব্যবসায়ী", color: "from-amber-500 to-rose-500" },
  { emoji: "🏥", name: "হাসপাতাল", color: "from-rose-500 to-pink-500" },
  { emoji: "📋", name: "হাসপাতাল স্টাফ", color: "from-indigo-500 to-purple-500" },
];

export function RoleStrip() {
  return (
    <section className="border-t border-white/10 py-12 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-xl font-black text-white sm:text-2xl">
          সবার জন্য একটাই প্ল্যাটফর্ম
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {ROLES.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl bg-white/5 p-4 text-center ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-white/10"
            >
              <div
                className={`mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${r.color} text-xl shadow-lg`}
              >
                {r.emoji}
              </div>
              <p className="text-xs font-bold text-white sm:text-sm">{r.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
