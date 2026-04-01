import { requireServerAuthSession } from "@/app/lib/auth-session";
import ProfileClient from "./profile-client";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const authSession = await requireServerAuthSession("/account/profile");

  return (
    <ProfileClient
      initialName={authSession.user.name ?? ""}
      initialEmail={authSession.user.email ?? ""}
    />
  );
}
