"use client";

import type { PublicReview, RatingSummary } from "@/lib/profile";
import { toBn } from "@/lib/bn";
import { Stars } from "./Stars";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm, type ReviewTarget } from "./ReviewForm";

/**
 * Full review block for a profile page: rating summary + review cards
 * + visitor form. `dark` matches the doctor template's emerald section.
 * Pass DB reviews; falls back to `fallback` (demo) when empty.
 */
export function ReviewSection({
  target,
  reviews,
  rating,
  fallback = [],
  dark = false,
  eyebrow = "রোগীদের মতামত",
  heading = "যাঁরা আস্থা রেখেছেন",
  showForm = true,
}: {
  target: ReviewTarget;
  reviews: PublicReview[];
  rating?: RatingSummary | null;
  fallback?: PublicReview[];
  dark?: boolean;
  eyebrow?: string;
  heading?: string;
  showForm?: boolean;
}) {
  const list = reviews.length > 0 ? reviews : fallback;
  const avg = rating && rating.count > 0 ? rating.average.toFixed(1) : null;

  const inner = (
    <>
      <p
        className={`flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] ${dark ? "text-amber-300" : "text-emerald-700"}`}
      >
        <span className={`inline-block h-px w-10 ${dark ? "bg-amber-300" : "bg-emerald-600"}`} />
        {eyebrow}
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h2 className={`text-3xl font-bold md:text-4xl ${dark ? "text-white" : "text-emerald-950"}`}>{heading}</h2>
        {avg && (
          <p className={`flex items-center gap-2 font-bold ${dark ? "text-amber-300" : "text-emerald-800"}`}>
            <Stars rating={Math.round(Number(avg))} />
            {toBn(avg)} ({toBn(rating!.count)}টি মতামত)
          </p>
        )}
      </div>
      {list.length > 0 ? (
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {list.slice(0, 6).map((r) => (
            <ReviewCard key={r.id} review={r} dark={dark} />
          ))}
        </div>
      ) : (
        <p className={`mt-8 ${dark ? "text-emerald-100/70" : "text-slate-500"}`}>
          এখনো কোনো মতামত নেই — প্রথম মতামতটি আপনিই দিন।
        </p>
      )}
      {showForm && (
        <div className="mx-auto mt-10 max-w-2xl">
          <ReviewForm target={target} dark={dark} />
        </div>
      )}
    </>
  );

  if (dark) {
    return (
      <section id="testimonials" className="scroll-mt-24 bg-emerald-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">{inner}</div>
      </section>
    );
  }
  return (
    <section id="testimonials" className="scroll-mt-24 rounded-2xl bg-white p-6 shadow-sm">
      {inner}
    </section>
  );
}
