export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950">
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6" aria-label="লোড হচ্ছে" aria-busy="true">
        <div className="h-12 animate-pulse rounded-2xl bg-white/10" />
        <div className="h-64 animate-pulse rounded-3xl bg-white/10" />
        <div className="h-24 animate-pulse rounded-3xl bg-white/10" />
        <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}
