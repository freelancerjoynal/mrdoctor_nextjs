import { FadeIn } from "@/components/motion/FadeIn";

export function QuickActions({ actions }: { actions: { label: string; hint: string }[] }) {
  const gradients = [
    "from-violet-500 to-purple-500",
    "from-emerald-500 to-cyan-500",
    "from-amber-500 to-rose-500",
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
      {actions.map((a, i) => (
        <FadeIn key={a.label} delay={0.15 + i * 0.07}>
          <button className="group w-full rounded-2xl bg-white p-5 text-left shadow-xl shadow-slate-900/5 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-2xl">
            <div className={`mb-3 h-10 w-10 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} shadow-lg transition group-hover:scale-110`} />
            <p className="font-bold text-slate-900">{a.label}</p>
            <p className="text-sm text-slate-500">{a.hint}</p>
          </button>
        </FadeIn>
      ))}
    </div>
  );
}
