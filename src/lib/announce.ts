"use client";

/**
 * Frontend-only live serial announcer — ZERO load on YOUR server.
 *
 * Hybrid sweet-voice engine (no npm dep, no API key, free):
 *  - `sweet` (default): client's browser fetches MP3 directly from Google's
 *    free Bengali TTS (`translate.googleapis.com`, tw-ob client) and plays it
 *    with <audio>. Sweet natural female Bengali voice, identical on
 *    Windows / Android / iPhone. Your server sees ZERO requests.
 *    (Plain <audio> playback needs no CORS — only Web-Audio reading would.)
 *  - `native`: browser's built-in speechSynthesis. Robotic, and Windows
 *    often has no Bengali voice — used as offline fallback only.
 *  - `auto`: platform-smart. On Android Chrome with a local Bengali voice
 *    (the built-in "Google বাংলা" lady), that plays first — zero network,
 *    guaranteed female. Everywhere else same as `sweet`, each falling back
 *    to the other engine on failure. Prefer this for the TV board.
 *
 * Payload:
 *   announceLive({ current: { serial, patientName }, next: { serial, patientName } })
 */

export interface AnnouncePatient {
  serial: number;
  patientName: string;
}

export interface AnnouncePayload {
  /** Patient just called inside the room */
  current: AnnouncePatient | null;
  /** Next person asked to stay ready */
  next: AnnouncePatient | null;
}

export type AnnounceEngine = "sweet" | "native" | "auto";

export interface AnnounceOptions {
  engine?: AnnounceEngine; // default "sweet"
  lang?: string; // default "bn-BD" (native) / "bn" (sweet)
  rate?: number; // native only, default 0.92
  pitch?: number; // native only, default 1
  volume?: number; // default 1
  /** Delay before the "next person get ready" call. Default 45_000 (45s). */
  nextDelayMs?: number;
}

export const DEFAULT_NEXT_DELAY_MS = 45_000;

const DEFAULT_LANG = "bn-BD";
const SWEET_TL = "bn";
const SWEET_MAX_CHARS = 180;
// googleapis.com (not google.com): sends CORS headers, doesn't 403 from
// Chrome, and serves the same sweet Bengali lady voice on Windows + Android.
const SWEET_BASE = "https://translate.googleapis.com/translate_tts";

let sweetAudio: HTMLAudioElement | null = null;
let sweetToken = 0; // bump to cancel a running sweet queue
const sweetBlobCache = new Map<string, string>(); // text -> blob object URL

/* ---------- Bengali number words (so TTS speaks serials naturally) ---------- */

const BN_0_99: string[] = [
  "শূন্য", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়", "দশ",
  "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "ঊনিশ", "বিশ",
  "একুশ", "বাইশ", "তেইশ", "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আঠাশ", "ঊনত্রিশ", "ত্রিশ",
  "একত্রিশ", "বত্রিশ", "তেত্রিশ", "চৌত্রিশ", "পঁয়ত্রিশ", "ছত্রিশ", "সাঁইত্রিশ", "আটত্রিশ", "ঊনচল্লিশ", "চল্লিশ",
  "একচল্লিশ", "বিয়াল্লিশ", "তেতাল্লিশ", "চুয়াল্লিশ", "পঁয়তাল্লিশ", "ছেচল্লিশ", "সাতচল্লিশ", "আটচল্লিশ", "ঊনপঞ্চাশ", "পঞ্চাশ",
  "একান্ন", "বাহান্ন", "তিপ্পান্ন", "চুয়ান্ন", "পঞ্চান্ন", "ছাপ্পান্ন", "সাতান্ন", "আটান্ন", "ঊনষাট", "ষাট",
  "একষট্টি", "বাষট্টি", "তেষট্টি", "চৌষট্টি", "পঁয়ষট্টি", "ছেষট্টি", "সাতষট্টি", "আটষট্টি", "ঊনসত্তর", "সত্তর",
  "একাত্তর", "বাহাত্তর", "তিয়াত্তর", "চুয়াত্তর", "পঁচাত্তর", "ছিয়াত্তর", "সাতাত্তর", "আটাত্তর", "ঊনআশি", "আশি",
  "একাশি", "বিরাশি", "তিরাশি", "চুরাশি", "পঁচাশি", "ছিয়াশি", "সাতাশি", "আটাশি", "ঊননব্বই", "নব্বই",
  "একানব্বই", "বিরানব্বই", "তিরানব্বই", "চুরানব্বই", "পঁচানব্বই", "ছিয়ানব্বই", "সাতানব্বই", "আটানব্বই", "নিরানব্বই",
];

