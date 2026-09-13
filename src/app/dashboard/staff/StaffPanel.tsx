"use client";

import { useCallback, useEffect, useState } from "react";

interface StaffRow {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

async function staffApi(path: string, init?: RequestInit) {
  const res = await fetch(`/api/backend/api/users/staff${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as {
    data?: unknown;
    message?: string;
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "অনুরোধ ব্যর্থ হয়েছে।");
  return data;
}

/** Doctor adds staff by email — credentials go to the staff's email. */
export function StaffPanel() {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [oncePassword, setOncePassword] = useState<{ email: string; password: string } | null>(null);

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const data = await staffApi("/");
      setRows(Array.isArray((data as { data?: unknown })?.data) ? ((data as { data: StaffRow[] }).data ?? []) : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    staffApi("/")
      .then((data) => {
        if (cancelled) return;
        setRows(
          Array.isArray((data as { data?: unknown })?.data) ? ((data as { data: StaffRow[] }).data ?? []) : [],
        );
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

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const trimmedName = name.trim().replace(/\s+/g, " ");
    if (trimmedName.length < 2 || trimmedName.length > 80) {
      setError("স্টাফের নাম দিন (২–৮০ অক্ষর)।");
      return;
    }
    if (email.trim().length < 5) {
      setError("সঠিক ইমেইল ঠিকানা দিন।");
      return;
    }
    setSending(true);
    setError("");
    setNotice("");
    setOncePassword(null);
    try {
      const data = (await staffApi("/", {
        method: "POST",
        body: JSON.stringify({ name: trimmedName, email: email.trim() }),
      })) as {
        data?: { staff: StaffRow; tempPassword: string; emailSent: boolean };
        message?: string;
      };
      setNotice(data?.message || "স্টাফ যোগ হয়েছে।");
      if (data?.data?.tempPassword) {
        setOncePassword({ email: data.data.staff.email, password: data.data.tempPassword });
      }
      setName("");
      setEmail("");
      await refresh(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "যোগ করা যায়নি।");
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("এই স্টাফকে সরিয়ে দেবেন?")) return;
    try {
      await staffApi(`/${id}`, { method: "DELETE" });
      await refresh(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "সরানো যায়নি।");
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <p className="text-lg font-black text-slate-900">নতুন স্টাফ যোগ করুন</p>
        <p className="mt-1 text-sm text-slate-500">
          নাম ও ইমেইল দিলেই অ্যাকাউন্ট তৈরি হবে — পাসওয়ার্ড ওই ঠিকানায় পাঠিয়ে দেওয়া হবে।
        </p>
        <form onSubmit={invite} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="স্টাফের নাম *"
            maxLength={80}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@example.com"
            inputMode="email"
            maxLength={160}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {sending ? "যোগ হচ্ছে…" : "➕ স্টাফ যোগ করুন"}
          </button>
        </form>
        {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
        {notice && <p className="mt-3 text-sm font-bold text-emerald-700">{notice}</p>}
        {oncePassword && (
          <div className="mt-3 rounded-xl bg-amber-50 p-4 text-sm ring-1 ring-amber-200">
            <p className="font-black text-amber-900">⚠️ একবারই দেখা যাবে — সংরক্ষণ করুন:</p>
            <p className="mt-1 text-slate-700">
              ইমেইল: <b>{oncePassword.email}</b>
            </p>
            <p className="text-slate-700">
              পাসওয়ার্ড: <b className="select-all">{oncePassword.password}</b>
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-black text-slate-900 sm:text-lg">
          আমার স্টাফ ({rows.length})
        </h2>
        {loading ? (
          <p className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">লোড হচ্ছে…</p>
        ) : rows.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">
            এখনো কোনো স্টাফ যোগ করা হয়নি।
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-100"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">
                    {s.name?.trim() ? s.name : s.email}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {s.name?.trim() ? `${s.email} · ` : ""}
                    {s.isVerified ? "✓ সক্রিয়" : "অপেক্ষমাণ"} · {new Date(s.createdAt).toLocaleDateString("bn-BD")}
                  </p>
                </div>
                <button
                  onClick={() => void remove(s.id)}
                  className="shrink-0 rounded-full px-4 py-2 text-sm font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                >
                  সরান
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
