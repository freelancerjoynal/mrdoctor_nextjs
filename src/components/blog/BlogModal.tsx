"use client";

import { useEffect } from "react";
import type { PublicBlog } from "@/lib/profile";
import { ShareButtons } from "./ShareButtons";

/**
 * Reading modal for a blog post — cover, meta, paragraphs + share buttons.
 * Controlled by BlogSection (or any parent holding `post | null`).
 */
export function BlogModal({
  post,
  shareUrl,
  onClose,
}: {
  post: PublicBlog | null;
  shareUrl: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!post) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [post, onClose]);

  if (!post) return null;

  const paragraphs = (post.content || post.excerpt || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-emerald-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex h-52 items-center justify-center overflow-hidden text-7xl text-white/90">
          {post.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- cover may be any external author-uploaded URL
            <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${post.coverGradient}`}>
              <span>{post.coverSymbol}</span>
            </div>
          )}
          <span className="absolute left-5 top-5 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white">
            {post.category}
          </span>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-xl font-bold text-white hover:bg-black/60"
          >
            ✕
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <h3 className="text-2xl font-bold leading-snug text-emerald-950">{post.title}</h3>
          <p className="mt-2 text-sm text-slate-500">
            {[post.authorName, post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("bn-BD") : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="mt-5 space-y-4">
            {paragraphs.length > 0 ? (
              paragraphs.map((p, i) => (
                <p key={i} className="leading-relaxed text-slate-700">
                  {p}
                </p>
              ))
            ) : (
              <p className="leading-relaxed text-slate-500">শীঘ্রই বিস্তারিত আসছে।</p>
            )}
          </div>

          <div className="mt-7 border-t border-slate-100 pt-5">
            <ShareButtons url={shareUrl} title={post.title} />
          </div>
        </div>
      </div>
    </div>
  );
}
