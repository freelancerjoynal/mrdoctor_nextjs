"use client";

import { useState } from "react";
import { toBn, bnDateLabel } from "@/lib/bn";
import { apiFetch } from "@/lib/auth/apiFetch";

function taka(n: number): string {
  return `৳${toBn(Math.round(n))}`;
}

interface HospitalOpt {
  id: string;
  name: string;
  slug: string;
}

interface BalanceSummary {
  hospitalId: string;
  hospitalName: string;
  today: { date: string; total: number; count: number; online: { total: number; count: number }; offline: { total: number; count: number } };
  lifetimeOnline: { total: number; count: number; joinedAt: string; doctorCount: number };
  payout: { totalPaid: number; count: number; lastPaidAt: string | null };
  currentBalance: number;
}

/**
 * Super-admin only: hospital online-balance + payout transfer.
 * - Hospital picker (one small query per keystroke, debounced by hand).
 * - Balance summary (aggregates only — no appointment rows transferred).
 * - Payout form → currentBalance drops immediately on success.
 */
export function SuperAdminPayoutPanel() {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<HospitalOpt[]>([]);
  const [searching, setSearching] = useState(false);
  const [hospitalId, setHospitalId] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [balance, setBalance] = useState<BalanceSummary | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState("");

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bKash");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [formOk, setFormOk] = useState("");

  const search = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setOptions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await apiFetch(`/api/backend/api/users/hospital-balance/hospitals?search=${encodeURIComponent(q.trim())}`);
      const data = (await res.json().catch(() => null)) as { data?: HospitalOpt[] } | null;
      setOptions(Array.isArray(data?.data) ? (data?.data ?? []) : []);
    } catch {
      setOptions([]);
    } finally {
      setSearching(false);
    }
  };

  const pick = async (h: HospitalOpt) => {
    setHospitalId(h.id);
    setHospitalName(h.name);
    setOptions([]);
    setQuery(h.name);
    setBalanceError("");
    setBalanceLoading(true);
    try {
      const res = await apiFetch(`/api/backend/api/users/hospital-balance/summary?hospitalId=${encodeURIComponent(h.id)}`);
      const data = (await res.json().catch(() => null)) as { data?: BalanceSummary; error?: string } | null;
      if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
      setBalance(data?.data as BalanceSummary);
    } catch (err: unknown) {
      setBalanceError(err instanceof Error ? err.message : "লোড করা যায়নি।");
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  const send = async () => {
    if (sending || !hospitalId) return;
    setFormError("");
    setFormOk("");
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setFormError("সঠিক টাকার পরিমাণ দিন।");
      return;
    }
    if (balance && n > balance.currentBalance) {
      setFormError(`ব্যালেন্সের বেশি পাঠানো যাবে না (বর্তমান ${taka(balance.currentBalance)})।`);
      return;
    }
    setSending(true);
    try {
      const res = await apiFetch(`/api/backend/api/users/hospital-balance/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId, amount: n, method: method.trim() || undefined, note: note.trim() || undefined }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error || "পাঠানো যায়নি।");
      setFormOk(`✅ ${taka(n)} পাঠানো হয়েছে — ব্যালেন্স কমে গেছে।`);
      setAmount("");
      setNote("");
      await pick({ id: hospitalId, name: hospitalName, slug: "" });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "পাঠানো যায়নি।");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <p className="text-sm font-black text-slate-800">💸 হাসপাতাল পেআউট (সুপার-অ্যাডমিন)</p>
      <p className="mb-3 mt-0.5 text-xs font-bold text-slate-400">
        অনলাইন ব্যালেন্স থেকে টাকা পাঠান — পাঠালেই হাসপাতালের বর্তমান ব্যালেন্স কমে যাবে
      </p>

      {/* Hospital picker */}
      <div className="relative">
        <input
          value={query}
          onChange={(e) => void search(e.target.value)}
          placeholder="হাসপাতালের নাম লিখুন…"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
        />
        {searching && <p className="mt-1 text-xs text-slate-400">খোঁজা হচ্ছে…</p>}
        {options.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            {options.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => void pick(h)}
                  className="block w-full px-3 py-2 text-left text-sm font-bold text-slate-800 hover:bg-emerald-50"
                >
                  🏥 {h.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {balanceError && <p className="mt-3 text-sm font-bold text-red-600">{balanceError}</p>}

      {balanceLoading && <p className="mt-3 rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400">লোড হচ্ছে…</p>}

      {balance && !balanceLoading && (
        <div className="mt-3 space-y-3">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 p-4 text-white">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/80">💰 বর্তমান ব্যালেন্স · {balance.hospitalName}</p>
            <p className="mt-1 text-3xl font-black">{taka(balance.currentBalance)}</p>
            <p className="mt-1 text-xs font-bold text-white/85">
              🌐 সব সময়ের অনলাইন {taka(balance.lifetimeOnline.total)} ({toBn(balance.lifetimeOnline.count)} জন) · ✅ পরিশোধিত{" "}
              {taka(balance.payout.totalPaid)} ({toBn(balance.payout.count)} বার)
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-white/70">
              📆 আজ অনলাইন {taka(balance.today.online.total)} ({toBn(balance.today.online.count)} জন) ·{" "}
              {balance.payout.lastPaidAt ? `শেষ পেআউট ${bnDateLabel(balance.payout.lastPaidAt.slice(0, 10))}` : "এখনো পেআউট হয়নি"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">💸 টাকা পাঠান</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <label className="text-xs font-bold text-slate-500">
                টাকা (৳)
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="যেমন ৫০০০"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </label>
              <label className="text-xs font-bold text-slate-500">
                মাধ্যম
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Bank">Bank</option>
                  <option value="Cash">Cash</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-500">
                নোট (ঐচ্ছিক)
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ট্রানজেকশন আইডি…"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </label>
            </div>
            {formError && <p className="mt-2 text-sm font-bold text-red-600">{formError}</p>}
            {formOk && <p className="mt-2 text-sm font-bold text-emerald-700">{formOk}</p>}
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || !amount}
              className="mt-3 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-black text-white shadow hover:bg-emerald-700 disabled:opacity-50"
            >
              {sending ? "পাঠানো হচ্ছে…" : "💸 পেআউট পাঠান"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