export function serialToBnWords(n: number): string {
  if (!Number.isFinite(n)) return "";
  n = Math.floor(Math.abs(n));
  if (n <= 99) return BN_0_99[n];
  if (n <= 999) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const hWord = h === 1 ? "একশো" : `${BN_0_99[h]}শো`;
    return rest === 0 ? hWord : `${hWord} ${BN_0_99[rest]}`;
  }
  return String(n).split("").map((d) => BN_0_99[Number(d)]).join(" ");
}

/** "Please come inside" part only — warm + polished, with documents reminder. */
export function buildCurrentAnnouncement(current: AnnouncePatient): string {
  return (
    `সিরিয়াল নম্বর ${serialToBnWords(current.serial)}, ${current.patientName}, ` +
    `দয়া করে আপনি ভিতরে আসুন। আসার সময় আপনার পুরনো প্রেসক্রিপশন, কাগজপত্র ও রিপোর্ট যদি থাকে, ` +
    `অনুগ্রহ করে সাথে করে নিয়ে আসবেন।`
  );
}

/** "Next person get ready" part only — with documents reminder. */
export function buildNextAnnouncement(next: AnnouncePatient): string {
  return (
    `সিরিয়াল নম্বর ${serialToBnWords(next.serial)}, ${next.patientName}, ` +
    `দয়া করে আপনি প্রস্তুত থাকুন। আপনার দরকারী কাগজপত্র ও রিপোর্ট যদি থাকে, ` +
    `প্রস্তুত করে রাখুন।`
  );
}

/** Build the Bengali sentence from a payload (exported for preview/testing). */
export function buildAnnouncement(p: AnnouncePayload): string {
  const { current, next } = p;
  if (current && next) {
    return `${buildCurrentAnnouncement(current)} ${buildNextAnnouncement(next)}`;
  }
  if (current) return buildCurrentAnnouncement(current);
  if (next) return buildNextAnnouncement(next);
  return "";
}

/* ---------- Sweet engine: Google free Bengali TTS, direct from browser ---------- */

/** Split long text on Bengali sentence boundaries (Google caps ~200 chars). */
export function splitForSweet(text: string, max = SWEET_MAX_CHARS): string[] {
  const parts = text
    .split(/(?<=[।!?.,;])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    if (p.length <= max) {
      out.push(p);
      continue;
    }
    // hard-split an overlong chunk by words
    const words = p.split(/\s+/);
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (next.length > max && cur) {
        out.push(cur);
        cur = w;
      } else {
        cur = next;
      }
    }
    if (cur) out.push(cur);
  }
  return out.length ? out : [text];
}

export function sweetTtsUrl(text: string, tl = SWEET_TL): string {
  return (
    `${SWEET_BASE}?ie=UTF-8` +
    `&q=${encodeURIComponent(text)}&tl=${tl}&client=tw-ob&ttsspeed=0.95`
  );
}

/**
 * Fetch MP3 as a blob and play from an object URL.
 * Blob playback is what makes Chrome (Windows + Android) reliable:
 * no Referer/403 quirks, no partial-play, cacheable.
 * Falls back to direct <audio src> if fetch is blocked (adblock/offline).
 */
async function sweetSrc(text: string): Promise<string> {
  const cached = sweetBlobCache.get(text);
  if (cached) return cached;
  try {
    const res = await fetch(sweetTtsUrl(text), { mode: "cors" });
    if (!res.ok) throw new Error(`tts ${res.status}`);
    const blob = await res.blob();
    if (!blob.size) throw new Error("empty tts");
    const url = URL.createObjectURL(blob);
    // cap cache so a long clinic day can't leak memory
    if (sweetBlobCache.size > 40) {
      const first = sweetBlobCache.keys().next().value as string | undefined;
      if (first) {
        URL.revokeObjectURL(sweetBlobCache.get(first)!);
        sweetBlobCache.delete(first);
      }
    }
    sweetBlobCache.set(text, url);
    return url;
  } catch {
    return sweetTtsUrl(text); // direct play — no CORS needed for <audio>
  }
}

