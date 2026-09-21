"use client";

import { useEffect, useMemo, useState } from "react";
import { LOCATION_TABLE } from "@/lib/locationSlugs";
import { getRootDomain } from "@/lib/subdomain";
import { apiFetch } from "@/lib/auth/apiFetch";

type PageType = "GLOBAL" | "LOCATION" | "DOCTOR" | "HOSPITAL";

interface SeoForm {
  title: string;
  h1: string;
  siteName: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonicalUrl: string;
  robots: string;
  extraJsonLd: string;
}

interface SavedRow {
  pageType: PageType;
  pageKey: string;
  title?: string | null;
  updatedAt?: string | null;
}

const EMPTY: SeoForm = {
  title: "",
  h1: "",
  siteName: "",
  description: "",
  keywords: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  canonicalUrl: "",
  robots: "",
  extraJsonLd: "",
};

const inputCls =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none";

function Count({ value, ideal }: { value: string; ideal: [number, number] }) {
  const n = value.trim().length;
  const [lo, hi] = ideal;
  const ok = n === 0 || (n >= lo && n <= hi);
  return (
    <span className={`text-[11px] font-bold ${ok ? "text-slate-400" : "text-amber-600"}`}>
      {n} অক্ষর (লক্ষ্য {lo}–{hi})
    </span>
  );
}

/**
 * /admin/seo — per-page SEO editor (SUPER_ADMIN + ADMIN_MANAGER only,
 * enforced by the /admin layout + backend `protectedRoute`).
 * GLOBAL=home, LOCATION=thana slug, DOCTOR=username, HOSPITAL=slug.
 * Empty fields = page falls back to auto defaults; "ডিফল্টে ফেরত"
 * deletes the override row entirely.
 */
