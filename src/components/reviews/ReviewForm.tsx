"use client";

import { useState } from "react";

export type ReviewTarget =
  | { type: "doctor"; username: string }
  | { type: "hospital"; slug: string };

/**
 * Visitor review form — posts to the same-origin `/api/reviews` proxy
 * (which forwards to the backend). New reviews are PENDING, so the
 * success note explains they appear after approval.
 */
export function ReviewForm({ target, dark = false }: { target: ReviewTarget; dark?: boolean }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || comment.trim().length < 5) {
      setError("আপনার নাম ও মতামত (কমপক্ষে ৫ অক্ষর) লিখুন।");
      return;
    }
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(target.type === "doctor" ? { doctorUsername: target.username } : { hospitalSlug: target.slug }),
          reviewerName: name.trim(),
          rating,
          comment: comment.trim(),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "জমা দেওয়া যায়নি। আবার চেষ্টা করুন।");
      }
      setState("done");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "জমা দেওয়া যায়নি। আবার চেষ্টা করুন।";
      setError(message);
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className={`rounded-2xl p-6 text-center ${dark ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-900"}`}>
        <p className="text-3xl">🙏</p>
        <p className="mt-2 font-bold">মতামত পাঠানোর জন্য ধন্যবাদ!</p>
        <p className={`mt-1 text-sm ${dark ? "text-emerald-100/80" : "text-slate-600"}`}>
          অনুমোদনের পর আপনার মতামত এখানে দেখা যাবে।
        </p>
      </div>
    );
  }

  const inputCls = dark
    ? "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder:text-emerald-100/50 focus:border-amber-300 focus:outline-none"
    : "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";

  return (
    <form
      onSubmit={submit}
      className={`rounded-2xl p-6 ${dark ? "bg-white/5 ring-1 ring-white/10" : "bg-slate-50 ring-1 ring-slate-100"}`}
    >
      <p className={`font-bold ${dark ? "text-white" : "text-slate-900"}`}>আপনার মতামত দিন</p>
      <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="রেটিং">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} তারা`}
            className={`text-3xl transition hover:scale-110 ${(hover || rating) >= n ? "text-amber-400" : "text-slate-300"}`}
          >
            ★
          </button>
        ))}
        <span className={`ml-2 text-sm font-semibold ${dark ? "text-emerald-100/70" : "text-slate-500"}`}>
          {rating}/৫
        </span>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="আপনার নাম"
        maxLength={60}
        className={`mt-3 ${inputCls}`}
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="চিকিৎসা/সেবা সম্পর্কে আপনার অভিজ্ঞতা লিখুন…"
        rows={3}
        maxLength={1000}
        className={`mt-3 ${inputCls}`}
      />
      {error && <p className="mt-2 text-sm font-semibold text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-4 rounded-full bg-amber-400 px-7 py-2.5 font-bold text-emerald-950 shadow hover:bg-amber-300 disabled:opacity-60"
      >
        {state === "sending" ? "পাঠানো হচ্ছে…" : "মতামত পাঠান"}
      </button>
    </form>
  );
}