/** Warm the browser cache so the announcement starts instantly. */
export function preloadAnnounce(payload: AnnouncePayload): void {
  if (typeof window === "undefined") return;
  const text = buildAnnouncement(payload);
  if (!text) return;
  for (const chunk of splitForSweet(text)) {
    // blob-cache path (Chrome/Android lady voice)
    void sweetSrc(chunk);
    // + classic preload as backup
    const a = new Audio();
    a.preload = "auto";
    a.src = sweetTtsUrl(chunk);
    try {
      void a.load();
    } catch {
      /* ignore */
    }
  }
}

function playSweetChunkUrl(url: string, volume: number, myToken: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (myToken !== sweetToken) return resolve(); // superseded
    stopSweetAudio();
    const a = new Audio();
    a.preload = "auto";
    (a as HTMLAudioElement & { playsInline?: boolean }).playsInline = true; // Android Chrome
    a.volume = volume;
    a.src = url;
    sweetAudio = a;
    const done = () => {
      if (sweetAudio === a) sweetAudio = null;
      resolve();
    };
    a.onended = done;
    // Small network hiccups shouldn't kill the board — caller decides fallback
    a.onerror = () => reject(new Error("sweet audio failed"));
    const p = a.play();
    if (p && typeof p.catch === "function") {
      p.catch((e) => reject(e instanceof Error ? e : new Error("audio play blocked")));
    }
  });
}

function playSweetChunk(url: string, volume: number, myToken: number): Promise<void> {
  return playSweetChunkUrl(url, volume, myToken);
}

function stopSweetAudio(): void {
  try {
    sweetAudio?.pause();
  } catch {
    /* ignore */
  }
  sweetAudio = null;
}

/** Sweet Bengali lady voice via Google MP3s. Throws on network/block — caller falls back. */
async function speakSweet(text: string, volume = 1): Promise<void> {
  const myToken = ++sweetToken;
  const chunks = splitForSweet(text);
  // Resolve blob URLs first (parallel fetch), then play in order.
  // Blob playback = identical lady voice in Chrome Windows + Android Chrome,
  // no dependency on whatever OS voice is installed.
  const urls = await Promise.all(chunks.map((c) => sweetSrc(c)));
  for (const url of urls) {
    if (myToken !== sweetToken) return; // a newer serial took over
    await playSweetChunk(url, volume, myToken);
  }
}

/* ---------- Native engine: speechSynthesis (offline fallback) ---------- */

function nativeSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!nativeSupported()) return resolve([]);
    const avail = window.speechSynthesis.getVoices();
    if (avail.length) {
      cachedVoices = avail;
      return resolve(avail);
    }
    const onChange = () => {
      const v = window.speechSynthesis.getVoices();
      cachedVoices = v;
      window.speechSynthesis.removeEventListener?.("voiceschanged", onChange);
      resolve(v);
    };
    window.speechSynthesis.addEventListener?.("voiceschanged", onChange);
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
  });
}

function pickBnVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const norm = (s: string) => s.toLowerCase().replace("_", "-");
  const want = norm(lang);
  return (
    voices.find((v) => norm(v.lang) === want) ??
    voices.find((v) => norm(v.lang) === "bn-bd") ??
    voices.find((v) => norm(v.lang) === "bn-in") ??
    voices.find((v) => norm(v.lang).startsWith("bn")) ??
    voices.find((v) => norm(v.lang).startsWith("hi")) ??
    voices.find((v) => norm(v.name).toLowerCase().includes("google")) ??
    voices[0] ??
    null
  );
}

/** Female-indicating voice names — Android's built-in "Google বাংলা" lady matches via `google`. */
const FEMALE_NAME_HINT = /female|woman|girl|lady|nabanita|tanishaa|google/i;

/** Best local Bengali LADY voice (Android Chrome's "Google বাংলা"), or null. */
function pickFemaleBnVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const bn = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("bn"));
  if (!bn.length) return null;
  return bn.find((v) => FEMALE_NAME_HINT.test(v.name)) ?? bn[0];
}

function isAndroid(): boolean {
  return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
}

/** Native speech with an explicit voice. Resolves true if fully spoken, false on error. */
function speakNativeWithVoice(
  text: string,
  voice: SpeechSynthesisVoice,
  opts: AnnounceOptions = {},
): Promise<boolean> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    synth.resume();
    synth.cancel(); // NOTE: speak must wait a tick after cancel (Chrome bug)
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = opts.rate ?? 0.92;
      u.pitch = opts.pitch ?? 1;
      u.volume = opts.volume ?? 1;
      u.onend = () => resolve(true);
      u.onerror = () => resolve(false);
      synth.resume();
      synth.speak(u);
    }, 80);
  });
}

