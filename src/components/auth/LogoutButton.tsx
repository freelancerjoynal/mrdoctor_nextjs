"use client";

import { useState } from "react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // Full navigation (not router.push + router.refresh) so no
      // client-side render loop can spin after the session is gone.
      window.location.href = "/login";
    }
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-60 sm:px-4"
    >
      {loading ? "বের হচ্ছে…" : "লগআউট"}
    </button>
  );
}
