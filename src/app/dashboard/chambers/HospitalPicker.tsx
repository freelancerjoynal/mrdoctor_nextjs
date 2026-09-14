"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";
import type { HospitalFacets, HospitalOption } from "./types";

interface OptionsResponse {
  data?: HospitalOption[];
  facets?: HospitalFacets;
}

async function fetchOptions(params: Record<string, string>): Promise<OptionsResponse> {
  const q = new URLSearchParams(params).toString();
  const res = await apiFetch(`/api/backend/api/users/chambers/hospitals/options?${q}`);
  const data = (await res.json().catch(() => null)) as {
    data?: HospitalOption[];
    facets?: HospitalFacets;
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "হাসপাতাল লোড করা যায়নি।");
  return { data: data?.data ?? [], facets: data?.facets };
}

/** Hospital dropdown: division > district > thana cascade + search over name + name_en. */
export function HospitalPicker({
  value,
  initialFacets,
  onChange,
}: {
  value: string;
  initialFacets: HospitalFacets;
  onChange: (hospitalId: string, hospital: HospitalOption | null) => void;
}) {
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<HospitalOption[]>([]);
  const [facets, setFacets] = useState<HospitalFacets>(initialFacets);
  const [loading, setLoading] = useState(false);

  // Debounced server search (matches name + name_en) + cascade filters.
  useEffect(() => {
    const t = setTimeout(() => {
      let cancelled = false;
      setLoading(true);
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (division) params.division = division;
      if (district) params.district = district;
      if (thana) params.thana = thana;
      fetchOptions(params)
        .then((r) => {
          if (cancelled) return;
          setOptions(r.data ?? []);
          if (r.facets) setFacets(r.facets);
        })
        .catch(() => {
          if (!cancelled) setOptions([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return;
    }, 300);
    return () => clearTimeout(t);
  }, [search, division, district, thana]);

  const selected = options.find((o) => o.id === value) ?? null;

  const selectCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none";

  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <p className="text-sm font-black text-slate-700">🏥 হাসপাতাল সংযুক্তি (ঐচ্ছিক)</p>
      {selected ? (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-emerald-200">
          <p className="min-w-0 truncate text-sm font-bold text-emerald-800">
            ✓ {selected.name}
            {selected.name_en?.trim() ? ` · ${selected.name_en}` : ""}
          </p>
          <button
            type="button"
            onClick={() => onChange("", null)}
            className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
          >
            সরান
          </button>
        </div>
      ) : (
        <>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">বিভাগ</span>
              <select
                value={division}
                onChange={(e) => {
                  setDivision(e.target.value);
                  setDistrict("");
                  setThana("");
                }}
                className={selectCls}
              >
                <option value="">সব বিভাগ</option>
                {facets.divisions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">জেলা</span>
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setThana("");
                }}
                className={selectCls}
              >
                <option value="">সব জেলা</option>
                {facets.districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">থানা</span>
              <select value={thana} onChange={(e) => setThana(e.target.value)} className={selectCls}>
                <option value="">সব থানা</option>
                {facets.thanas.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 হাসপাতাল খুঁজুন (বাংলা বা English নামে)…"
            maxLength={80}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
          />
          <div className="mt-2 max-h-44 overflow-y-auto rounded-xl bg-white ring-1 ring-slate-100">
            {loading ? (
              <p className="p-3 text-center text-xs text-slate-400">খুঁজছে…</p>
            ) : options.length === 0 ? (
              <p className="p-3 text-center text-xs text-slate-400">কোনো হাসপাতাল পাওয়া যায়নি।</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {options.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => onChange(o.id, o)}
                      className="block w-full px-3 py-2 text-left hover:bg-emerald-50"
                    >
                      <p className="truncate text-sm font-bold text-slate-800">{o.name}</p>
                      <p className="truncate text-xs text-slate-400">
                        {o.name_en?.trim() ? `${o.name_en} · ` : ""}
                        {[o.thana, o.district].filter((x) => x?.trim()).join(", ")}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
