import { FadeIn } from "@/components/motion/FadeIn";

const PALETTES = [
  "from-violet-500 to-fuchsia-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-sky-500 to-indigo-500",
  "from-rose-500 to-pink-500",
  "from-cyan-500 to-blue-500",
];

export function StatCard({
  label,
  value,
  delta,
  index = 0,
}: {
  label: string;
  value: string;
  delta: string;
  index?: number;
}) {
  const gradient = PALETTES[index % PALETTES.length];
  return (
    <FadeIn delay={index * 0.07}>
      <div className="relative h-full overflow-hidden rounded-2xl bg-white p-4 shadow-xl shadow-slate-900/5 ring-1 ring-slate-100 sm:p-5">
        <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${gradient}`} />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1 break-words text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{value}</p>
        <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
          {delta}
        </span>
      </div>
    </FadeIn>
  );
}
