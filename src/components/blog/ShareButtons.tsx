"use client";

import { useState } from "react";

/**
 * Share-link builders — each URL opens the target app/site directly
 * with the post title + URL prefilled. Update in one place to change
 * share behaviour across every blog surface.
 */
export function buildShareLinks(url: string, title: string) {
  const encUrl = encodeURIComponent(url);
  return {
    // Opens WhatsApp (app or web) with text prefilled.
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    // Opens the Messenger app directly via its registered scheme.
    messenger: `fb-messenger://share/?link=${encUrl}`,
    // Opens the Facebook share dialog.
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
    // Opens the visitor's mail client with subject + body prefilled.
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n${url}`)}`,
  };
}

const BUTTONS = [
  { key: "whatsapp", label: "হোয়াটসঅ্যাপ", symbol: "💬", pill: "bg-[#25D366] hover:bg-[#1eb85a] text-white" },
  { key: "messenger", label: "মেসেঞ্জার", symbol: "✦", pill: "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white" },
  { key: "facebook", label: "ফেসবুক", symbol: "f", pill: "bg-[#1877F2] hover:bg-[#1466d6] text-white" },
  { key: "email", label: "ইমেইল", symbol: "✉", pill: "bg-slate-600 hover:bg-slate-700 text-white" },
] as const;

/**
 * Row of share buttons for a blog post. Modular — drop it anywhere
 * a post URL + title is available (modal, detail page, cards).
 */
export function ShareButtons({
  url,
  title,
  compact = false,
}: {
  url: string;
  title: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const links = buildShareLinks(url, title);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API unavailable (http / old browser) — select via fallback.
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-semibold text-slate-500">শেয়ার করুন:</span>
      {BUTTONS.map((b) => (
        <a
          key={b.key}
          href={links[b.key]}
          target={b.key === "email" ? undefined : "_blank"}
          rel="noreferrer"
          aria-label={`${b.label}-এ শেয়ার করুন`}
          title={`${b.label}-এ শেয়ার করুন`}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 ${b.pill} ${compact ? "px-3 py-1.5 text-[13px]" : ""}`}
        >
          <span aria-hidden>{b.symbol}</span>
          {!compact && b.label}
        </a>
      ))}
      <button
        onClick={copyLink}
        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 ${copied ? "bg-emerald-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
      >
        <span aria-hidden>{copied ? "✓" : "🔗"}</span>
        {copied ? "কপি হয়েছে!" : "লিংক কপি"}
      </button>
    </div>
  );
}