/**
 * Android fast path: the phone's built-in Bengali lady voice, no network.
 * Returns true if she spoke, false if unavailable/failed (caller falls back).
 */
async function tryLocalFemaleBn(text: string, opts: AnnounceOptions = {}): Promise<boolean> {
  if (!nativeSupported() || !isAndroid()) return false;
  try {
    if (!cachedVoices.length) await loadVoices();
    const lady = pickFemaleBnVoice(cachedVoices);
    if (!lady) return false;
    if (!cachedVoices.length) await loadVoices();
    return await speakNativeWithVoice(text, lady, opts);
  } catch {
    return false;
  }
}

function speakNativeOne(text: string, opts: AnnounceOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (!nativeSupported()) return resolve();
    const synth = window.speechSynthesis;
    synth.resume();
    synth.cancel(); // NOTE: speak must wait a tick after cancel (Chrome bug)
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = opts.lang ?? DEFAULT_LANG;
      u.rate = opts.rate ?? 0.92;
      u.pitch = opts.pitch ?? 1;
      u.volume = opts.volume ?? 1;
      const voice = pickBnVoice(cachedVoices, u.lang);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      }
      u.onend = () => resolve();
      u.onerror = () => resolve();
      synth.resume();
      synth.speak(u);
    }, 80);
  });
}

async function speakNative(text: string, opts: AnnounceOptions = {}): Promise<void> {
  if (!nativeSupported()) return;
  if (!cachedVoices.length) await loadVoices();
  await speakNativeOne(text, opts);
}

/* ---------- Public API ---------- */

async function speakText(text: string, opts: AnnounceOptions = {}): Promise<void> {
  if (!text || typeof window === "undefined") return;
  const engine = opts.engine ?? "sweet";
  const volume = opts.volume ?? 1;
  if (engine === "native") return speakNative(text, opts);
  if (engine === "auto") {
    // Android lady first (local "Google বাংলা", no network) → sweet MP3 → native.
    if (await tryLocalFemaleBn(text, opts)) return;
    try {
      await speakSweet(text, volume);
    } catch {
      await speakNative(text, opts);
    }
    return;
  }
  try {
    await speakSweet(text, volume);
  } catch {
    await speakNative(text, opts);
  }
}

/**
 * Announce one payload. Safe to call repeatedly — previous speech is
 * cancelled first so the LATEST serial always wins.
 * Default engine "sweet" (Google Bengali MP3, direct browser→Google).
 *
 * NOTE: this speaks current + next back-to-back. For the TV board prefer
 * `announceLiveSplit`, which waits `nextDelayMs` (default 45s) before the
 * next-person call so they get time to get ready.
 */
export async function announceLive(
  payload: AnnouncePayload,
  opts: AnnounceOptions = {},
): Promise<void> {
  const text = buildAnnouncement(payload);
  if (!text) return;
  await speakText(text, opts);
}

let pendingNextTimer: ReturnType<typeof setInterval> | null = null;
let pendingNextToken = 0;

function clearPendingNext(): void {
  if (pendingNextTimer) {
    clearInterval(pendingNextTimer);
    pendingNextTimer = null;
  }
  pendingNextToken++; // invalidate any in-flight delayed call
}

/**
 * Split announcement for the live board:
 *  1. speaks the "come inside" call for `current` immediately,
 *  2. waits `nextDelayMs` (default 45s), then speaks the "get ready"
 *     call for `next` — and REPEATS it every `nextDelayMs` until a newer
 *     serial (or `stopAnnounce()`) cancels it, so the waiting patient
 *     keeps getting reminded.
 * Returns a cancel function for the pending/repeating next-call.
 */
export function announceLiveSplit(
  payload: AnnouncePayload,
  opts: AnnounceOptions = {},
  onNextDone?: () => void,
): () => void {
  // New serial takes over: kill previous speech + pending next-call
  stopAnnounce();
  const { current, next } = payload;
  if (current) void speakText(buildCurrentAnnouncement(current), opts);

  if (next) {
    const delay = Math.max(5000, opts.nextDelayMs ?? DEFAULT_NEXT_DELAY_MS);
    const myToken = ++pendingNextToken;
    const fire = () => {
      if (myToken !== pendingNextToken) return; // superseded
      void speakText(buildNextAnnouncement(next), opts).then(() => {
        if (myToken === pendingNextToken) onNextDone?.();
      });
    };
    pendingNextTimer = setInterval(fire, delay);
  }
  return () => {
    pendingNextToken++;
    clearPendingNext();
  };
}

