import type { PublicReview } from "@/lib/profile";
import { Stars } from "./Stars";

/**
 * Single review card. `dark` matches the doctor template's
 * emerald testimonial section; light suits hospital pages.
 */
export function ReviewCard({
  review,
  dark = false,
}: {
  review: Pick<PublicReview, "reviewerName" | "rating" | "title" | "comment">;
  dark?: boolean;
}) {
  const initial = review.reviewerName.trim()[0] || "অ";
  if (dark) {
    return (
      <figure className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur transition hover:bg-white/10">
        <Stars rating={review.rating} className="text-sm font-bold" />
        {review.title && <p className="mt-2 font-bold text-white">{review.title}</p>}
        <blockquote className="mt-2 leading-relaxed text-emerald-50/90">“{review.comment}”</blockquote>
        <figcaption className="mt-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 font-bold text-emerald-950">
            {initial}
          </span>
          <span className="font-semibold text-emerald-50">{review.reviewerName}</span>
        </figcaption>
      </figure>
    );
  }
  return (
    <figure className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
      <Stars rating={review.rating} className="text-sm font-bold" />
      {review.title && <p className="mt-2 font-bold text-slate-900">{review.title}</p>}
      <blockquote className="mt-2 leading-relaxed text-slate-600">“{review.comment}”</blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
          {initial}
        </span>
        <span className="font-semibold text-slate-800">{review.reviewerName}</span>
      </figcaption>
    </figure>
  );
}
