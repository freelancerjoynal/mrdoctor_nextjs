// Server-safe skeleton — reused by loading.tsx and the manager's loading state.
export function ChambersSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <div className="space-y-4" aria-label="লোড হচ্ছে" aria-busy="true">
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
        <div className="h-4 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-slate-100 px-1 py-2.5 text-center">
              <div className="mx-auto h-3 w-10 rounded bg-slate-200" />
              <div className="mx-auto mt-1.5 h-2.5 w-12 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
          <div className="animate-pulse bg-slate-100 px-5 py-4">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-64 rounded bg-slate-200" />
          </div>
          <div className="space-y-2 p-5">
            <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
            <div className="h-9 w-44 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
