import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { getDisplayName } from "@/lib/auth/displayName";
import { ROLE_META } from "@/lib/auth/constants";
import { isAdminRole } from "@/lib/auth/types";
import { DashboardShell } from "@/components/dashboard/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getProfile();
  if (!data) redirect("/login");
  if (isAdminRole(data.session.role)) redirect("/admin");

  const name = getDisplayName(data.session, data.profile);
  const roleBn = ROLE_META[data.session.role].label;

  // Public portal link for the sidebar: doctor username / hospital slug
  // (subdomain portal), resolved per role. Opens in a new tab.
  let portalSubdomain: string | null = null;
  let portalKind: "doctor" | "hospital" | null = null;
  if (data.session.role === "DOCTOR" && data.profile?.doctorProfile?.username?.trim()) {
    portalSubdomain = data.profile.doctorProfile.username.trim();
    portalKind = "doctor";
  } else if (data.session.role === "DOCTOR_STAFF" && data.profile?.staffDoctor?.username?.trim()) {
    portalSubdomain = data.profile.staffDoctor.username.trim();
    portalKind = "doctor";
  } else if (data.session.role === "HOSPITAL" && data.profile?.hospitalProfile?.slug?.trim()) {
    portalSubdomain = data.profile.hospitalProfile.slug.trim();
    portalKind = "hospital";
  } else if (data.session.role === "HOSPITAL_STAFF") {
    const slug = data.profile?.staffHospital?.slug?.trim() || data.profile?.hospitalProfile?.slug?.trim();
    if (slug) { portalSubdomain = slug; portalKind = "hospital"; }
  }

  // Header avatar: the doctor's profile picture (own profile for DOCTOR,
  // own uploaded photo for DOCTOR_STAFF, global avatar fallback included);
  // other roles keep the initial badge.
  const headerPicture =
    data.session.role === "DOCTOR"
      ? (data.profile?.doctorProfile?.profilePicture ?? null)
      : data.session.role === "DOCTOR_STAFF" || data.session.role === "HOSPITAL_STAFF"
        ? (data.profile?.profilePicture ?? null)
        : undefined;

  return (
    <DashboardShell
      name={name}
      roleLabel={roleBn}
      role={data.session.role}
      profilePicture={headerPicture}
      portalSubdomain={portalSubdomain}
      portalKind={portalKind}
    >
      {children}
    </DashboardShell>
  );
}