export function SeoPanel() {
  const [type, setType] = useState<PageType>(() =>
    typeof window === "undefined"
      ? "LOCATION"
      : ((new URLSearchParams(window.location.search).get("type")?.toUpperCase() as PageType) || "LOCATION"),
  );
  const [keyInput, setKeyInput] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("key")?.trim().toLowerCase() ?? ""),
  );
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<SeoForm>(EMPTY);
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: string; err: string }>({ ok: "", err: "" });

  const key = type === "GLOBAL" ? "home" : keyInput.trim().toLowerCase();

  const locationOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of LOCATION_TABLE) {
      if (!seen.has(r.slug)) seen.set(r.slug, `${r.thanaBn} · ${r.districtBn}`);
    }
    const q = search.trim().toLowerCase();
    const all = [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1], "bn"));
    if (!q) return all.slice(0, 50);
    return all.filter(([slug, label]) => label.toLowerCase().includes(q) || slug.includes(q.replace(/\s+/g, ""))).slice(0, 50);
  }, [search]);

  const refreshSaved = async () => {
    try {
      const res = await apiFetch("/api/backend/api/admin/seo");
      const json = (await res.json().catch(() => null)) as { data?: SavedRow[] } | null;
      if (Array.isArray(json?.data)) setSaved(json.data);
    } catch {
      /* list stays empty */
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch("/api/backend/api/admin/seo");
        const json = (await res.json().catch(() => null)) as { data?: SavedRow[] } | null;
        if (alive && Array.isArray(json?.data)) setSaved(json.data);
      } catch {
        /* list stays empty */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const load = async (t: PageType, k: string) => {
    if (!k) return;
    setLoading(true);
    setMsg({ ok: "", err: "" });
    resolveAuto(t, k);
    try {
      const res = await apiFetch(`/api/backend/api/admin/seo/${t}/${encodeURIComponent(k)}`);
      const json = (await res.json().catch(() => null)) as { data?: Record<string, unknown> | null } | null;
      const d = json?.data;
      setForm({
        title: typeof d?.title === "string" ? d.title : "",
        h1: typeof d?.h1 === "string" ? d.h1 : "",
        siteName: typeof d?.siteName === "string" ? d.siteName : "",
        description: typeof d?.description === "string" ? d.description : "",
        keywords: typeof d?.keywords === "string" ? d.keywords : "",
        ogTitle: typeof d?.ogTitle === "string" ? d.ogTitle : "",
        ogDescription: typeof d?.ogDescription === "string" ? d.ogDescription : "",
        ogImage: typeof d?.ogImage === "string" ? d.ogImage : "",
        canonicalUrl: typeof d?.canonicalUrl === "string" ? d.canonicalUrl : "",
        robots: typeof d?.robots === "string" ? d.robots : "",
        extraJsonLd: Array.isArray(d?.extraJsonLd) ? JSON.stringify(d.extraJsonLd, null, 2) : "",
      });
    } catch {
      setMsg({ ok: "", err: "লোড করা যায়নি। আবার চেষ্টা করুন।" });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Auto defaults mirror the public page templates (keep in sync with
   * `generateMetadata` in `app/(homePage)`, `app/l/[location]` and
   * `app/s/[subdomain]`). The preview shows EFFECTIVE values —
   * custom override if set, else these auto defaults. Nothing is
   * ever "(অটো … দেখাবে)" placeholder text.
   */
  const [auto, setAuto] = useState<{ title: string; description: string } | null>(null);

  const resolveAuto = async (t: PageType, k: string) => {
    if (t === "GLOBAL") {
      setAuto({
        title: "মিস্টার ডাক্তার — ঘরে বসে ফ্রি ডাক্তারের সিরিয়াল",
        description:
          "আপনার এলাকা বেছে অনলাইনে ডাক্তারের সিরিয়াল নিন — ৬৪ জেলা, ৪৯৪+ থানা ও উপজেলার যাচাইকৃত ডাক্তার, চেম্বার ও হাসপাতাল। ডাক্তার ও হাসপাতালের সফটওয়্যার সম্পূর্ণ ফ্রি।",
      });
      return;
    }
    if (t === "LOCATION") {
      const row = LOCATION_TABLE.find((r) => r.slug === k);
      if (!row) {
        setAuto(null);
        return;
      }
      setAuto({
        title: `${row.thanaBn} — ডাক্তার ও হাসপাতাল`,
        description: `${row.thanaBn} (${row.districtBn} জেলা) এলাকার যাচাইকৃত ডাক্তার, বিভাগ, চেম্বার ও হাসপাতাল — অনলাইনে ফ্রি সিরিয়াল নিন।`,
      });
      return;
    }
    try {
      const path = t === "DOCTOR" ? "doctors" : "hospitals";
      const res = await apiFetch(`/api/backend/api/website/${path}/${encodeURIComponent(k)}`);
      const json = (await res.json().catch(() => null)) as { data?: Record<string, unknown> | null } | null;
      const d = json?.data;
      if (!d || typeof d.name !== "string") {
        setAuto(null);
        return;
      }
      if (t === "DOCTOR") {
        const speciality = typeof d.speciality === "string" ? d.speciality : "";
        const degree = typeof d.degree === "string" ? d.degree : "";
        setAuto({
          title: `${d.name} — ${speciality}`,
          description: `${d.name} (${degree}) — ${speciality}। চেম্বারের ঠিকানা, ভিজিট ফি, সময়সূচি দেখুন ও অনলাইনে ফ্রি সিরিয়াল নিন।`,
        });
      } else {
        const address = typeof d.address === "string" ? d.address : "";
        setAuto({
          title: `${d.name} — হাসপাতাল`,
          description: `${d.name} — ঠিকানা, বিভাগ অনুযায়ী বিশেষজ্ঞ ডাক্তার ও অনলাইন সিরিয়াল। ${address}`.trim(),
        });
      }
    } catch {
      setAuto(null);
    }
  };

  // GLOBAL auto defaults resolve immediately (no key needed).
  useEffect(() => {
    if (type === "GLOBAL") resolveAuto("GLOBAL", "home");
  }, [type]);

  const parseExtra = (): { ok: boolean; value?: unknown[]; err?: string } => {
    const t = form.extraJsonLd.trim();
    if (!t) return { ok: true, value: [] };
    try {
      const v = JSON.parse(t) as unknown;
      if (!Array.isArray(v)) return { ok: false, err: "Extra JSON-LD অবশ্যই [...] অ্যারে হতে হবে।" };
      return { ok: true, value: v };
    } catch {
      return { ok: false, err: "Extra JSON-LD ঠিকমতো JSON নয়।" };
    }
  };

  const save = async () => {
    if (!key) {
      setMsg({ ok: "", err: "আগে পেজ বেছে নিন (slug/username লিখে লোড করুন)।" });
      return;
    }
    const extra = parseExtra();
    if (!extra.ok) {
      setMsg({ ok: "", err: extra.err ?? "JSON ভুল আছে।" });
      return;
    }
    // Every field is optional — only the page selection is required.
    setSaving(true);
    setMsg({ ok: "", err: "" });
    try {
      const res = await apiFetch(`/api/backend/api/admin/seo/${type}/${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, extraJsonLd: extra.value ?? [] }),
        signal: AbortSignal.timeout(25000),
      });
      const json = (await res.json().catch(() => null)) as { error?: unknown } | null;
      if (!res.ok) {
        const detail = typeof json?.error === "string" && json.error ? ` — ${json.error}` : "";
        throw new Error(`সার্ভার এরর (${res.status})${detail}`);
      }
      setMsg({ ok: "✅ সেভ হয়েছে — সাথে সাথে লাইভ।", err: "" });
      refreshSaved();
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === "TimeoutError";
      setMsg({
        ok: "",
        err: aborted
          ? "⏳ সার্ভার সাড়া দিচ্ছে না — backend চালু আছে কি না দেখুন (express → npm run dev), তারপর আবার চেষ্টা করুন।"
          : `সেভ করা যায়নি — ${(e as Error).message || "আবার চেষ্টা করুন।"} (backend restart করে দেখুন।)`,
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!key) return;
    if (!window.confirm(`"${type}/${key}"-এর SEO ডিফল্টে ফেরত যাবে। নিশ্চিত?`)) return;
    setSaving(true);
    try {
      await apiFetch(`/api/backend/api/admin/seo/${type}/${encodeURIComponent(key)}`, {
        method: "DELETE",
        signal: AbortSignal.timeout(25000),
      });
      setForm(EMPTY);
      setMsg({ ok: "🗑️ ডিফল্টে ফেরত গেছে।", err: "" });
      refreshSaved();
    } catch {
      setMsg({ ok: "", err: "ডিলিট করা যায়নি — backend চালু আছে কি না দেখুন।" });
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof SeoForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Effective (live) values — custom override wins, else auto defaults.
  // Each subdomain is its own website, so the preview URL is the portal
  // domain itself (never "apex › type › …").
  const portalDomain = type === "GLOBAL" ? getRootDomain() : `${key || "…"}.${getRootDomain()}`;
  const effectiveTitle = form.title.trim() || auto?.title || "";
  const effectiveDesc = form.description.trim() || auto?.description || "";
  const effectiveCanonical =
    form.canonicalUrl.trim() ||
    (type === "GLOBAL" ? `https://${getRootDomain()}/` : key ? `https://${key}.${getRootDomain()}/` : "");

  return (
    <div className="space-y-5">
      {/* Type tabs */}
      <div className="flex flex-wrap gap-2">
        {(["GLOBAL", "LOCATION", "DOCTOR", "HOSPITAL"] as PageType[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t);
              setMsg({ ok: "", err: "" });
            }}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              type === t ? "bg-violet-600 text-white shadow-lg" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-violet-300"
            }`}
          >
            {t === "GLOBAL" ? "🏠 হোম" : t === "LOCATION" ? "📍 লোকেশন" : t === "DOCTOR" ? "🩺 ডাক্তার" : "🏥 হাসপাতাল"}
          </button>
        ))}
      </div>

      {/* Key picker */}
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        {type === "GLOBAL" ? (
          <p className="text-sm font-bold text-slate-700">
            হোমপেজ (<span className="font-mono">GLOBAL/home</span>) — নিচে টাইটেল ও ডিসক্রিপশন বসান।
          </p>
        ) : type === "LOCATION" ? (
          <div className="space-y-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="থানা খুঁজুন… (যেমন: জলঢাকা / jaldhaka)"
              className={inputCls}
            />
            <div className="flex flex-wrap gap-2">
              {locationOptions.map(([slug, label]) => (
                <button
                  key={slug}
                  onClick={() => {
                    setKeyInput(slug);
                    load("LOCATION", slug);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    keyInput === slug ? "bg-emerald-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={type === "DOCTOR" ? "ডাক্তারের username (যেমন: dr-rahman)" : "হাসপাতালের slug (যেমন: city-hospital)"}
              className={inputCls}
            />
            <button
              onClick={() => load(type, keyInput.trim().toLowerCase())}
              disabled={loading || !keyInput.trim()}
              className="shrink-0 rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? "…" : "লোড করুন"}
            </button>
          </div>
        )}
        {type !== "GLOBAL" && key && (
          <p className="mt-2 text-xs font-bold text-slate-500">
            এডিট হচ্ছে: <span className="font-mono text-violet-700">{type}/{key}</span>
          </p>
        )}
      </div>

      {/* Form — nothing is compulsory except picking the page */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <p className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 ring-1 ring-violet-100">
            💡 সব ফিল্ড ঐচ্ছিক — শুধু যেটা বদলাতে চান সেটাই লিখুন, বাকি খালি রাখুন। খালি থাকলে অটো ডিফল্ট চলবে।
          </p>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-black text-slate-800">টাইটেল (Title)</label>
              <Count value={form.title} ideal={[50, 60]} />
            </div>
            <input value={form.title} onChange={set("title")} placeholder="পেজের শিরোনাম | মিস্টার ডাক্তার" className={inputCls} />
          </div>
          {(type === "GLOBAL" || type === "LOCATION") && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-black text-slate-800">
                  H1 হেডিং <span className="font-normal text-slate-400">(পেজের বড় শিরোনাম)</span>
                </label>
                <Count value={form.h1} ideal={[20, 70]} />
              </div>
              <input value={form.h1} onChange={set("h1")} placeholder="(খালি = অটো H1)" className={inputCls} />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-black text-slate-800">
              সাইটের নাম <span className="font-normal text-slate-400">(সাবডোমেন পোর্টালের নিজস্ব নাম)</span>
            </label>
            <input value={form.siteName} onChange={set("siteName")} placeholder="(খালি = অটো নাম)" className={inputCls} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-black text-slate-800">ডিসক্রিপশন</label>
              <Count value={form.description} ideal={[150, 160]} />
            </div>
            <textarea value={form.description} onChange={set("description")} rows={3} placeholder="১৫০–১৬০ অক্ষরে আকর্ষণীয় সারসংক্ষেপ…" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-black text-slate-800">
              কিওয়ার্ড <span className="font-normal text-slate-400">(ঐচ্ছিক, কমা দিয়ে)</span>
            </label>
            <input value={form.keywords} onChange={set("keywords")} placeholder="ডাক্তার, সিরিয়াল, নীলফামারী" className={inputCls} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-black text-slate-800">
                OG টাইটেল <span className="font-normal text-slate-400">(ঐচ্ছিক)</span>
              </label>
              <input value={form.ogTitle} onChange={set("ogTitle")} placeholder="(খালি = টাইটেল)" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-black text-slate-800">
                OG ছবি <span className="font-normal text-slate-400">(ঐচ্ছিক URL)</span>
              </label>
              <input value={form.ogImage} onChange={set("ogImage")} placeholder="https://…" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-black text-slate-800">
              OG ডিসক্রিপশন <span className="font-normal text-slate-400">(ঐচ্ছিক)</span>
            </label>
            <textarea value={form.ogDescription} onChange={set("ogDescription")} rows={2} placeholder="(খালি = ডিসক্রিপশন)" className={inputCls} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-black text-slate-800">
                Canonical URL <span className="font-normal text-slate-400">(ঐচ্ছিক)</span>
              </label>
              <input value={form.canonicalUrl} onChange={set("canonicalUrl")} placeholder="(খালি = অটো)" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-black text-slate-800">
                Robots <span className="font-normal text-slate-400">(ঐচ্ছিক)</span>
              </label>
              <input value={form.robots} onChange={set("robots")} placeholder="index, follow" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-black text-slate-800">
              Extra JSON-LD <span className="font-normal text-slate-400">(ঐচ্ছিক, [...] অ্যারে)</span>
            </label>
            <textarea
              value={form.extraJsonLd}
              onChange={set("extraJsonLd")}
              rows={3}
              placeholder='[{"@context":"https://schema.org", …}]'
              className={`${inputCls} font-mono text-xs`}
            />
          </div>
          {msg.ok && <p className="text-sm font-bold text-emerald-600">{msg.ok}</p>}
          {msg.err && <p className="text-sm font-bold text-red-600">{msg.err}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={save}
              disabled={saving || (type !== "GLOBAL" && !key)}
              className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-violet-700 disabled:opacity-50"
            >
              {saving ? "সেভ হচ্ছে…" : "💾 সেভ করুন"}
            </button>
            <button
              onClick={remove}
              disabled={saving || (type !== "GLOBAL" && !key)}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-red-600 ring-1 ring-red-200 transition hover:bg-red-50 disabled:opacity-50"
            >
              🗑️ ডিফল্টে ফেরত
            </button>
          </div>
          <p className="text-xs text-slate-400">খালি ফিল্ড = অটো ডিফল্ট দেখাবে। সেভের সাথে সাথে লাইভ হবে।</p>
        </div>

        {/* Google preview + saved list */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">গুগল প্রিভিউ (লাইভ মান)</p>
            <div className="mt-2 rounded-xl bg-slate-50 p-4">
              <p className="truncate text-sm text-slate-500">{portalDomain}</p>
              <p className="mt-0.5 text-lg font-medium leading-snug text-[#1a0dab]">
                {effectiveTitle || <span className="text-slate-400">পেজ বেছে নিন…</span>}
              </p>
              <p className="mt-1 text-sm leading-snug text-slate-600">
                {effectiveDesc || <span className="text-slate-400">টাইটেল-ডিসক্রিপশন এখানে লাইভ দেখাবে।</span>}
              </p>
              {effectiveCanonical && (
                <p className="mt-1 truncate text-[11px] text-slate-400">Canonical: {effectiveCanonical}</p>
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              প্রতিটি সাবডোমেন আলাদা ওয়েবসাইট হিসেবে দেখায় — একটাই ডাটাবেজ থেকে।
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              কাস্টমাইজড পেজ ({saved.length}টি)
            </p>
            {saved.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">এখনো কোনো কাস্টম SEO নেই — সব পেজে অটো ডিফল্ট চলছে।</p>
            ) : (
              <ul className="mt-2 max-h-64 space-y-1.5 overflow-y-auto">
                {saved.map((r) => (
                  <li key={`${r.pageType}/${r.pageKey}`}>
                    <button
                      onClick={() => {
                        setType(r.pageType);
                        if (r.pageType !== "GLOBAL") setKeyInput(r.pageKey);
                        load(r.pageType, r.pageKey);
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-left text-xs transition hover:bg-violet-50"
                    >
                      <span className="font-mono font-bold text-slate-700">
                        {r.pageType}/{r.pageKey}
                      </span>
                      <span className="max-w-[60%] truncate text-slate-400">{r.title || "(আংশিক)"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
