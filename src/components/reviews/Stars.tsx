/** Star display — filled ★ by rating, dim ☆ for the rest. */
export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  const safe = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <span className={`tracking-widest text-amber-400 ${className}`} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(safe)}
      <span className="opacity-30">{"★".repeat(5 - safe)}</span>
    </span>
  );
}
