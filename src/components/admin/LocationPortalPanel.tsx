"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LOCATION_TABLE } from "@/lib/locationSlugs";
import { usePortalHref } from "@/lib/locationClient";
import { apiFetch } from "@/lib/auth/apiFetch";
import { CloudinaryImageInput } from "@/components/CloudinaryImageInput";

interface SettingForm {
  heroImage: string;
  headline: string;
  subheadline: string;
  description: string;
  notice: string;
}

interface SavedSetting {
  slug: string;
  district?: string | null;
  thana?: string | null;
  updatedAt?: string | null;
}

const EMPTY: SettingForm = { heroImage: "", headline: "", subheadline: "", description: "", notice: "" };

const inputCls =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none";

async function fetchSetting(slug: string): Promise<Partial<SettingForm> | null> {
  const res = await apiFetch(`/api/backend/api/admin/location-settings/${encodeURIComponent(slug)}`);
  const json = (await res.json().catch(() => null)) as {
    data?: Partial<SettingForm> | null;
  } | null;
  return json?.data ?? null;
}

function toForm(d: Partial<SettingForm> | null): SettingForm {
  return {
    heroImage: typeof d?.heroImage === "string" ? d.heroImage : "",
    headline: typeof d?.headline === "string" ? d.headline : "",
    subheadline: typeof d?.subheadline === "string" ? d.subheadline : "",
    description: typeof d?.description === "string" ? d.description : "",
    notice: typeof d?.notice === "string" ? d.notice : "",
  };
}

/**
 * /admin/locations — per-thana portal customization.
 * Pick any location (every thana has a portal), set its hero image,
 * headline, sub-headline, description and notice banner, then save.
 * Empty fields = portal falls back to defaults.
 */