/** One-shot "doctor on break" call — also silences any repeating next-call. */
export async function announceBreak(
  reason: string,
  minutesLeft: number,
  opts: AnnounceOptions = {},
): Promise<void> {
  if (typeof window === "undefined") return;
  const clean = reason.trim().slice(0, 140);
  const text =
    `দয়া করে অপেক্ষা করুন। ডাক্তার ${serialToBnWords(Math.max(1, Math.round(minutesLeft)))} মিনিটের বিরতিতে আছেন।` +
    (clean ? ` ${clean}।` : "");
  stopAnnounce();
  await speakText(text, opts);
}

/** Stop any ongoing announcement (both engines) + cancel pending next-call. */
export function stopAnnounce(): void {
  clearPendingNext();
  sweetToken++; // invalidate sweet queue
  stopSweetAudio();
  if (nativeSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}

/**
 * MUST be called once from a user click ("🔊 সাউন্ড চালু করুন" button).
 * Browsers block <audio> AND speech until user interaction.
 * Plays a short audible confirmation in the sweet voice.
 */
export async function unlockAnnounce(opts: AnnounceOptions = {}): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const volume = opts.volume ?? 1;
  // Preload native voices in parallel (fallback path)
  void loadVoices();
  try {
    await speakSweet("সাউন্ড চালু হয়েছে।", volume);
    return true;
  } catch {
    // Sweet blocked (offline/adblock?) → try native unlock instead
    try {
      if (!nativeSupported()) return false;
      await loadVoices();
      window.speechSynthesis.resume();
      window.speechSynthesis.cancel();
      await new Promise((r) => setTimeout(r, 80));
      await speakNativeOne("সাউন্ড চালু হয়েছে।", opts);
      return true;
    } catch {
      return false;
    }
  }
}

export function isAnnounceSupported(): boolean {
  return typeof window !== "undefined" && ("Audio" in window || nativeSupported());
}

/** One-shot test — sweet voice. If you hear this, everything works. */
export async function testAnnounceSound(opts: AnnounceOptions = {}): Promise<void> {
  await announceLive(
    { current: { serial: 1, patientName: "পরীক্ষা" }, next: null },
    { engine: "sweet", ...opts },
  );
}

/** Debug helper — run in DevTools console to see why there's no sound. */
export async function diagnoseAnnounce(): Promise<{
  sweetUrl: string;
  nativeSupported: boolean;
  speaking: boolean;
  pending: boolean;
  paused: boolean;
  voiceCount: number;
  bnVoices: string[];
  allVoices: string[];
}> {
  const voices = nativeSupported() ? await loadVoices() : [];
  const all = voices.map((v) => `${v.name} (${v.lang})${v.default ? " [default]" : ""}`);
  const synth = nativeSupported() ? window.speechSynthesis : null;
  return {
    sweetUrl: sweetTtsUrl("সাউন্ড টেস্ট"),
    nativeSupported: nativeSupported(),
    speaking: synth?.speaking ?? false,
    pending: synth?.pending ?? false,
    paused: synth?.paused ?? false,
    voiceCount: voices.length,
    bnVoices: all.filter((s) => /bn|beng|bangla/i.test(s)),
    allVoices: all,
  };
}

/* ---------- Drop-in hook for LiveBoard ---------- */

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Auto-announces whenever `current.serial` changes + preloads the audio
 * so it starts instantly.
 *
 * Split flow: current patient is called immediately, the next person is
 * called after `nextDelayMs` (default 45s) and then REPEATED every
 * `nextDelayMs` until the serial advances. `nextIn` counts down the
 * seconds until the next repeat — show it on the board if you like.
 *
 * Pass `suspended=true` (e.g. doctor on break) to silence the repeats;
 * when it flips back to false the current serial resumes its repeats.
 *
 * ```tsx
 * const { enabled, enable, replay, nextIn } = useLiveAnnounce(
 *   snap ? { current: snap.current, next: snap.next ?? snap.upcoming[0] ?? null } : null,
 *   { engine: "auto", nextDelayMs: 45_000 },
 *   !!snap?.break,
 * );
 * // <button onClick={enable}>🔊 সাউন্ড চালু করুন</button>
 * // <button onClick={replay}>🔁 আবার শুনুন</button>
 * ```
 */
