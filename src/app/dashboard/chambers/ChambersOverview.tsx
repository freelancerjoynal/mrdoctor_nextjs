// Server component — weekly availability overview, no client JS.
import { DAYS, DAY_BN, buildTakenBy, gradientFor, shortLabel } from "./types";
import type { ChamberRow } from "./types";

export function ChambersOverview({ rows }: { rows: ChamberRow[] }) {
  const takenBy = buildTakenBy(rows);
  const takenCount = Object.keys(takenBy).length;
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-black text-slate-900">📅 সাপ্তাহিক চিত্র — কোন বারে কোন চেম্বার</p>
        <p className="text-xs font-bold text-slate-500">{takenCount}/৭ বার বরাদ্দ</p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {DAYS.map((d) => {
          const t = takenBy[d];
          if (!t) {
            return (
              <div
                key={d}
                className="rounded-xl border-2 border-dashed border-slate-200 px-1 py-2.5 text-center"
              >
                <p className="text-xs font-black text-slate-500">{DAY_BN[d]}</p>
                <p className="mt-0.5 text-[11px] font-bold text-slate-400">ফাঁকা</p>
              </div>
            );
          }
          const owner = rows[t.chamberIndex];
          return (
            <div
              key={d}
              title={owner ? owner.chamberName?.trim() || owner.addressLine?.trim() || "" : ""}
              className={`rounded-xl bg-gradient-to-br px-1 py-2.5 text-center text-white shadow ${gradientFor(t.chamberIndex)}`}
            >
              <p className="text-xs font-black">{DAY_BN[d]}</p>
              <p className="mt-0.5 truncate text-[11px] font-bold text-white/90">
                {owner ? shortLabel(owner, t.chamberIndex) : ""}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
