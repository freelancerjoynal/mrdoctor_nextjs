"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

interface ChamberOption {
  id: string;
  name: string;
  area: string;
  newFee: number;
  oldFee: number;
  hospital: { slug: string; name: string } | null;
}

interface DayOption {
  date: string;
  dayOfWeek: string;
  dayBn: string;
  label: string;
  /** Chamber owning this weekday (one weekday = one chamber). */
  chamberId: string | null;
}

interface OptionsResponse {
  doctor: { username: string; name: string; speciality: string };
  chambers: ChamberOption[];
  schedules: Array<{
    dayOfWeek: string;
    dayBn: string;
    chamberId: string | null;
    startTime: string;
    endTime: string;
  }>;
  days: DayOption[];
}

/**
 * Shared online-appointment form — used by the doctor portal serial section
 * AND inside the hospital-portal doctor popup (no redirect either way).
 * Submits to the public website API and saves a PENDING row; on success it
 * shows the "আপনার অনুরোধটি পেয়েছি" confirmation.
 */
export function AppointmentForm({
  doctorUsername,
  hospitalSlug,
  accent = "emerald",
  compact = false,
}: {
  doctorUsername: string;
  hospitalSlug?: string;
  accent?: "emerald" | "blue";
  compact?: boolean;
}) {
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Date-first booking: the patient picks today or the next available date,
  // the chamber follows automatically — no chamber dropdown.
  const [date, setDate] = useState("");
  const [patientName, setPatientName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [problem, setProblem] = useState("");
  const [patientType, setPatientType] = useState<"NEW" | "RENEW">("NEW");
  const [patientAge, setPatientAge] = useState("");
  const [patientWeight, setPatientWeight] = useState("");
  const [patientArea, setPatientArea] = useState("");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // NOTE: callers remount per doctor (key={doctorUsername}) so the
  // initial loading state covers each fetch — no reset needed here.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/backend/api/website/doctors/${encodeURIComponent(doctorUsername)}/appointment-options`)
      .then(async (res) => {
        if (!res.ok) throw new Error("load");
        const json = (await res.json()) as { data: OptionsResponse };
        if (cancelled) return;
        setOptions(json.data);
        if (json.data.days.length > 0 && json.data.days[0]) setDate(json.data.days[0].date);
      })
      .catch(() => {
        if (!cancelled) setLoadError("ফর্ম লোড করা যায়নি। আবার চেষ্টা করুন।");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctorUsername, hospitalSlug]);

  // Hospital-portal scoping (client mirror of the server rule).
  const chambers = useMemo(() => {
    if (!options) return [];
    const scoped = hospitalSlug
      ? options.chambers.filter(
          (c) => c.hospital?.slug.toLowerCase() === hospitalSlug.toLowerCase(),
        )
      : options.chambers;
    return scoped.length > 0 ? scoped : options.chambers;
  }, [options, hospitalSlug]);

  // Date-first booking: today + the very next running days (server: max 2
  // within 30 days). In a hospital portal, days owned by other hospitals'
  // chambers are hidden.
  const visibleDays = useMemo(() => {
    if (!options) return [];
    return options.days.filter(
      (d) => !d.chamberId || chambers.some((c) => c.id === d.chamberId),
    );
  }, [options, chambers]);

  // The chamber follows the chosen date (one weekday = one chamber) —
  // displayed read-only, never a dropdown.
  const autoChamber = useMemo(() => {
    const day = visibleDays.find((d) => d.date === date) ?? visibleDays[0] ?? null;
    if (!day) return null;
    if (day.chamberId) return chambers.find((c) => c.id === day.chamberId) ?? null;
    return chambers[0] ?? null;
  }, [visibleDays, date, chambers]);

  // Timing of the auto chamber on the chosen date's weekday.
  const autoTiming = useMemo(() => {
    if (!options || !autoChamber || !date) return null;
    const day = visibleDays.find((d) => d.date === date);
    if (!day) return null;
    const match = options.schedules.find(
      (s) =>
        String(s.dayOfWeek).toUpperCase() === String(day.dayOfWeek).toUpperCase() &&
        (!s.chamberId || s.chamberId.toLowerCase() === autoChamber.id.toLowerCase()),
    );
    return match ? `${match.startTime}–${match.endTime}` : null;
  }, [options, autoChamber, date, visibleDays]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setError("");
    setSuccess("");
    if (patientName.trim().length < 3) {
      setError("রোগীর নাম দিন (কমপক্ষে ৩ অক্ষর)।");
      return;
    }
    if (contactPhone.trim().length < 6) {
      setError("সঠিক মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)।");
      return;
    }
    if (problem.trim().length < 3) {
      setError("সমস্যাটি একটু বিস্তারিত লিখুন (কমপক্ষে ৩ অক্ষর)।");
      return;
    }
    if (visibleDays.length === 0) {
      setError("আগামী ৩০ দিনে কোনো সিডিউল নেই।");
      return;
    }
    if (!date) {
      setError("সাক্ষাতের তারিখ বেছে নিন।");
      return;
    }
    if (!autoChamber) {
      setError("এই তারিখে কোনো চেম্বার পাওয়া যায়নি।");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/backend/api/website/appointments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          doctorUsername,
          hospitalSlug: hospitalSlug || undefined,
          chamberId: autoChamber.id,
          appointmentDate: date,
          patientName: patientName.trim(),
          patientType,
          contactPhone: contactPhone.trim(),
          problem: problem.trim(),
          patientAge: patientAge.trim() || undefined,
          patientWeight: patientWeight.trim() || undefined,
          patientArea: patientArea.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        data?: { message?: string };
        message?: string;
        error?: string;
      } | null;
      if (!res.ok) throw new Error(data?.error || "অনুরোধ জমা দেওয়া যায়নি। আবার চেষ্টা করুন।");
      setSuccess(data?.data?.message || data?.message || "আপনার অনুরোধটি পেয়েছি। আমরা শীঘ্রই আপনাকে কল করব। 📞");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "অনুরোধ জমা দেওয়া যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setSending(false);
    }
  };

  const isBlue = accent === "blue";
  const primaryBtn = isBlue
    ? "bg-blue-700 hover:bg-blue-800"
    : "bg-emerald-700 hover:bg-emerald-800";
  const focusRing = isBlue ? "focus:border-blue-500" : "focus:border-emerald-500";
  const inputCls = `w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none ${focusRing}`;
  const labelCls = "mb-1 block text-sm font-bold text-slate-700";

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-slate-100">
        <p className="text-slate-500">ফর্ম লোড হচ্ছে…</p>
      </div>
    );
  }

  if (loadError || !options) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-slate-100">
        <p className="font-semibold text-red-600">{loadError || "ফর্ম লোড করা যায়নি।"}</p>
      </div>
    );
  }

  if (success) {
    return (
      <motion.div
        className="rounded-2xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      >
        <motion.p
          className="text-3xl"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
        >
          ✅
        </motion.p>
        <p className="mt-2 font-bold text-emerald-900">অনুরোধ পাঠানো হয়েছে!</p>
        <p className="mt-2 leading-relaxed text-emerald-800">{success}</p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={`rounded-2xl bg-white ${compact ? "p-5" : "p-6 md:p-7"} shadow-sm ring-1 ring-slate-200`}
    >
      <p className="text-lg font-bold text-slate-900">অনলাইনে সিরিয়াল নিন</p>
      <p className="mt-1 text-sm text-slate-500">
        {options.doctor.name} · {options.doctor.speciality}
      </p>

      <div className={`mt-4 grid gap-3 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        <div className={compact ? "" : "sm:col-span-2"}>
          <label className={labelCls} htmlFor={`apt-name-${doctorUsername}`}>
            রোগীর নাম *
          </label>
          <input
            id={`apt-name-${doctorUsername}`}
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="যেমন: মো. করিম উদ্দিন"
            maxLength={80}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor={`apt-phone-${doctorUsername}`}>
            মোবাইল নম্বর *
          </label>
          <input
            id={`apt-phone-${doctorUsername}`}
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            inputMode="tel"
            maxLength={20}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor={`apt-date-${doctorUsername}`}>
            সাক্ষাতের তারিখ *
          </label>
          {visibleDays.length > 0 ? (
            <select
              id={`apt-date-${doctorUsername}`}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            >
              {visibleDays.map((d) => (
                <option key={d.date} value={d.date}>
                  {d.label}
                </option>
              ))}
            </select>
          ) : (
            <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
              আগামী ৩০ দিনে কোনো সিডিউল নেই।
            </p>
          )}
        </div>

        <div className={compact ? "" : "sm:col-span-2"}>
          <span className={labelCls}>চেম্বার (তারিখ অনুযায়ী স্বয়ংক্রিয়)</span>
          {autoChamber ? (
            <p className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
              🏥 {autoChamber.name}
              {autoChamber.area ? ` — ${autoChamber.area}` : ""}
              {autoTiming ? ` · 🕒 ${autoTiming}` : ""}
            </p>
          ) : (
            <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
              এই তারিখে কোনো চেম্বার পাওয়া যায়নি।
            </p>
          )}
        </div>

        <div className={compact ? "" : "sm:col-span-2"}>
          <span className={labelCls} id={`apt-type-label-${doctorUsername}`}>
            রোগীর ধরন *
          </span>
          <div
            role="radiogroup"
            aria-labelledby={`apt-type-label-${doctorUsername}`}
            className="grid grid-cols-2 gap-2"
          >
            {(
              [
                { value: "NEW", label: "নতুন রোগী", fee: autoChamber?.newFee },
                { value: "RENEW", label: "পুরনো রোগী", fee: autoChamber?.oldFee },
              ] as const
            ).map((opt) => {
              const active = patientType === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setPatientType(opt.value)}
                  className={`rounded-xl border-2 px-3 py-2.5 text-center transition ${
                    active
                      ? isBlue
                        ? "border-blue-600 bg-blue-50 text-blue-900"
                        : "border-emerald-600 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="block text-sm font-bold">{opt.label}</span>
                  {opt.fee != null && opt.fee > 0 && (
                    <span className="mt-0.5 block text-xs font-semibold opacity-80">
                      ৳{opt.fee}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className={compact ? "" : "sm:col-span-2"}>
          <label className={labelCls} htmlFor={`apt-problem-${doctorUsername}`}>
            সমস্যা *
          </label>
          <textarea
            id={`apt-problem-${doctorUsername}`}
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="যেমন: ৩ দিন ধরে জ্বর ও কাশি"
            rows={compact ? 2 : 3}
            maxLength={1000}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor={`apt-age-${doctorUsername}`}>
            বয়স
          </label>
          <input
            id={`apt-age-${doctorUsername}`}
            value={patientAge}
            onChange={(e) => setPatientAge(e.target.value)}
            placeholder="যেমন: ৩৫"
            inputMode="numeric"
            maxLength={3}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor={`apt-weight-${doctorUsername}`}>
            ওজন (কেজি)
          </label>
          <input
            id={`apt-weight-${doctorUsername}`}
            value={patientWeight}
            onChange={(e) => setPatientWeight(e.target.value)}
            placeholder="যেমন: ৬৫"
            inputMode="decimal"
            maxLength={6}
            className={inputCls}
          />
        </div>

        <div className={compact ? "" : "sm:col-span-2"}>
          <label className={labelCls} htmlFor={`apt-area-${doctorUsername}`}>
            এলাকা
          </label>
          <input
            id={`apt-area-${doctorUsername}`}
            value={patientArea}
            onChange={(e) => setPatientArea(e.target.value)}
            placeholder="যেমন: সৈয়দপুর"
            maxLength={120}
            className={inputCls}
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={sending}
        className={`mt-4 w-full rounded-full px-6 py-3 font-bold text-white shadow disabled:opacity-60 ${primaryBtn}`}
      >
        {sending ? "পাঠানো হচ্ছে…" : "📝 অনুরোধ পাঠান"}
      </button>
      <p className="mt-2 text-center text-xs text-slate-400">
        জমা দিলেই অনুরোধটি ডাক্তারের পেন্ডিং তালিকায় যাবে।
      </p>
    </form>
  );
}
