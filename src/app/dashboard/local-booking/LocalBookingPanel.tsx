"use client";

import { useEffect, useState } from "react";
import { toBn } from "@/lib/bn";
import { apiFetch } from "@/lib/auth/apiFetch";

interface BookingResult {
  patientName: string;
  contactPhone: string;
  patientType: string;
  collectionAmount: number;
  appointmentDate: string;
  dayLabel?: string | null;
}

interface ChamberOption {
  id: string;
  name: string;
  area: string;
}

interface DoctorOption {
  id: string;
  name: string;
  speciality?: string | null;
  degree?: string | null;
  availableToday: boolean;
}

interface DayOption {
  date: string;
  dayOfWeek: string;
  label: string;
}

interface LocalOptions {
  chambers: ChamberOption[];
  /** Hospital desk: doctors of this hospital (availableToday flags today). */
  doctors?: DoctorOption[] | null;
  /** Today only — walk-in bookings are locked to the current day. */
  today: DayOption | null;
  /** Chamber owning today via its schedule (one weekday = one chamber). */
  autoChamberId: string | null;
  todayClosed: boolean;
}

/** Staff walk-in booking: OFFLINE ConfirmedAppointment + SMS receipt to patient. */
export function LocalBookingPanel({ onSuccess }: { onSuccess?: () => void }) {
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [patientType, setPatientType] = useState<"NEW" | "RENEW">("NEW");
  const [amount, setAmount] = useState("");
  const [age, setAge] = useState("");
  const [area, setArea] = useState("");

  const [options, setOptions] = useState<LocalOptions | null>(null);
  const [optionsError, setOptionsError] = useState("");
  const [chamberId, setChamberId] = useState("");
  const [doctorId, setDoctorId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [smsSent, setSmsSent] = useState<boolean | null>(null);
  const [lastBooking, setLastBooking] = useState<BookingResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/backend/api/users/appointments/local-options")
      .then(async (res) => {
        if (!res.ok) throw new Error("load");
        const json = (await res.json()) as { data: LocalOptions };
        if (cancelled) return;
        setOptions(json.data);
        // Hospital desk: preselect the first today-available doctor.
        const docs = Array.isArray(json.data.doctors) ? json.data.doctors : [];
        if (docs.length > 0) {
          const first = docs.find((d) => d.availableToday) ?? docs[0];
          if (first) setDoctorId(first.id);
        }
        // Chamber is auto-selected from today's availability (one weekday =
        // one chamber). Falls back to the single chamber when no roster exists.
        if (json.data.autoChamberId) {
          setChamberId(json.data.autoChamberId);
        } else if (json.data.chambers.length === 1 && json.data.chambers[0]) {
          setChamberId(json.data.chambers[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setOptionsError("বুকিং অপশন লোড করা যায়নি। আবার চেষ্টা করুন।");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isHospitalDesk = Array.isArray(options?.doctors);
  const doctors = isHospitalDesk ? (options?.doctors ?? []) : [];
  const availableDoctors = doctors.filter((d) => d.availableToday);
  const selectedDoctor = doctors.find((d) => d.id === doctorId) ?? null;

  // Locked chamber = today's running chamber (auto). Manual pick only when no
  // schedule owns today (e.g. no roster defined yet).
  const lockedChamber = options?.autoChamberId
    ? (options.chambers.find((c) => c.id === options.autoChamberId) ?? null)
    : null;
  const todayClosed = options?.todayClosed ?? false;
  const today = options?.today ?? null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError("");
    setNotice("");
    setSmsSent(null);
    setLastBooking(null);

    if (patientName.trim().replace(/\s+/g, " ").length < 2) {
      setError("রোগীর নাম দিন (কমপক্ষে ২ অক্ষর)।");
      return;
    }
    if (phone.trim().length < 6) {
      setError("সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)।");
      return;
    }
    const taka = Number(amount);
    if (amount.trim() === "" || !Number.isFinite(taka) || taka < 0) {
      setError("সঠিক আদায়ের টাকা দিন।");
      return;
    }
    if (todayClosed || !today) {
      setError("আজ চেম্বার বন্ধ আছে।");
      return;
    }
    // Hospital desk: a today-available doctor is required.
    if (isHospitalDesk) {
      if (!doctorId) {
        setError("ডাক্তার বেছে নিন।");
        return;
      }
      if (selectedDoctor && !selectedDoctor.availableToday) {
        setError("এই ডাক্তার আজ উপস্থিত নেই — আজকের ডাক্তার বেছে নিন।");
        return;
      }
    }
    if (!isHospitalDesk && options && options.chambers.length > 1 && !lockedChamber && !chamberId) {
      setError("চেম্বার বেছে নিন।");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/backend/api/users/appointments/local", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          patientName: patientName.trim(),
          phone: phone.trim(),
          patientType,
          collectionAmount: taka,
          date: today.date,
          // Hospital desk: doctor drives everything (chamber auto-resolves to
          // today's hospital chamber) — never send a stale chamber id.
          ...(isHospitalDesk
            ? { doctorId }
            : { chamberId: lockedChamber ? lockedChamber.id : chamberId || undefined }),
          age: age.trim() === "" ? undefined : Number(age),
          area: area.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        data?: BookingResult;
        smsSent?: boolean;
        message?: string;
        error?: string;
      } | null;
      if (!res.ok) throw new Error(data?.error || "বুকিং ব্যর্থ হয়েছে।");
      setNotice(data?.message || "বুকিং সম্পন্ন!");
      setSmsSent(data?.smsSent ?? false);
      setLastBooking(data?.data ?? null);
      setPatientName("");
      setPhone("");
      setAmount("");
      setAge("");
      setArea("");
      onSuccess?.();    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "বুকিং ব্যর্থ হয়েছে।");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <p className="text-lg font-black text-slate-900">➕ লোকাল বুকিং (অফলাইন)</p>
        <p className="mt-1 text-sm text-slate-500">
          সরাসরি আসা রোগীর বুকিং করুন — সেভ হলেই রোগীর ফোনে SMS যাবে।
        </p>
        {optionsError && (
          <p className="mt-3 text-sm font-bold text-red-600">{optionsError}</p>
        )}
        <form onSubmit={submit} className="mt-4 space-y-3">
          {isHospitalDesk && (
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">ডাক্তার * (আজ উপস্থিত)</span>
              {doctors.length === 0 ? (
                <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
                  এই হাসপাতালে এখনো কোনো ডাক্তার যুক্ত হয়নি।
                </p>
              ) : availableDoctors.length === 0 ? (
                <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
                  আজ কোনো ডাক্তার উপস্থিত নেই।
                </p>
              ) : (
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— ডাক্তার বেছে নিন —</option>
                  {availableDoctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {d.speciality ? ` — ${d.speciality}` : ""}
                    </option>
                  ))}
                  {doctors
                    .filter((d) => !d.availableToday)
                    .map((d) => (
                      <option key={d.id} value={d.id} disabled>
                        {d.name}
                        {d.speciality ? ` — ${d.speciality}` : ""} (আজ বন্ধ)
                      </option>
                    ))}
                </select>
              )}
            </label>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">রোগীর নাম *</span>
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="যেমন: রহিম উদ্দিন"
                maxLength={80}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">মোবাইল নম্বর *</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                inputMode="tel"
                maxLength={15}
                className={inputCls}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className="mb-1 block text-sm font-bold text-slate-600">রোগীর ধরন *</span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "NEW", label: "🆕 নতুন" },
                    { value: "RENEW", label: "🔁 পুরনো" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setPatientType(o.value)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-black ring-1 transition ${
                      patientType === o.value
                        ? "bg-emerald-600 text-white ring-emerald-600"
                        : "bg-white text-slate-600 ring-slate-200 hover:ring-emerald-300"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">আদায়ের টাকা (৳) *</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="যেমন: 500"
                inputMode="decimal"
                className={inputCls}
              />
            </label>
          </div>

          {isHospitalDesk ? (
            selectedDoctor && (
              <div className="rounded-xl bg-indigo-50 px-4 py-2.5 ring-1 ring-indigo-200">
                <p className="text-xs font-bold text-indigo-600">আজকের চেম্বার (স্বয়ংক্রিয়)</p>
                <p className="text-sm font-black text-indigo-900">
                  {selectedDoctor.name} — হাসপাতালের আজকের চেম্বারে বুকিং হবে
                </p>
              </div>
            )
          ) : lockedChamber ? (
            <div className="rounded-xl bg-emerald-50 px-4 py-2.5 ring-1 ring-emerald-200">
              <p className="text-xs font-bold text-emerald-600">আজকের চেম্বার (স্বয়ংক্রিয়)</p>
              <p className="text-sm font-black text-emerald-900">
                {lockedChamber.name}
                {lockedChamber.area ? ` — ${lockedChamber.area}` : ""}
              </p>
            </div>
          ) : (
            options &&
            options.chambers.length > 1 && (
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-slate-600">চেম্বার *</span>
                <select
                  value={chamberId}
                  onChange={(e) => setChamberId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— বেছে নিন —</option>
                  {options.chambers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.area ? ` — ${c.area}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            )
          )}

          <div>
            <span className="mb-1 block text-sm font-bold text-slate-600">তারিখ (শুধু আজ)</span>
            {today ? (
              <p className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-black text-slate-700">
                📅 {today.label}
              </p>
            ) : (
              <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
                {options ? "আজ চেম্বার বন্ধ আছে।" : "তারিখ লোড হচ্ছে…"}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">বয়স (ঐচ্ছিক)</span>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="যেমন: ৩৫"
                inputMode="numeric"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">এলাকা (ঐচ্ছিক)</span>
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="যেমন: মিরপুর"
                maxLength={120}
                className={inputCls}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-emerald-600 px-6 py-3 font-black text-white hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
          >
            {saving ? "সেভ হচ্ছে…" : "💾 বুকিং সেভ করুন + SMS পাঠান"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
        {notice && <p className="mt-3 text-sm font-bold text-emerald-700">{notice}</p>}
        {smsSent !== null && (
          <p
            className={`mt-2 rounded-xl p-3 text-sm font-bold ring-1 ${
              smsSent
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-amber-50 text-amber-800 ring-amber-200"
            }`}
          >
            {smsSent ? "📩 রোগীর ফোনে SMS পাঠানো হয়েছে।" : "⚠️ বুকিং সেভ হয়েছে, কিন্তু SMS পাঠানো যায়নি।"}
          </p>
        )}
      </section>

      {lastBooking && (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-400">শেষ বুকিং</p>
          <p className="mt-1 text-lg font-black text-slate-900">{lastBooking.patientName}</p>
          <p className="mt-1 text-sm text-slate-500">
            📞 {lastBooking.contactPhone} · {lastBooking.patientType === "RENEW" ? "পুরনো" : "নতুন"} ·{" "}
            ৳{toBn(lastBooking.collectionAmount)}
            {lastBooking.dayLabel ? ` · ${lastBooking.dayLabel}` : ""}
          </p>
        </section>
      )}
    </div>
  );
}
