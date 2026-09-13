"use client";

import { doctorPortrait, fallbackAvatar } from "@/lib/profile";

/** Dashboard header avatar — DB profile picture, else the global avatar. */
export function HeaderAvatar({ profilePicture, name }: { profilePicture?: string | null; name: string }) {
  const fallback = fallbackAvatar();
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- portrait may be any external doctor-uploaded URL */
    <img
      src={doctorPortrait(profilePicture)}
      alt={name}
      className="h-9 w-9 shrink-0 rounded-xl object-cover shadow ring-1 ring-slate-200"
      onError={(e) => {
        if (!e.currentTarget.src.endsWith(fallback)) {
          e.currentTarget.src = fallback;
        }
      }}
    />
  );
}
