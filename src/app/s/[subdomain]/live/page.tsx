import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveProfile } from "@/lib/profile";
import { LiveBoard } from "@/components/live/LiveBoard";
import { getInitialBoard } from "@/lib/live";

interface LiveParams {
  subdomain: string;
}

/**
 * Doctor-subdomain live board: `dr-rahman.domain.com/live`
 * (middleware rewrites it here as `/s/dr-rahman/live`).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<LiveParams>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const profile = await resolveProfile(subdomain);
  const name =
    profile?.type === "doctor" ? profile.data.name : subdomain;
  return {
    title: `${name} — লাইভ সিরিয়াল`,
    description: `${name}-এর চলমান সিরিয়াল বোর্ড।`,
  };
}

export default async function SubdomainLivePage({
  params,
}: {
  params: Promise<LiveParams>;
}) {
  const { subdomain } = await params;
  const profile = await resolveProfile(subdomain);
  if (!profile || profile.type !== "doctor") notFound();
  const initial = await getInitialBoard(profile.data.username);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950">
      <LiveBoard username={profile.data.username} initial={initial} />
    </div>
  );
}
