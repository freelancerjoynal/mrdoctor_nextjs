"use client";

import { useCallback, useMemo, useState } from "react";
import type { PublicBlog } from "@/lib/profile";
import { BlogCard } from "./BlogCard";
import { BlogModal } from "./BlogModal";

function hashFor(slug: string) {
  return `#blog-${slug}`;
}

/**
 * Blog grid section for a profile site ("ব্লগ / স্বাস্থ্য নিয়ে কিছু জরুরি কথা").
 * - Renders cards from DB posts (falls back to whatever the parent passes).
 * - Opens posts in a modal with share buttons.
 * - Syncs `#blog-<slug>` to the URL so shared links deep-link to the post.
 */
export function BlogSection({
  posts,
  eyebrow = "ব্লগ",
  heading = "স্বাস্থ্য নিয়ে কিছু জরুরি কথা",
}: {
  posts: PublicBlog[];
  eyebrow?: string;
  heading?: string;
}) {
  // Lazy init (no effect): page URL for share links + `#blog-<slug>`
  // deep-link opened on load. SSR-safe via the typeof window guards.
  const [pageUrl] = useState(() =>
    typeof window === "undefined" ? "" : window.location.origin + window.location.pathname,
  );
  const [activeSlug, setActiveSlug] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const fromHash = window.location.hash.match(/^#blog-(.+)$/)?.[1];
    return fromHash && posts.some((p) => p.slug === fromHash) ? fromHash : null;
  });

  const openPost = useCallback((slug: string) => {
    setActiveSlug(slug);
    window.history.replaceState(null, "", hashFor(slug));
  }, []);

  const closePost = useCallback(() => {
    setActiveSlug(null);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const activePost = useMemo(
    () => posts.find((p) => p.slug === activeSlug) ?? null,
    [posts, activeSlug],
  );

  if (posts.length === 0) return null;

  return (
    <section id="blog" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 md:py-20">
      <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
        <span className="inline-block h-px w-10 bg-emerald-600" />
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold text-emerald-950 md:text-4xl">{heading}</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {posts.map((p) => (
          <BlogCard key={p.slug} post={p} onOpen={openPost} />
        ))}
      </div>
      <BlogModal
        post={activePost}
        shareUrl={activePost ? `${pageUrl}${hashFor(activePost.slug)}` : pageUrl}
        onClose={closePost}
      />
    </section>
  );
}
