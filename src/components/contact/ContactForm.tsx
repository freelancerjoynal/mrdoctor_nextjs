"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const TOPICS = [
  { value: "GENERAL", label: "সাধারণ জিজ্ঞাসা" },
  { value: "BOOKING", label: "সিরিয়াল / বুকিং" },
  { value: "REFUND", label: "রিফান্ড" },
  { value: "SUPPORT", label: "সাপোর্ট" },
  { value: "DOCTOR_JOIN", label: "ডাক্তার হিসেবে যোগ দিতে চাই" },
  { value: "HOSPITAL_JOIN", label: "হাসপাতাল হিসেবে যোগ দিতে চাই" },
  { value: "FEEDBACK", label: "মতামত / পরামর্শ" },
];

/**
 * Public contact form — /contact page.
 * Saves user concerns + opinions to the `contact_messages` table
 * via POST /api/backend/api/website/contact (no account needed).
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("GENERAL");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setError("");
    setSuccess("");
    if (name.trim().length < 2) {
      setError("আপনার নাম দিন।");
      return;
    }
    if (phone.trim().length < 6) {
      setError("সঠিক মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)।");
      return;
    }
    if (message.trim().length < 10) {
      setError("আপনার মতামত একটু বিস্তারিত লিখুন (কমপক্ষে ১০ অক্ষর)।");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/backend/api/website/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          topic,
          subject: subject.trim() || undefined,
          message: message.trim(),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;
      if (!res.ok) throw new Error(data?.error || "বার্তা পাঠানো যায়নি। আবার চেষ্টা করুন।");
      setSuccess(data?.message || "আপনার বার্তা পেয়েছি! আমাদের টিম শীঘ্রই যোগাযোগ করবে।");
      setName("");
      setPhone("");
      setEmail("");
      setTopic("GENERAL");
      setSubject("");
      setMessage("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "বার্তা পাঠানো যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return (
      <motion.div
        className="rounded-2xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <p className="text-3xl">✅</p>
        <p className="mt-2 font-bold text-emerald-900">বার্তা পাঠানো হয়েছে!</p>
        <p className="mt-2 leading-relaxed text-emerald-800">{success}</p>
        <button
          onClick={() => setSuccess("")}
          className="mt-4 rounded-full border border-emerald-300 px-5 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
        >
          আরেকটি বার্তা লিখুন
        </button>
      </motion.div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";
  const labelCls = "mb-1 block text-sm font-bold text-slate-700";

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-7">
      <p className="text-lg font-bold text-slate-900">✉️ বার্তা পাঠান</p>
      <p className="mt-1 text-sm text-slate-500">
        আপনার সমস্যা, প্রশ্ন বা মতামত লিখুন — আমাদের টিম দেখে যোগাযোগ করবে।
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="contact-name">
            আপনার নাম *
          </label>
          <input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="যেমন: মো. করিম উদ্দিন"
            maxLength={80}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="contact-phone">
            মোবাইল নম্বর *
          </label>
          <input
            id="contact-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            inputMode="tel"
            maxLength={20}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="contact-email">
            ইমেইল (ঐচ্ছিক)
          </label>
          <input
            id="contact-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            inputMode="email"
            maxLength={120}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="contact-topic">
            বিষয় *
          </label>
          <select
            id="contact-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={inputCls}
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="contact-subject">
            শিরোনাম (ঐচ্ছিক)
          </label>
          <input
            id="contact-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="যেমন: গতকালের সিরিয়াল নিয়ে প্রশ্ন"
            maxLength={150}
            className={inputCls}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="contact-message">
            আপনার বার্তা *
          </label>
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="আপনার সমস্যা বা মতামত বিস্তারিত লিখুন…"
            rows={4}
            maxLength={2000}
            className={inputCls}
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={sending}
        className="mt-4 w-full rounded-full bg-emerald-700 px-6 py-3 font-bold text-white shadow hover:bg-emerald-800 disabled:opacity-60"
      >
        {sending ? "পাঠানো হচ্ছে…" : "📩 বার্তা পাঠান"}
      </button>
    </form>
  );
}
