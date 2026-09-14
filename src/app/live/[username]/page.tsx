import type { Metadata } from "next";
import { LiveBoard } from "@/components/live/LiveBoard";
import { getInitialBoard } from "@/lib/live";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const board = await getInitialBoard(username);
  const name = board?.doctor.name ?? username;
  return {
    title: `${name} — লাইভ সিরিয়াল`,
    description: `${name}-এর চলমান সিরিয়াল বোর্ড।`,
  };
}

/** Public live serial scoreboard — shareable TV/board URL. */
export default async function LiveSerialPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const initial = await getInitialBoard(username);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950">
      <LiveBoard username={username} initial={initial} />
    </div>
  );
}
