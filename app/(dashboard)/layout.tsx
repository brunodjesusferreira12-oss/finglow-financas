import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/services/profile-service";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const userName = profile?.full_name || user.email?.split("@")[0] || "Usuário";

  return (
    <AppShell userName={userName} email={profile?.email ?? user.email ?? ""}>
      {children}
    </AppShell>
  );
}
