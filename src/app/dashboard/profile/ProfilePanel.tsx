"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/auth/apiFetch";
import { useAppDispatch } from "@/lib/store/hooks";
import { patchLocalName } from "@/lib/store/profileSlice";
import { CloudinaryImageInput } from "@/components/CloudinaryImageInput";
import type { DoctorProfile } from "@/lib/auth/profiles";

async function profileApi(body: Record<string, unknown>) {
  const res = await apiFetch("/api/backend/api/users/profile", {
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

/** Self-service profile: email/username read-only; DOCTOR can edit all own doctor fields. */
export function ProfilePanel({
  initialEmail,
  initialName,
  role,
  doctorProfile,
}: {
  initialEmail: string;
  initialName: string;
  role?: string;
  doctorProfile?: DoctorProfile | null;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
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
      dispatch(patchLocalName(trimmed));
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
        {role === "DOCTOR" && doctorProfile?.username ? (
          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-bold text-slate-600">ইউজারনেম (অপরিবর্তনীয়)</span>
            <input
              value={doctorProfile.username}
              disabled
              readOnly
              className={`${inputCls} cursor-not-allowed bg-slate-100 text-slate-500`}
            />
          </label>
        ) : null}
      </section>

      {/* Doctor edit-profile — every Doctor field except email/username */}
      {role === "DOCTOR" && (
        <DoctorEditSection initial={doctorProfile ?? null} inputCls={inputCls} />
      )}

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

function str(v: string | null | undefined): string {
  return v ?? "";
}

function DoctorEditSection({ initial, inputCls }: { initial: DoctorProfile | null; inputCls: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({
    name: str(initial?.name),
    name_en: str(initial?.name_en),
    degree: str(initial?.degree),
    degree_en: str(initial?.degree_en),
    speciality: str(initial?.speciality),
    speciality_en: str(initial?.speciality_en),
    tagline: str(initial?.tagline),
    tagline_en: str(initial?.tagline_en),
    bio: str(initial?.bio),
    bio_en: str(initial?.bio_en),
    phone: str(initial?.phone),
    whatsappNumber: str(initial?.whatsappNumber),
    whatsappId: str(initial?.whatsappId),
    whatsappAccessToken: str(initial?.whatsappAccessToken),
    templateName: str(initial?.templateName) || "template_a",
    profilePicture: str(initial?.profilePicture),
    gender: (initial?.gender ?? "") as string,
    religion: str(initial?.religion),
    startedYear: initial?.startedYear != null ? String(initial.startedYear) : "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ ok: "", err: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setMsg({ ok: "", err: "" });
    if (form.name.trim().length < 2 || form.degree.trim().length < 2 || form.speciality.trim().length < 2) {
      setMsg({ ok: "", err: "নাম, ডিগ্রি ও বিশেষত্ব অবশ্যই দিতে হবে।" });
      return;
    }
    if (form.phone.trim().length < 6) {
      setMsg({ ok: "", err: "সঠিক ফোন নম্বর দিন।" });
      return;
    }
    setSaving(true);
    try {
      const doctor: Record<string, unknown> = {
        name: form.name.trim(),
        name_en: form.name_en.trim(),
        degree: form.degree.trim(),
        degree_en: form.degree_en.trim(),
        speciality: form.speciality.trim(),
        speciality_en: form.speciality_en.trim(),
        tagline: form.tagline.trim(),
        tagline_en: form.tagline_en.trim(),
        bio: form.bio.trim(),
        bio_en: form.bio_en.trim(),
        phone: form.phone.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        whatsappId: form.whatsappId.trim(),
        whatsappAccessToken: form.whatsappAccessToken.trim(),
        templateName: form.templateName.trim() || "template_a",
        profilePicture: form.profilePicture.trim(),
        gender: form.gender.trim(),
        religion: form.religion.trim(),
        startedYear: form.startedYear.trim(),
      };
      await profileApi({ doctor });
      const newName = form.name.trim();
      dispatch(patchLocalName(newName));
      setMsg({ ok: "ডাক্তার প্রোফাইল সফলভাবে আপডেট হয়েছে।", err: "" });
      router.refresh();
    } catch (err: unknown) {
      setMsg({ ok: "", err: err instanceof Error ? err.message : "আপডেট ব্যর্থ হয়েছে।" });
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, k: keyof typeof form, placeholder = "", type = "text") => (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-600">{label}</span>
      <input value={form[k]} onChange={set(k)} placeholder={placeholder} type={type} className={inputCls} />
    </label>
  );

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <p className="text-lg font-black text-slate-900">🩺 ডাক্তার প্রোফাইল সম্পাদনা</p>
      <p className="mt-1 text-sm text-slate-500">
        ইমেইল ও ইউজারনেম ছাড়া আপনার সব তথ্য এখান থেকে পরিবর্তন করতে পারবেন।
        {initial?.status ? ` (স্ট্যাটাস: ${initial.status} — পরিবর্তনযোগ্য নয়)` : ""}
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {field("নাম (বাংলা) *", "name", "ডা. ...")}
          {field("Name (English)", "name_en", "Dr. ...")}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {field("ডিগ্রি *", "degree", "MBBS, ...")}
          {field("Degree (English)", "degree_en", "MBBS, ...")}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {field("বিশেষত্ব *", "speciality", "মেডিসিন বিশেষজ্ঞ")}
          {field("Speciality (English)", "speciality_en", "Medicine Specialist")}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {field("ট্যাগলাইন (বাংলা)", "tagline", "সংক্ষিপ্ত পরিচিতি")}
          {field("Tagline (English)", "tagline_en", "Short intro")}
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-600">বায়ো (বাংলা)</span>
          <textarea value={form.bio} onChange={set("bio")} rows={3} className={inputCls} placeholder="আপনার সম্পর্কে লিখুন" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-600">Bio (English)</span>
          <textarea value={form.bio_en} onChange={set("bio_en")} rows={3} className={inputCls} placeholder="Write about yourself" />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {field("ফোন *", "phone", "01XXXXXXXXX", "tel")}
          {field("হোয়াটসঅ্যাপ নম্বর", "whatsappNumber", "01XXXXXXXXX", "tel")}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {field("হোয়াটসঅ্যাপ আইডি", "whatsappId", ".....wa")}
          {field("টেমপ্লেট", "templateName", "template_a")}
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-600">হোয়াটসঅ্যাপ অ্যাক্সেস টোকেন</span>
          <input
            value={form.whatsappAccessToken}
            onChange={set("whatsappAccessToken")}
            type="password"
            autoComplete="off"
            placeholder="••••••••"
            className={inputCls}
          />
        </label>
        <CloudinaryImageInput
          label="প্রোফাইল ছবি (আপলোড করলেই URL বসে যাবে)"
          value={form.profilePicture}
          onChange={(url) => setForm((f) => ({ ...f, profilePicture: url }))}
          folder="profile-pictures"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-600">লিঙ্গ</span>
            <select value={form.gender} onChange={set("gender")} className={inputCls}>
              <option value="">— নির্বাচন করুন —</option>
              <option value="MALE">পুরুষ (MALE)</option>
              <option value="FEMALE">নারী (FEMALE)</option>
            </select>
          </label>
          {field("ধর্ম", "religion", "ইসলাম / হিন্দু / ...")}
          {field("শুরুর বছর", "startedYear", "2010", "number")}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? "সেভ হচ্ছে…" : "💾 ডাক্তার প্রোফাইল সেভ করুন"}
        </button>
      </form>
      {msg.err && <p className="mt-3 text-sm font-bold text-red-600">{msg.err}</p>}
      {msg.ok && <p className="mt-3 text-sm font-bold text-emerald-700">{msg.ok}</p>}
    </section>
  );
}
