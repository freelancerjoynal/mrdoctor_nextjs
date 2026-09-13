"use client";

import { useEffect, useMemo, useState } from "react";
import { toBn } from "@/lib/bn";

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

interface ScheduleOption {
  dayOfWeek: string;
  chamberId: string | null;
}

interface DayOption {
  date: string;
  dayOfWeek: string;
  label: string;
}

interface LocalOptions {
  chambers: ChamberOption[];
  schedules: ScheduleOption[];
  days: DayOption[];
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
  const [date, setDate] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [smsSent, setSmsSent] = useState<boolean | null>(null);
  const [lastBooking, setLastBooking] = useState<BookingResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/backend/api/users/appointments/local-options")
      .then(async (res) => {
        if (!res.ok) throw new Error("load");
        const json = (await res.json()) as { data: LocalOptions };
        if (cancelled) return;
        setOptions(json.data);
        if (json.data.chambers.length === 1 && json.data.chambers[0]) {
          setChamberId(json.data.chambers[0].id);
        }
        if (json.data.days.length > 0 && json.data.days[0]) {
          setDate(json.data.days[0].date);
        }
      })
      .catch(() => {
        if (!cancelled) setOptionsError("বুকিং অপশন লোড করা যায়নি। আবার চেষ্টা করুন।");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Date options follow the chosen chamber: today + tomorrow max, only days
  // this chamber runs (chamber-bound schedules win, else the doctor's roster).
  const visibleDays = useMemo(() => {
    if (!options) return [];
    const own = chamberId
      ? options.schedules.filter(
          (s) => (s.chamberId || "").toLowerCase() === chamberId.toLowerCase(),
        )
      : [];
    const relevant = own.length > 0 ? own : options.schedules;
    if (relevant.length === 0) return options.days.slice(0, 2);
    const running = new Set(relevant.map((s) => String(s.dayOfWeek).toUpperCase()));
    return options.days
      .filter((d) => running.has(String(d.dayOfWeek).toUpperCase()))
      .slice(0, 2);
  }, [options, chamberId]);

  // Keep the picked date inside the visible (chamber-aware) options.
  useEffect(() => {
    if (!options) return;
    if (visibleDays.length === 0) {
      setDate("");
      return;
    }
    if (!visibleDays.some((d) => d.date === date)) {
      const first = visibleDays[0];
      if (first) setDate(first.date);
    }
  }, [options, visibleDays, date]);

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
    if (options && options.chambers.length > 1 && !chamberId) {
      setError("চেম্বার বেছে নিন।");
      return;
    }
    if (visibleDays.length === 0) {
      setError("এই চেম্বার আজ ও আগামীকাল বন্ধ আছে।");
      return;
    }
    if (!date) {
      setError("তারিখ বেছে নিন (আজ / আগামীকাল)।");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/backend/api/users/appointments/local", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          patientName: patientName.trim(),
          phone: phone.trim(),
          patientType,
          collectionAmount: taka,
          date,
          chamberId: chamberId || undefined,
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

          {options && options.chambers.length > 1 && (
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
          )}

          <div>
            <span className="mb-1 block text-sm font-bold text-slate-600">তারিখ *</span>
            {visibleDays.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {visibleDays.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setDate(d.date)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-black ring-1 transition ${
                      date === d.date
                        ? "bg-emerald-600 text-white ring-emerald-600"
                        : "bg-white text-slate-600 ring-slate-200 hover:ring-emerald-300"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
                {options
                  ? "এই চেম্বার আজ ও আগামীকাল বন্ধ আছে।"
                  : "তারিখ লোড হচ্ছে…"}
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
