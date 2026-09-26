import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { getDisplayName } from "@/lib/auth/displayName";
import { MyDoctorCard } from "@/components/dashboard/MyDoctorCard";
import { ProfilePanel } from "./ProfilePanel";
import { DoctorContentPanel } from "./DoctorContentPanel";

export default async function ProfilePage() {
  const data = await getProfile();
  if (!data) redirect("/login");

  const { profile } = data;
  const email = profile?.email ?? "";
  const initialName =
    profile?.doctorProfile?.name ||
    profile?.hospitalProfile?.name ||
    profile?.superAdminProfile?.name ||
    profile?.name ||
    "";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
          প্রোফাইল ব্যবস্থাপনা
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {getDisplayName(data.session, profile)} — নাম ও পাসওয়ার্ড পরিবর্তন করুন। ইমেইল
          অপরিবর্তনীয়।
          {data.session.role === "DOCTOR" ? " ডাক্তাররা ইমেইল/ইউজারনেম ছাড়া সব তথ্য সম্পাদনা করতে পারবেন।" : ""}
        </p>
      </div>
      <ProfilePanel
        initialEmail={email}
        initialName={initialName}
        role={data.session.role}
        doctorProfile={profile?.doctorProfile ?? null}
        hospitalProfile={profile?.hospitalProfile ?? null}
        initialProfilePicture={profile?.profilePicture ?? null}
      />
      {data.session.role === "DOCTOR" && <DoctorContentPanel />}
      {data.session.role === "DOCTOR_STAFF" && profile?.staffDoctor && (
        <MyDoctorCard doctor={profile.staffDoctor} />
      )}
    </div>
  );
}
