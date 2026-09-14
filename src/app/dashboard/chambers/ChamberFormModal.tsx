"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";
import { HospitalPicker } from "./HospitalPicker";
import type { ChamberRow, HospitalFacets } from "./types";

async function chamberApi(path: string, init?: RequestInit) {
  const res = await apiFetch(`/api/backend/api/users/chambers${path}`, {
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

const EMPTY = {
  chamberName: "",
  chamberName_en: "",
  addressLine: "",
  addressLine_en: "",
  thana: "",
  thana_en: "",
  district: "",
  district_en: "",
  division: "",
  division_en: "",
  newPatientFee: "500",
  oldPatientFee: "400",
  latitude: "",
  longitude: "",
};

function fromChamber(c: ChamberRow) {
  return {
    chamberName: c.chamberName ?? "",
    chamberName_en: c.chamberName_en ?? "",
    addressLine: c.addressLine ?? "",
    addressLine_en: c.addressLine_en ?? "",
    thana: c.thana ?? "",
    thana_en: c.thana_en ?? "",
    district: c.district ?? "",
    district_en: c.district_en ?? "",
    division: c.division ?? "",
    division_en: c.division_en ?? "",
    newPatientFee: String(c.newPatientFee ?? 0),
    oldPatientFee: String(c.oldPatientFee ?? 0),
    latitude: c.latitude != null ? String(c.latitude) : "",
    longitude: c.longitude != null ? String(c.longitude) : "",
  };
}

/** Popup with the chamber's full information (+ hospital link). */
export function ChamberFormModal({
  mode,
  chamber,
  initialFacets,
  onClose,
  onSaved,
  onError,
}: {
  mode: "new" | "edit";
  chamber?: ChamberRow | null;
  initialFacets: HospitalFacets;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState(() => (chamber ? fromChamber(chamber) : EMPTY));
  const [hospitalId, setHospitalId] = useState(chamber?.hospitalId ?? chamber?.hospital?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!form.chamberName.trim() && !form.addressLine.trim()) {
      setError("চেম্বারের নাম বা ঠিকানা অন্তত একটি দিন।");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        chamberName: form.chamberName.trim(),
        chamberName_en: form.chamberName_en.trim(),
        addressLine: form.addressLine.trim(),
        addressLine_en: form.addressLine_en.trim(),
        thana: form.thana.trim(),
        thana_en: form.thana_en.trim(),
        district: form.district.trim(),
        district_en: form.district_en.trim(),
        division: form.division.trim(),
        division_en: form.division_en.trim(),
        newPatientFee: form.newPatientFee.trim() === "" ? 0 : Number(form.newPatientFee),
        oldPatientFee: form.oldPatientFee.trim() === "" ? 0 : Number(form.oldPatientFee),
        latitude: form.latitude.trim(),
        longitude: form.longitude.trim(),
        hospitalId: hospitalId || null,
      };
      if (mode === "edit" && chamber) {
        await chamberApi(`/${chamber.id}`, { method: "PATCH", body: JSON.stringify(body) });
        onSaved("চেম্বার আপডেট হয়েছে।");
      } else {
        await chamberApi("/", { method: "POST", body: JSON.stringify(body) });
        onSaved("নতুন চেম্বার যোগ হয়েছে।");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "সেভ করা যায়নি।";
      setError(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-black text-slate-900">
              {mode === "edit" ? "✏️ চেম্বারের তথ্য" : "➕ নতুন চেম্বারের তথ্য"}
            </p>
            <p className="mt-1 text-sm text-slate-500">বাংলা + English দুটোই রাখুন — প্রয়োজনে হাসপাতাল সংযুক্ত করুন।</p>
          </div>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            ✕
          </button>
        </div>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">চেম্বারের নাম (বাংলা)</span>
              <input value={form.chamberName} onChange={set("chamberName")} placeholder="স্পেশালিষ্ট চেম্বার" maxLength={120} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">Chamber name (English)</span>
              <input value={form.chamberName_en} onChange={set("chamberName_en")} placeholder="Specialist Chamber" maxLength={120} className={inputCls} />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">ঠিকানা (বাংলা)</span>
              <input value={form.addressLine} onChange={set("addressLine")} placeholder="স্টেশন রোড, নীলফামারী" maxLength={300} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">Address (English)</span>
              <input value={form.addressLine_en} onChange={set("addressLine_en")} placeholder="Station Road, Nilphamari" maxLength={300} className={inputCls} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">থানা</span>
              <input value={form.thana} onChange={set("thana")} maxLength={100} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">Thana (EN)</span>
              <input value={form.thana_en} onChange={set("thana_en")} maxLength={100} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">জেলা</span>
              <input value={form.district} onChange={set("district")} maxLength={100} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">District (EN)</span>
              <input value={form.district_en} onChange={set("district_en")} maxLength={100} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">বিভাগ</span>
              <input value={form.division} onChange={set("division")} maxLength={100} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">Division (EN)</span>
              <input value={form.division_en} onChange={set("division_en")} maxLength={100} className={inputCls} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">নতুন রোগী ফি (৳)</span>
              <input value={form.newPatientFee} onChange={set("newPatientFee")} inputMode="numeric" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">পুরনো রোগী ফি (৳)</span>
              <input value={form.oldPatientFee} onChange={set("oldPatientFee")} inputMode="numeric" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">Latitude</span>
              <input value={form.latitude} onChange={set("latitude")} inputMode="decimal" placeholder="25.93" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">Longitude</span>
              <input value={form.longitude} onChange={set("longitude")} inputMode="decimal" placeholder="88.85" className={inputCls} />
            </label>
          </div>
          <HospitalPicker
            value={hospitalId}
            initialFacets={initialFacets}
            onChange={(id) => setHospitalId(id)}
          />
          {chamber?.hospital?.name ? (
            <p className="text-xs text-slate-500">
              বর্তমান সংযুক্তি: <b className="text-slate-700">{chamber.hospital.name}</b>
            </p>
          ) : null}
          {error && <p className="text-sm font-bold text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "সেভ হচ্ছে…" : mode === "edit" ? "💾 আপডেট করুন" : "➕ চেম্বার যোগ করুন"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-6 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              বাতিল
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