export function useLiveAnnounce(
  payload: AnnouncePayload | null,
  opts: AnnounceOptions = {},
  suspended = false,
) {
  const [enabled, setEnabled] = useState(false);
  const [nextIn, setNextIn] = useState<number | null>(null);
  const lastSerialRef = useRef<number | null>(null);
  const payloadRef = useRef(payload);
  const optsRef = useRef(opts);
  // Keep latest payload/opts/suspended for event handlers (synced in
  // effects — refs must not be written during render).
  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);
  useEffect(() => {
    optsRef.current = opts;
  }, [opts]);
  const suspendedRef = useRef(suspended);
  useEffect(() => {
    suspendedRef.current = suspended;
  }, [suspended]);
  const cancelSplitRef = useRef<(() => void) | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setNextIn(null);
  }, []);

  /** (Re)start the per-repeat countdown display. */
  const scheduleCountdown = useCallback((delay: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    const endsAt = Date.now() + delay;
    setNextIn(Math.ceil(delay / 1000));
    countdownRef.current = setInterval(() => {
      const left = Math.ceil((endsAt - Date.now()) / 1000);
      if (left <= 0) {
        // Repeat is due — the split's onNextDone restarts us; park at 0 meanwhile.
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = null;
        setNextIn(0);
      } else {
        setNextIn(left);
      }
    }, 1000);
  }, []);

  const delayOf = useCallback(
    () => Math.max(5000, optsRef.current.nextDelayMs ?? DEFAULT_NEXT_DELAY_MS),
    [],
  );

  const startSplit = useCallback(
    (p: AnnouncePayload) => {
      cancelSplitRef.current?.();
      clearCountdown();
      if (p.next) {
        const delay = delayOf();
        scheduleCountdown(delay);
      }
      // Each repeat re-arms the countdown, so `nextIn` ticks 45 → 0 → 45…
      cancelSplitRef.current = announceLiveSplit(p, optsRef.current, () => {
        if (payloadRef.current?.next) scheduleCountdown(delayOf());
        else clearCountdown();
      });
    },
    [clearCountdown, scheduleCountdown, delayOf],
  );

  const replay = useCallback(() => {
    if (suspendedRef.current) return;
    if (payloadRef.current?.current) startSplit(payloadRef.current);
  }, [startSplit]);

  const enable = useCallback(async () => {
    const ok = await unlockAnnounce(optsRef.current);
    if (ok) {
      setEnabled(true);
      if (payloadRef.current?.current && !suspendedRef.current) {
        lastSerialRef.current = payloadRef.current.current.serial;
        startSplit(payloadRef.current);
      } else if (payloadRef.current?.current) {
        lastSerialRef.current = payloadRef.current.current.serial;
      }
    }
    return ok;
  }, [startSplit]);

  // Serial advance → current now, next repeats every delay (unless suspended)
  useEffect(() => {
    if (!enabled || suspended || !payload?.current) return;
    if (lastSerialRef.current === payload.current.serial) return;
    lastSerialRef.current = payload.current.serial;
    startSplit(payload);
  }, [enabled, suspended, payload?.current?.serial, startSplit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Suspend (break start) silences repeats; resume (break end) restarts
  // them for the same serial without waiting for an advance.
  const prevSuspendedRef = useRef(suspended);
  useEffect(() => {
    const was = prevSuspendedRef.current;
    prevSuspendedRef.current = suspended;
    if (suspended && !was) {
      cancelSplitRef.current?.();
      clearCountdown();
    } else if (!suspended && was && enabled && payloadRef.current?.current) {
      startSplit(payloadRef.current);
    }
  }, [suspended, enabled, startSplit, clearCountdown]);

  // New serial cancels a still-pending next-call (stale name must never play)
  useEffect(() => {
    return () => {
      cancelSplitRef.current?.();
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Preload next announcement's MP3 while the doctor is still with current patient
  useEffect(() => {
    if (payload && (optsRef.current.engine ?? "sweet") !== "native") {
      preloadAnnounce(payload);
    }
  }, [payload?.current?.serial, payload?.next?.serial]); // eslint-disable-line react-hooks/exhaustive-deps

  return { enabled, enable, replay, nextIn, stop: stopAnnounce };
}
