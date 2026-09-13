"use client";

import { useCallback, useEffect, useState } from "react";
import { toBn } from "@/lib/bn";
import { apiFetch } from "@/lib/auth/apiFetch";

interface BlogRow {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  views: number;
  createdAt: string;
}

const STATUS_BN: Record<BlogRow["status"], string> = {
  DRAFT: "খসড়া",
  PUBLISHED: "প্রকাশিত",
  ARCHIVED: "আর্কাইভ",
};

async function blogApi(path: string, init?: RequestInit) {
  const res = await apiFetch(`/api/backend/api/users/blogs${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as {
    data?: unknown;
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "অনুরোধ ব্যর্থ হয়েছে।");
  return (data as { data?: unknown })?.data;
}

const EMPTY = { title: "", excerpt: "", content: "", category: "স্বাস্থ্য টিপস", status: "DRAFT" as BlogRow["status"] };

/** Doctor writes/updates their own blogs (staff are read-only by API design). */
export function BlogsPanel() {
  const [rows, setRows] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const data = (await blogApi("/?take=50")) as BlogRow[];
      setRows(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (blogApi("/?take=50") as Promise<BlogRow[]>)
      .then((data) => {
        if (cancelled) return;
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startEdit = (b: BlogRow) => {
    setEditingId(b.id);
    setForm({
      title: b.title,
      excerpt: b.excerpt ?? "",
      content: b.content,
      category: b.category,
      status: b.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (form.title.trim().length < 5) {
      setError("শিরোনাম কমপক্ষে ৫ অক্ষরের হতে হবে।");
      return;
    }
    if (form.content.trim().length < 20) {
      setError("লেখা কমপক্ষে ২০ অক্ষরের হতে হবে।");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim() || undefined,
        content: form.content.trim(),
        category: form.category.trim() || undefined,
        status: form.status,
      };
      if (editingId) {
        await blogApi(`/${editingId}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await blogApi("/", { method: "POST", body: JSON.stringify(body) });
      }
      cancelEdit();
      await refresh(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "সংরক্ষণ করা যায়নি।");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (b: BlogRow) => {
    try {
      await blogApi(`/${b.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: b.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }),
      });
      await refresh(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "আপডেট করা যায়নি।");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("এই ব্লগটি মুছে দেবেন?")) return;
    try {
      await blogApi(`/${id}`, { method: "DELETE" });
      await refresh(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "মোছা যায়নি।");
    }
  };

  return (
    <div className="space-y-5">
      {/* ---------- Editor ---------- */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <p className="text-lg font-black text-slate-900">{editingId ? "ব্লগ সম্পাদনা" : "নতুন ব্লগ লিখুন"}</p>
        <form onSubmit={save} className="mt-4 space-y-3">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="শিরোনাম (কমপক্ষে ৫ অক্ষর)"
            maxLength={200}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="বিভাগ (যেমন: স্বাস্থ্য টিপস)"
              maxLength={80}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as BlogRow["status"] })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 focus:border-emerald-500 focus:outline-none"
            >
              <option value="DRAFT">খসড়া হিসেবে রাখুন</option>
              <option value="PUBLISHED">সরাসরি প্রকাশ করুন</option>
            </select>
          </div>
          <input
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            placeholder="সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)"
            maxLength={500}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
          />
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="বিস্তারিত লেখা (কমপক্ষে ২০ অক্ষর)…"
            rows={6}
            maxLength={20000}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
          />
          {error && <p className="text-sm font-bold text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "সংরক্ষণ হচ্ছে…" : editingId ? "আপডেট করুন" : "সংরক্ষণ করুন"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl px-6 py-2.5 font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                বাতিল
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ---------- List ---------- */}
      <section>
        <h2 className="mb-3 text-base font-black text-slate-900 sm:text-lg">আমার ব্লগ ({toBn(rows.length)})</h2>
        {loading ? (
          <p className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">লোড হচ্ছে…</p>
        ) : rows.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">
            এখনো কোনো ব্লগ লেখা হয়নি।
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((b) => (
              <li key={b.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-900">{b.title}</p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          b.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {STATUS_BN[b.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {b.category} · 👁 {toBn(b.views)} · {new Date(b.createdAt).toLocaleDateString("bn-BD")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      onClick={() => void togglePublish(b)}
                      className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
                    >
                      {b.status === "PUBLISHED" ? "খসড়া করুন" : "প্রকাশ করুন"}
                    </button>
                    <button
                      onClick={() => startEdit(b)}
                      className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-50"
                    >
                      সম্পাদনা
                    </button>
                    <button
                      onClick={() => void remove(b.id)}
                      className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                    >
                      মুছুন
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