export function LocationPortalPanel() {
  const [search, setSearch] = useState("");
  // Deep-linkable editor: /admin/locations?slug=jaldhaka (from a thana
  // portal's "⚙️ পোর্টাল সাজান" entry) preselects that location.
  const [slug, setSlug] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("slug")?.trim().toLowerCase() ?? ""),
  );
  const [form, setForm] = useState<SettingForm>(EMPTY);
  const [saved, setSaved] = useState<SavedSetting[]>([]);
  const [loading, setLoading] = useState(() =>
    typeof window === "undefined"
      ? false
      : !!new URLSearchParams(window.location.search).get("slug")?.trim(),
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: string; err: string }>({ ok: "", err: "" });

  const options = useMemo(() => {
    const seen = new Map<string, { slug: string; label: string; division: string; district: string; thana: string }>();
    for (const r of LOCATION_TABLE) {
      if (!seen.has(r.slug)) {
        seen.set(r.slug, {
          slug: r.slug,
          label: `${r.thanaBn} · ${r.districtBn} (${r.upazilaEn})`,
          division: r.divisionBn,
          district: r.districtBn,
          thana: r.thanaBn,
        });
      }
    }
    const q = search.trim().toLowerCase();
    const all = [...seen.values()].sort((a, b) => a.label.localeCompare(b.label, "bn"));
    if (!q) return all.slice(0, 50);
    return all
      .filter((o) =>
        o.label.toLowerCase().includes(q) ||
        o.slug.includes(q.replace(/\s+/g, "")),
      )
      .slice(0, 50);
  }, [search]);

  const active = (() => {
    for (const r of LOCATION_TABLE) {
      if (r.slug === slug) return { division: r.divisionBn, district: r.districtBn, thana: r.thanaBn };
    }
    return null;
  })();

  const refreshSaved = async () => {
    try {
      const res = await apiFetch("/api/backend/api/admin/location-settings");
      const json = (await res.json().catch(() => null)) as { data?: SavedSetting[] } | null;
      if (Array.isArray(json?.data)) setSaved(json.data);
    } catch {
      /* list stays empty */
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch("/api/backend/api/admin/location-settings");
        const json = (await res.json().catch(() => null)) as { data?: SavedSetting[] } | null;
        if (alive && Array.isArray(json?.data)) setSaved(json.data);
      } catch {
        /* list stays empty */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const pick = useCallback(async (next: string) => {
    setSlug(next);
    setMsg({ ok: "", err: "" });
    if (!next) {
      setForm(EMPTY);
      return;
    }
    setLoading(true);
    try {
      setForm(toForm(await fetchSetting(next)));
    } catch {
      setForm(EMPTY);
      setMsg({ ok: "", err: "সেটিং লোড করা যায়নি।" });
    } finally {
      setLoading(false);
    }
  }, []);

  // Mount deep-link (?slug=): same fetch as pick, but every state write
  // happens inside the async continuation (lint: no sync setState in effect).
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("slug")?.trim().toLowerCase();
    if (!s) return;
    let alive = true;
    (async () => {
      try {
        const form = toForm(await fetchSetting(s));
        if (!alive) return;
        setSlug(s);
        setForm(form);
      } catch {
        if (!alive) return;
        setMsg({ ok: "", err: "সেটিং লোড করা যায়নি।" });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const save = async () => {
    if (!slug || !active) return;
    setSaving(true);
    setMsg({ ok: "", err: "" });
    try {
      const res = await apiFetch(`/api/backend/api/admin/location-settings/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          division: active.division,
          district: active.district,
          thana: active.thana,
          ...form,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setMsg({ ok: `✅ ${slug} পোর্টাল আপডেট হয়েছে।`, err: "" });
      refreshSaved();
    } catch {
      setMsg({ ok: "", err: "সেভ করা যায়নি। আবার চেষ্টা করুন।" });
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof SettingForm) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  // SSR-safe preview link (absolute subdomain URL after hydration).
  const previewHref = usePortalHref(slug || null);

  return (
    <div className="space-y-5">
      {/* Already customized portals */}
      {saved.length > 0 ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p className="font-black text-slate-900">🎨 কাস্টমাইজ করা পোর্টাল ({saved.length})</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {saved.map((s) => (
              <button
                key={s.slug}
                onClick={() => pick(s.slug)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition ${
                  slug === s.slug
                    ? "bg-violet-600 text-white ring-violet-600"
                    : "bg-slate-50 text-slate-700 ring-slate-200 hover:ring-violet-300"
                }`}
              >
                {s.thana || s.district || s.slug} · {s.slug}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Location picker */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <p className="font-black text-slate-900">📍 লোকেশন বেছে নিন</p>
        <p className="mt-1 text-sm text-slate-500">
          প্রতিটি থানার নিজস্ব পোর্টাল আছে — নিচে খুঁজে সিলেক্ট করুন।
        </p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="থানা / জেলা খুঁজুন… (যেমন: নীলফামারী)"
          className={`${inputCls} mt-3 max-w-md`}
        />
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {options.map((o) => (
            <button
              key={o.slug}
              onClick={() => pick(o.slug)}
              className={`rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
                slug === o.slug
                  ? "bg-violet-600 text-white shadow"
                  : "bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:ring-violet-300"
              }`}
            >
              {o.label}
              <span className={`block text-[11px] font-mono ${slug === o.slug ? "text-white/70" : "text-slate-400"}`}>
                {o.slug}.domain.com
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Editor */}
      {slug && active ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-black text-slate-900">
                ✏️ {active.thana} · {active.district}
              </p>
              <p className="text-xs font-bold text-slate-400">
                {active.division} · <span className="font-mono">{slug}</span> · খালি রাখলে ডিফল্ট দেখাবে
              </p>
            </div>
            <a
              href={previewHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
            >
              পোর্টাল দেখুন ↗
            </a>
          </div>

          {loading ? (
            <p className="mt-4 text-sm font-bold text-slate-400">লোড হচ্ছে…</p>
          ) : (
            <div className="mt-4 space-y-4">
              <CloudinaryImageInput
                label="হিরো ছবি (না দিলে ডিফল্ট ডাক্তার ছবি)"
                value={form.heroImage}
                onChange={(v) => setForm((f) => ({ ...f, heroImage: v }))}
                folder="location-heroes"
                previewSize="h-24 w-40"
              />
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-slate-600">হেডলাইন</span>
                <input
                  value={form.headline}
                  onChange={(e) => set("headline")(e.target.value)}
                  placeholder="যেমন: জলঢাকার সেরা ডাক্তার খুঁজুন"
                  maxLength={120}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-slate-600">সাব-হেডলাইন</span>
                <input
                  value={form.subheadline}
                  onChange={(e) => set("subheadline")(e.target.value)}
                  placeholder="যেমন: যাচাইকৃত চেম্বার ডিরেক্টরি"
                  maxLength={200}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-slate-600">বিবরণ</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  maxLength={1000}
                  placeholder="এই এলাকার পোর্টাল সম্পর্কে ২-৩ লাইন…"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-slate-600">নোটিশ ব্যানার (উপরে হলুদ স্ট্রিপ)</span>
                <input
                  value={form.notice}
                  onChange={(e) => set("notice")(e.target.value)}
                  placeholder="যেমন: শুক্রবার সব চেম্বার বন্ধ থাকবে"
                  maxLength={200}
                  className={inputCls}
                />
              </label>
              {msg.ok ? <p className="text-sm font-bold text-emerald-600">{msg.ok}</p> : null}
              {msg.err ? <p className="text-sm font-bold text-red-600">{msg.err}</p> : null}
              <button
                onClick={save}
                disabled={saving}
                className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-black text-white shadow hover:bg-violet-700 disabled:opacity-60"
              >
                {saving ? "সেভ হচ্ছে…" : "💾 সেভ করুন"}
              </button>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
