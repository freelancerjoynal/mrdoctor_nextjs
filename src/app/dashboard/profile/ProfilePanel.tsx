"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function profileApi(body: Record<string, string>) {
  const res = await fetch("/api/backend/api/users/profile", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as {
    profile?: { name?: string | null };
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "আপডেট ব্যর্থ হয়েছে।");
  return data;
}

/** Self-service profile: email is read-only, name + password are editable. */
export function ProfilePanel({
  initialEmail,
  initialName,
}: {
  initialEmail: string;
  initialName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState({ ok: "", err: "" });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ ok: "", err: "" });

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nameSaving) return;
    setNameMsg({ ok: "", err: "" });
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (trimmed.length < 2 || trimmed.length > 80) {
      setNameMsg({ ok: "", err: "নাম ২–৮০ অক্ষরের মধ্যে হতে হবে।" });
      return;
    }
    setNameSaving(true);
    try {
      await profileApi({ name: trimmed });
      setName(trimmed);
      setNameMsg({ ok: "নাম সফলভাবে আপডেট হয়েছে।", err: "" });
      router.refresh();
    } catch (err: unknown) {
      setNameMsg({ ok: "", err: err instanceof Error ? err.message : "আপডেট ব্যর্থ হয়েছে।" });
    } finally {
      setNameSaving(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwSaving) return;
    setPwMsg({ ok: "", err: "" });
    if (!currentPassword) {
      setPwMsg({ ok: "", err: "বর্তমান পাসওয়ার্ড দিন।" });
      return;
    }
    if (newPassword.length < 6) {
      setPwMsg({ ok: "", err: "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ ok: "", err: "নতুন পাসওয়ার্ড দুবার একই হতে হবে।" });
      return;
    }
    setPwSaving(true);
    try {
      await profileApi({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwMsg({ ok: "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।", err: "" });
    } catch (err: unknown) {
      setPwMsg({ ok: "", err: err instanceof Error ? err.message : "আপডেট ব্যর্থ হয়েছে।" });
    } finally {
      setPwSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";

  return (
    <div className="space-y-5">
      {/* Email — immutable */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <p className="text-lg font-black text-slate-900">👤 আমার প্রোফাইল</p>
        <p className="mt-1 text-sm text-slate-500">ইমেইল পরিবর্তন করা যাবে না — শুধু দেখা যাবে।</p>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-bold text-slate-600">ইমেইল (অপরিবর্তনীয়)</span>
          <input value={initialEmail} disabled readOnly className={`${inputCls} cursor-not-allowed bg-slate-100 text-slate-500`} />
        </label>
      </section>

      {/* Name */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <p className="text-lg font-black text-slate-900">নাম পরিবর্তন</p>
        <form onSubmit={saveName} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="আপনার নাম"
            maxLength={80}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={nameSaving}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {nameSaving ? "সেভ হচ্ছে…" : "💾 নাম সেভ করুন"}
          </button>
        </form>
        {nameMsg.err && <p className="mt-3 text-sm font-bold text-red-600">{nameMsg.err}</p>}
        {nameMsg.ok && <p className="mt-3 text-sm font-bold text-emerald-700">{nameMsg.ok}</p>}
      </section>

      {/* Password */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <p className="text-lg font-black text-slate-900">পাসওয়ার্ড পরিবর্তন</p>
        <form onSubmit={savePassword} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-600">বর্তমান পাসওয়ার্ড</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">নতুন পাসওয়ার্ড আবার দিন</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className={inputCls}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={pwSaving}
            className="rounded-xl bg-sky-600 px-6 py-2.5 font-bold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {pwSaving ? "পরিবর্তন হচ্ছে…" : "🔑 পাসওয়ার্ড পরিবর্তন করুন"}
          </button>
        </form>
        {pwMsg.err && <p className="mt-3 text-sm font-bold text-red-600">{pwMsg.err}</p>}
        {pwMsg.ok && <p className="mt-3 text-sm font-bold text-emerald-700">{pwMsg.ok}</p>}
      </section>
    </div>
  );
}
