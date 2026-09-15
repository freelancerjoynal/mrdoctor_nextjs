import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LocalBookingPanel } from "./LocalBookingPanel";

/** Staff walk-in page — OFFLINE booking + SMS receipt. Hospital desk picks the doctor. */
export default async function LocalBookingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (
    session.role !== "DOCTOR" &&
    session.role !== "DOCTOR_STAFF" &&
    session.role !== "HOSPITAL" &&
    session.role !== "HOSPITAL_STAFF"
  )
    redirect("/dashboard");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">লোকাল বুকিং</h1>
        <p className="mt-1 text-sm text-slate-500">
          সরাসরি আসা রোগীর অফলাইন বুকিং — নাম, মোবাইল, ধরন ও টাকা আবশ্যক।
        </p>
      </div>
      <LocalBookingPanel />
    </div>
  );
}
