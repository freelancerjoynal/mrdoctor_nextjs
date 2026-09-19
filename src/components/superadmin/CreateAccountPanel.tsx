"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";

type Tab = "doctor" | "hospital";

const inputCls =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-violet-500 focus:outline-none";
const labelCls = "text-xs font-bold text-slate-500";

/**
 * Super-admin only: create doctor / hospital accounts directly —
 * no application needed (creates User + profile, verified + approved).
 * Leave the password empty to auto-generate + email it.
 */
export function CreateAccountPanel() {
  const [tab, setTab] = useState<Tab>("doctor");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError("");
    setOk("");
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => {
      const v = String(fd.get(k) ?? "").trim();
      return v ? v : undefined;
    };
    const body =
      tab === "doctor"
        ? {
          name: get("name"),
          email: get("email"),
          password: get("password"),
          phone: get("phone"),
          degree: get("degree"),
          speciality: get("speciality"),
          username: get("username"),
        }
        : {
          hospitalName: get("hospitalName"),
          email: get("email"),
          password: get("password"),
          phone: get("phone"),
          slug: get("slug"),
          division: get("division"),
          district: get("district"),
          thana: get("thana"),
          addressLine: get("addressLine"),
        };
    try {
      const res = await apiFetch(`/api/backend/api/applications/create-${tab}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        message?: string;
        data?: { tempPassword?: string; emailSent?: boolean };
      } | null;
      if (!res.ok) throw new Error(data?.error || "তৈরি করা যায়নি।");
      const pw = data?.data?.tempPassword ? ` অস্থায়ী পাসওয়ার্ড: ${data.data.tempPassword}` : "";
      setOk(`✅ ${data?.message ?? "অ্যাকাউন্ট তৈরি হয়েছে।"}${pw}`);
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "তৈরি করা যায়নি।");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <p className="text-sm font-black text-slate-800">➕ সরাসরি অ্যাকাউন্ট তৈরি (সুপার-অ্যাডমিন)</p>
      <p className="mb-3 mt-0.5 text-xs font-bold text-slate-400">
        আবেদন ছাড়াই ডাক্তার / হাসপাতালের অ্যাকাউন্ট তৈরি করুন — পাসওয়ার্ড খালি রাখলে স্বয়ংক্রিয় + ইমেইলে যাবে
      </p>

      <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        {(["doctor", "hospital"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setError("");
              setOk("");
            }}
            className={`rounded-lg px-3 py-2 text-xs font-black transition ${
              tab === t ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "doctor" ? "🩺 ডাক্তার" : "🏥 হাসপাতাল"}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => void submit(e)} className="grid gap-2 sm:grid-cols-2">
        {tab === "doctor" ? (
          <>
            <label className={labelCls}>নাম*<input name="name" required placeholder="ডা. রহিম উদ্দিন" className={inputCls} /></label>
            <label className={labelCls}>ইমেইল*<input name="email" type="email" required placeholder="you@clinic.com" className={inputCls} /></label>
            <label className={labelCls}>পাসওয়ার্ড (ঐচ্ছিক)<input name="password" type="text" minLength={8} placeholder="খালি = স্বয়ংক্রিয়" className={inputCls} /></label>
            <label className={labelCls}>ফোন*<input name="phone" required placeholder="01700000000" className={inputCls} /></label>
            <label className={labelCls}>ডিগ্রি*<input name="degree" required placeholder="MBBS, FCPS" className={inputCls} /></label>
            <label className={labelCls}>বিশেষজ্ঞতা*<input name="speciality" required placeholder="মেডিসিন বিশেষজ্ঞ" className={inputCls} /></label>
            <label className={`${labelCls} sm:col-span-2`}>ইউজারনেম*<input name="username" required placeholder="dr-rahim" className={inputCls} /></label>
          </>
        ) : (
          <>
            <label className={labelCls}>হাসপাতালের নাম*<input name="hospitalName" required placeholder="সদর হাসপাতাল" className={inputCls} /></label>
            <label className={labelCls}>ইমেইল*<input name="email" type="email" required placeholder="info@hospital.com" className={inputCls} /></label>
            <label className={labelCls}>পাসওয়ার্ড (ঐচ্ছিক)<input name="password" type="text" minLength={8} placeholder="খালি = স্বয়ংক্রিয়" className={inputCls} /></label>
            <label className={labelCls}>ফোন*<input name="phone" required placeholder="01700000000" className={inputCls} /></label>
            <label className={labelCls}>স্লাগ*<input name="slug" required placeholder="sadar-hospital" className={inputCls} /></label>
            <label className={labelCls}>বিভাগ*<input name="division" required placeholder="রংপুর" className={inputCls} /></label>
            <label className={labelCls}>জেলা*<input name="district" required placeholder="নীলফামারী" className={inputCls} /></label>
            <label className={labelCls}>থানা*<input name="thana" required placeholder="নীলফামারী সদর" className={inputCls} /></label>
            <label className={`${labelCls} sm:col-span-2`}>ঠিকানা (ঐচ্ছিক)<input name="addressLine" placeholder="সদর, নীলফামারী" className={inputCls} /></label>
          </>
        )}
        <div className="sm:col-span-2">
          {error && <p className="mb-2 text-sm font-bold text-red-600">{error}</p>}
          {ok && <p className="mb-2 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{ok}</p>}
          <button
            type="submit"
            disabled={sending}
            className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-black text-white shadow hover:bg-violet-700 disabled:opacity-50"
          >
            {sending ? "তৈরি হচ্ছে…" : tab === "doctor" ? "🩺 ডাক্তার তৈরি করুন" : "🏥 হাসপাতাল তৈরি করুন"}
          </button>
        </div>
      </form>
    </section>
  );
}
