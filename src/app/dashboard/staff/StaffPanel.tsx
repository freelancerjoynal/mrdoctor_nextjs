"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";

interface StaffRow {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  isVerified: boolean;
  canApprove?: boolean | null;
  canManageChambers?: boolean | null;
  createdAt: string;
}

async function staffApi(path: string, init?: RequestInit) {
  const res = await apiFetch(`/api/backend/api/users/staff${path}`, {
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
  // Manage-approve option: ON = staff can only collect + update,
  // approval (serve/done) stays with the doctor.
  const [restrictApprove, setRestrictApprove] = useState(false);
  // Chamber-manage option: ON = staff can manage chambers + schedules
  // (timing / date availability) from the Chambers page.
  const [allowChambers, setAllowChambers] = useState(false);
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
        body: JSON.stringify({
          name: trimmedName,
          email: email.trim(),
          canApprove: !restrictApprove,
          canManageChambers: allowChambers,
        }),
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
      setRestrictApprove(false);
      setAllowChambers(false);
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

  const flipApprove = async (s: StaffRow) => {
    setError("");
    try {
      await staffApi(`/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify({ canApprove: !(s.canApprove ?? true) }),
      });
      await refresh(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "বদলানো যায়নি।");
    }
  };

  const flipChambers = async (s: StaffRow) => {
    setError("");
    try {
      await staffApi(`/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify({ canManageChambers: !(s.canManageChambers ?? false) }),
      });
      await refresh(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "বদলানো যায়নি।");
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <p className="text-lg font-black text-slate-900">নতুন স্টাফ যোগ করুন</p>
        <p className="mt-1 text-sm text-slate-500">
          নাম ও ইমেইল দিলেই অ্যাকাউন্ট তৈরি হবে — পাসওয়ার্ড ওই ঠিকানায় পাঠিয়ে দেওয়া হবে।
        </p>
        <form onSubmit={invite} className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
          <button
            type="button"
            onClick={() => setRestrictApprove((v) => !v)}
            aria-pressed={restrictApprove}
            title="চালু করলে স্টাফ শুধু কালেকশন + আপডেট করতে পারবে, অনুমোদন শুধু ডাক্তার দেবেন"
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black ring-1 transition ${
              restrictApprove
                ? "bg-amber-500 text-white ring-amber-500"
                : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${
                restrictApprove ? "justify-end bg-white/30" : "justify-start bg-slate-200"
              }`}
            >
              <span className={`h-4 w-4 rounded-full shadow ${restrictApprove ? "bg-white" : "bg-white"}`} />
            </span>
            🔒 Manage approve {restrictApprove ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            onClick={() => setAllowChambers((v) => !v)}
            aria-pressed={allowChambers}
            title="চালু করলে স্টাফ চেম্বার + সময়সূচি (timing / date availability) পরিচালনা করতে পারবে"
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black ring-1 transition ${
              allowChambers
                ? "bg-emerald-600 text-white ring-emerald-600"
                : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${
                allowChambers ? "justify-end bg-white/30" : "justify-start bg-slate-200"
              }`}
            >
              <span className={`h-4 w-4 rounded-full shadow ${allowChambers ? "bg-white" : "bg-white"}`} />
            </span>
            🏥 Chambers {allowChambers ? "ON" : "OFF"}
          </button>
        </form>
        {restrictApprove && (
          <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
            চালু আছে — এই স্টাফ শুধু কালেকশন (বুকিং) + আপডেট করতে পারবে। সেবা সম্পন্ন / ডিলিটের
            অনুমোদন শুধু আপনি (ডাক্তার) দিতে পারবেন।
          </p>
        )}
        {allowChambers && (
          <p className="mt-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
            চালু আছে — এই স্টাফ চেম্বার + সময়সূচি (timing / date availability) পরিচালনা করতে
            পারবে।
          </p>
        )}
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
            {rows.map((s) => {
              const full = s.canApprove ?? true;
              const managesChambers = s.canManageChambers ?? false;
              return (
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
                    <p className="mt-1.5 flex flex-wrap gap-1.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-black ${
                          full ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {full ? "✓ পূর্ণ অধিকার" : "🔒 শুধু কালেকশন + আপডেট"}
                      </span>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-black ${
                          managesChambers ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {managesChambers ? "🏥 চেম্বার পরিচালনা ON" : "🏥 চেম্বার OFF"}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <button
                      onClick={() => void flipApprove(s)}
                      title={full ? "অনুমোদন সীমাবদ্ধ করুন" : "পূর্ণ অধিকার দিন"}
                      className={`rounded-full px-4 py-2 text-sm font-bold ring-1 transition ${
                        full
                          ? "text-amber-700 ring-amber-200 hover:bg-amber-50"
                          : "text-emerald-700 ring-emerald-200 hover:bg-emerald-50"
                      }`}
                    >
                      {full ? "🔒 সীমাবদ্ধ করুন" : "✓ পূর্ণ করুন"}
                    </button>
                    <button
                      onClick={() => void flipChambers(s)}
                      title={managesChambers ? "চেম্বার পরিচালনা বন্ধ করুন" : "চেম্বার পরিচালনা চালু করুন"}
                      className={`rounded-full px-4 py-2 text-sm font-bold ring-1 transition ${
                        managesChambers
                          ? "text-slate-600 ring-slate-200 hover:bg-slate-50"
                          : "text-emerald-700 ring-emerald-200 hover:bg-emerald-50"
                      }`}
                    >
                      {managesChambers ? "🏥 Chambers OFF" : "🏥 Chambers ON"}
                    </button>
                    <button
                      onClick={() => void remove(s.id)}
                      className="shrink-0 rounded-full px-4 py-2 text-sm font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                    >
                      সরান
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
