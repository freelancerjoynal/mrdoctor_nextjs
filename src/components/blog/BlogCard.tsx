import type { PublicBlog } from "@/lib/profile";

/**
 * Single blog card — matches the "স্বাস্থ্য নিয়ে কিছু জরুরি কথা" design:
 * gradient/symbol cover, category badge, title, excerpt, read-more link.
 * Pure presentational — clicking opens via `onOpen(slug)`.
 */
export function BlogCard({
  post,
  onOpen,
}: {
  post: Pick<PublicBlog, "slug" | "title" | "excerpt" | "coverImage" | "coverGradient" | "coverSymbol" | "category">;
  onOpen: (slug: string) => void;
}) {
  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1.5 hover:shadow-xl">
      <button onClick={() => onOpen(post.slug)} className="block w-full text-left" aria-label={post.title}>
        <div className="relative flex h-44 items-center justify-center overflow-hidden text-6xl text-white/90">
          {post.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- cover may be any external author-uploaded URL
            <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover transition group-hover:scale-105" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${post.coverGradient}`}>
              <span className="transition group-hover:scale-110">{post.coverSymbol}</span>
            </div>
          )}
          <span className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white">
            {post.category}
          </span>
        </div>
      </button>
      <div className="p-6">
        <h3 className="text-lg font-bold leading-snug text-emerald-950">{post.title}</h3>
        {post.excerpt && <p className="mt-2 text-[15px] text-slate-600">{post.excerpt}</p>}
        <button
          onClick={() => onOpen(post.slug)}
          className="mt-4 inline-block font-bold text-emerald-700 group-hover:text-emerald-900"
        >
          বিস্তারিত পড়ুন →
        </button>
      </div>
    </article>
  );
}
