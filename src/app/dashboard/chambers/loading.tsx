import { ChambersSkeleton } from "./ChambersSkeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div>
        <div className="h-7 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-100" />
      </div>
      <ChambersSkeleton />
    </div>
  );
}
