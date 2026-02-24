import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";
import type { ActorRole } from "@/modules/authz";

export type HubActor = {
  id: string;
  email: string;
  name: string;
  roles: ActorRole[];
  assignmentCaseIds: string[];
};

export async function requireHubActor(redirectPath = "/hub"): Promise<HubActor> {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    redirect("/auth/login");
  }

  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(redirectPath)}`);
  }

  return {
    id: session.user.id,
    email: session.user.email ?? "unknown@local.invalid",
    name: session.user.name ?? session.user.email ?? "Unbekannt",
    roles: session.user.roles,
    assignmentCaseIds: session.user.assignmentCaseIds ?? [],
  };
}
