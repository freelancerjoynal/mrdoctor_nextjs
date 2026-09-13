/** Smooth loading shimmer — replaces plain "লোড হচ্ছে…" text so views feel instant.
 * Renders as a <span> (not <div>) so it stays valid inside <p> elements too. */
export function Skeleton({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-xl ${light ? "bg-white/30" : "bg-slate-200"} ${className}`}
    />
  );
}

/** Placeholder rows shaped like an appointment row (avatar + lines + amount). */
export function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <ul className="space-y-2" aria-label="লোড হচ্ছে">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 sm:p-4"
        >
          <Skeleton className="h-11 w-11 shrink-0 !rounded-full" />
          <span className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </span>
          <span className="shrink-0 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="ml-auto h-5 w-14 !rounded-full" />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Placeholder cards shaped like the staff cash cards. */
export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4" aria-label="লোড হচ্ছে">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
