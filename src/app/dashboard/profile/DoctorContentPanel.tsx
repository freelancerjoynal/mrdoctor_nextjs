"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";

interface HighlightRow {
  icon: string;
  text: string;
}
interface StatRow {
  value: string;
  label: string;
}
interface TimelineRow {
  year: string;
  title: string;
}

async function infoApi(path: string, init?: RequestInit) {
  const res = await apiFetch(`/api/backend/api/users/doctor-information${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as {
    data?: {
      highlights?: HighlightRow[];
      stats?: StatRow[];
      timeline?: TimelineRow[];
      aboutImage?: string | null;
    } | null;
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "অনুরোধ ব্যর্থ হয়েছে।");
  return data?.data ?? null;
}

const asRows = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Doctor's public-website content: highlights, hero stat, timeline, about image. */
export function DoctorContentPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [highlights, setHighlights] = useState<HighlightRow[]>([]);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const info = await infoApi("/");
      setHighlights(
        asRows<HighlightRow>(info?.highlights).map((h) => ({
          icon: typeof h.icon === "string" ? h.icon : "✓",
          text: typeof h.text === "string" ? h.text : "",
        })),
      );
      setStats(
        asRows<StatRow>(info?.stats).map((s) => ({
          value: typeof s.value === "string" ? s.value : "",
          label: typeof s.label === "string" ? s.label : "",
        })),
      );
      setTimeline(
        asRows<TimelineRow>(info?.timeline).map((t) => ({
          year: typeof t.year === "string" ? t.year : "",
          title: typeof t.title === "string" ? t.title : "",
        })),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await infoApi("/", {
        method: "PUT",
        body: JSON.stringify({
          highlights: highlights
            .filter((h) => h.text.trim())
            .map((h) => ({ icon: h.icon.trim() || "✓", text: h.text.trim() })),
          stats: stats
            .filter((s) => s.value.trim())
            .map((s) => ({ value: s.value.trim(), label: s.label.trim() })),
          timeline: timeline
            .filter((t) => t.year.trim() && t.title.trim())
            .map((t) => ({ year: t.year.trim(), title: t.title.trim() })),
        }),
      });
      setNotice("পাবলিক ওয়েবসাইটের তথ্য আপডেট হয়েছে। ✅");
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "সেভ করা যায়নি।");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";

  const rowBtn =
    "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-50";

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <p className="text-lg font-black text-slate-900">🌐 পাবলিক ওয়েবসাইটের তথ্য</p>
      <p className="mt-1 text-sm text-slate-500">
        পরিচিতির ✓ তালিকা, হিরো পরিসংখ্যান (প্রথমটি — যেমন ১২ হাজার+ / সুস্থ রোগী) এবং যোগ্যতা ও
        অভিজ্ঞতার টাইমলাইন — এখানে বদলালেই আপনার পাবলিক পেজে দেখাবে।
      </p>

      {loading ? (
        <div className="mt-4 space-y-2" aria-label="লোড হচ্ছে">
          <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
          <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
        </div>
      ) : (
        <form onSubmit={save} className="mt-4 space-y-5">
          {/* Highlights */}
          <div>
            <p className="text-sm font-black text-slate-700">✓ তালিকা (পরিচিতি সেকশন)</p>
            <div className="mt-2 space-y-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={h.icon}
                    onChange={(e) =>
                      setHighlights((rows) => rows.map((r, j) => (j === i ? { ...r, icon: e.target.value } : r)))
                    }
                    placeholder="✓"
                    maxLength={20}
                    aria-label="আইকন"
                    className="w-16 shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-center text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    value={h.text}
                    onChange={(e) =>
                      setHighlights((rows) => rows.map((r, j) => (j === i ? { ...r, text: e.target.value } : r)))
                    }
                    placeholder="যেমন: প্রতিটি রোগীকে পর্যাপ্ত সময় দেওয়া"
                    maxLength={200}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setHighlights((rows) => rows.filter((_, j) => j !== i))}
                    className={rowBtn}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setHighlights((rows) => [...rows, { icon: "✓", text: "" }])}
                className="rounded-xl px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
              >
                ＋ যোগ করুন
              </button>
            </div>
          </div>

          {/* Stats */}
          <div>
            <p className="text-sm font-black text-slate-700">
              📊 হিরো পরিসংখ্যান <span className="font-bold text-slate-400">(প্রথমটি হিরোতে দেখায়)</span>
            </p>
            <div className="mt-2 space-y-2">
              {stats.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={s.value}
                    onChange={(e) =>
                      setStats((rows) => rows.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))
                    }
                    placeholder="১২ হাজার+"
                    maxLength={20}
                    aria-label="মান"
                    className="w-32 shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    value={s.label}
                    onChange={(e) =>
                      setStats((rows) => rows.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))
                    }
                    placeholder="সুস্থ রোগী"
                    maxLength={200}
                    aria-label="লেবেল"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setStats((rows) => rows.filter((_, j) => j !== i))}
                    className={rowBtn}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setStats((rows) => [...rows, { value: "", label: "" }])}
                className="rounded-xl px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
              >
                ＋ যোগ করুন
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <p className="text-sm font-black text-slate-700">🎓 যোগ্যতা ও অভিজ্ঞতা (টাইমলাইন)</p>
            <div className="mt-2 space-y-2">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={t.year}
                    onChange={(e) =>
                      setTimeline((rows) => rows.map((r, j) => (j === i ? { ...r, year: e.target.value } : r)))
                    }
                    placeholder="২০১০"
                    maxLength={20}
                    aria-label="সাল"
                    className="w-28 shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    value={t.title}
                    onChange={(e) =>
                      setTimeline((rows) => rows.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)))
                    }
                    placeholder="এমবিবিএস, ঢাকা মেডিকেল কলেজ"
                    maxLength={200}
                    aria-label="বিবরণ"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setTimeline((rows) => rows.filter((_, j) => j !== i))}
                    className={rowBtn}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setTimeline((rows) => [...rows, { year: "", title: "" }])}
                className="rounded-xl px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
              >
                ＋ যোগ করুন
              </button>
            </div>
          </div>

          {error && <p className="text-sm font-bold text-red-600">{error}</p>}
          {notice && <p className="text-sm font-bold text-emerald-700">{notice}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "সেভ হচ্ছে…" : "💾 ওয়েবসাইট তথ্য সেভ করুন"}
          </button>
        </form>
      )}
    </section>
  );
}
