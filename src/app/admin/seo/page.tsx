import { SeoPanel } from "@/components/admin/SeoPanel";

/** /admin/seo — per-page SEO (titles, descriptions, OG, canonical). */
export default function AdminSeoPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">SEO সেটিংস</h1>
        <p className="mt-1 text-sm text-slate-500">
          হোম, প্রতিটি লোকেশন, ডাক্তার ও হাসপাতাল পেজের টাইটেল, H1, সাইটের নাম ও ডিসক্রিপশন এখান থেকে বদলান — গুগল ও AI সার্চের জন্য। খালি রাখলে অটো ডিফল্ট চলবে।
        </p>
      </div>
      <SeoPanel />
    </div>
  );
}
