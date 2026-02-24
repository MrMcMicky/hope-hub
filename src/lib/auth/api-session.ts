import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import type { HubActor } from "@/lib/auth/session";

export async function getHubActorFromApiSession(): Promise<HubActor | null> {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return null;
  }

  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? "unknown@local.invalid",
    name: session.user.name ?? session.user.email ?? "Unbekannt",
    roles: session.user.roles,
    assignmentCaseIds: session.user.assignmentCaseIds ?? [],
  };
}
