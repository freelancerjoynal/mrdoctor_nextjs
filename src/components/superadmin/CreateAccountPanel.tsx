"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";
import { CloudinaryImageInput } from "@/components/CloudinaryImageInput";

type Tab = "doctor" | "hospital";

const inputCls =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-violet-500 focus:outline-none";
const labelCls = "text-xs font-bold text-slate-500";
const sectionCls = "sm:col-span-2 mt-2 text-xs font-black uppercase tracking-wide text-violet-600";

/**
 * Super-admin only: create doctor / hospital accounts directly —
 * no application needed (creates User + profile, verified + approved).
 * Asks every Doctor / Hospital table field (login + profile mirrors).
 * Leave the password empty to auto-generate + email it.
 */
export function CreateAccountPanel() {
  const [tab, setTab] = useState<Tab>("doctor");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [picture, setPicture] = useState("");
  const [formKey, setFormKey] = useState(0);

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
    // Send every field; backend treats ""/missing optional ones as null.
    const body =
      tab === "doctor"
        ? {
            name: get("name"),
            name_en: get("name_en"),
            email: get("email"),
            password: get("password"),
            phone: get("phone"),
            degree: get("degree"),
            degree_en: get("degree_en"),
            speciality: get("speciality"),
            speciality_en: get("speciality_en"),
            username: get("username"),
            tagline: get("tagline"),
            tagline_en: get("tagline_en"),
            bio: get("bio"),
            bio_en: get("bio_en"),
            whatsappNumber: get("whatsappNumber"),
            whatsappId: get("whatsappId"),
            whatsappAccessToken: get("whatsappAccessToken"),
            templateName: get("templateName"),
            profilePicture: picture.trim() || undefined,
            gender: get("gender"),
            religion: get("religion"),
            startedYear: get("startedYear"),
            bmdcNumber: get("bmdcNumber"),
          }
        : {
            hospitalName: get("hospitalName"),
            name_en: get("name_en"),
            email: get("email"),
            password: get("password"),
            phone: get("phone"),
            slug: get("slug"),
            templateName: get("templateName"),
            division: get("division"),
            division_en: get("division_en"),
            district: get("district"),
            district_en: get("district_en"),
            thana: get("thana"),
            thana_en: get("thana_en"),
            addressLine: get("addressLine"),
            addressLine_en: get("addressLine_en"),
            establishedYear: get("establishedYear"),
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
      setPicture("");
      setFormKey((k) => k + 1);
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

      <form key={`${tab}-${formKey}`} onSubmit={(e) => void submit(e)} className="grid gap-2 sm:grid-cols-2">
        {tab === "doctor" ? (
          <>
            <p className={sectionCls}>🔑 লগইন তথ্য</p>
            <label className={labelCls}>ইমেইল*<input name="email" type="email" required placeholder="you@clinic.com" className={inputCls} /></label>
            <label className={labelCls}>পাসওয়ার্ড (ঐচ্ছিক)<input name="password" type="text" minLength={8} placeholder="খালি = স্বয়ংক্রিয়" className={inputCls} /></label>
            <label className={labelCls}>ইউজারনেম*<input name="username" required placeholder="dr-rahim" className={inputCls} /></label>
            <label className={labelCls}>টেমপ্লেট<input name="templateName" placeholder="template_a" defaultValue="template_a" className={inputCls} /></label>

            <p className={sectionCls}>🩺 মূল পরিচিতি (Doctor টেবিল)</p>
            <label className={labelCls}>নাম (বাংলা)*<input name="name" required placeholder="ডা. রহিম উদ্দিন" className={inputCls} /></label>
            <label className={labelCls}>Name (English)<input name="name_en" placeholder="Dr. Rahim Uddin" className={inputCls} /></label>
            <label className={labelCls}>ডিগ্রি*<input name="degree" required placeholder="MBBS, FCPS" className={inputCls} /></label>
            <label className={labelCls}>Degree (English)<input name="degree_en" placeholder="MBBS, FCPS" className={inputCls} /></label>
            <label className={labelCls}>বিশেষজ্ঞতা*<input name="speciality" required placeholder="মেডিসিন বিশেষজ্ঞ" className={inputCls} /></label>
            <label className={labelCls}>Speciality (English)<input name="speciality_en" placeholder="Medicine Specialist" className={inputCls} /></label>
            <label className={labelCls}>BMDC নম্বর<input name="bmdcNumber" placeholder="A-12345" className={inputCls} /></label>
            <label className={labelCls}>ট্যাগলাইন (বাংলা)<input name="tagline" placeholder="সংক্ষিপ্ত পরিচিতি" className={inputCls} /></label>
            <label className={`${labelCls} sm:col-span-2`}>Tagline (English)<input name="tagline_en" placeholder="Short intro" className={inputCls} /></label>
            <label className={`${labelCls} sm:col-span-2`}>বায়ো (বাংলা)<textarea name="bio" rows={2} placeholder="ডাক্তার সম্পর্কে লিখুন" className={inputCls} /></label>
            <label className={`${labelCls} sm:col-span-2`}>Bio (English)<textarea name="bio_en" rows={2} placeholder="Write about the doctor" className={inputCls} /></label>

            <p className={sectionCls}>📞 যোগাযোগ</p>
            <label className={labelCls}>ফোন*<input name="phone" required placeholder="01700000000" className={inputCls} /></label>
            <label className={labelCls}>হোয়াটসঅ্যাপ নম্বর<input name="whatsappNumber" placeholder="01700000000" className={inputCls} /></label>
            <label className={labelCls}>হোয়াটসঅ্যাপ আইডি<input name="whatsappId" placeholder="....wa" className={inputCls} /></label>
            <label className={labelCls}>হোয়াটসঅ্যাপ অ্যাক্সেস টোকেন<input name="whatsappAccessToken" type="password" autoComplete="off" placeholder="••••••••" className={inputCls} /></label>

            <p className={sectionCls}>👤 অতিরিক্ত</p>
            <div className="sm:col-span-2">
              <CloudinaryImageInput
                label="📷 প্রোফাইল ছবি (আপলোড করুন অথবা URL দিন)"
                value={picture}
                onChange={setPicture}
                folder="profile-pictures"
              />
            </div>
            <label className={labelCls}>লিঙ্গ
              <select name="gender" className={inputCls} defaultValue="">
                <option value="">— নির্বাচন করুন —</option>
                <option value="MALE">পুরুষ (MALE)</option>
                <option value="FEMALE">নারী (FEMALE)</option>
              </select>
            </label>
            <label className={labelCls}>ধর্ম
              <select name="religion" className={inputCls} defaultValue="Muslim">
                <option value="Muslim">Muslim</option>
                <option value="Hindu">Hindu</option>
              </select>
            </label>
            <label className={`${labelCls} sm:col-span-2`}>শুরুর বছর<input name="startedYear" type="number" min={1950} max={2026} placeholder="2010" className={inputCls} /></label>
          </>
        ) : (
          <>
            <p className={sectionCls}>🔑 লগইন তথ্য</p>
            <label className={labelCls}>ইমেইল*<input name="email" type="email" required placeholder="info@hospital.com" className={inputCls} /></label>
            <label className={labelCls}>পাসওয়ার্ড (ঐচ্ছিক)<input name="password" type="text" minLength={8} placeholder="খালি = স্বয়ংক্রিয়" className={inputCls} /></label>
            <label className={labelCls}>স্লাগ*<input name="slug" required placeholder="sadar-hospital" className={inputCls} /></label>
            <label className={labelCls}>টেমপ্লেট<input name="templateName" placeholder="template_a" defaultValue="template_a" className={inputCls} /></label>

            <p className={sectionCls}>🏥 মূল পরিচিতি (Hospital টেবিল)</p>
            <label className={labelCls}>হাসপাতালের নাম (বাংলা)*<input name="hospitalName" required placeholder="সদর হাসপাতাল" className={inputCls} /></label>
            <label className={labelCls}>Name (English)<input name="name_en" placeholder="Sadar Hospital" className={inputCls} /></label>
            <label className={labelCls}>ফোন*<input name="phone" required placeholder="01700000000" className={inputCls} /></label>
            <label className={labelCls}>প্রতিষ্ঠার বছর<input name="establishedYear" type="number" min={1800} max={2026} placeholder="2005" className={inputCls} /></label>

            <p className={sectionCls}>📍 ঠিকানা</p>
            <label className={labelCls}>বিভাগ*<input name="division" required placeholder="রংপুর" className={inputCls} /></label>
            <label className={labelCls}>Division (English)<input name="division_en" placeholder="Rangpur" className={inputCls} /></label>
            <label className={labelCls}>জেলা*<input name="district" required placeholder="নীলফামারী" className={inputCls} /></label>
            <label className={labelCls}>District (English)<input name="district_en" placeholder="Nilphamari" className={inputCls} /></label>
            <label className={labelCls}>থানা*<input name="thana" required placeholder="নীলফামারী সদর" className={inputCls} /></label>
            <label className={labelCls}>Thana (English)<input name="thana_en" placeholder="Nilphamari Sadar" className={inputCls} /></label>
            <label className={labelCls}>ঠিকানা (বাংলা)<input name="addressLine" placeholder="সদর, নীলফামারী" className={inputCls} /></label>
            <label className={labelCls}>Address (English)<input name="addressLine_en" placeholder="Sadar, Nilphamari" className={inputCls} /></label>
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
