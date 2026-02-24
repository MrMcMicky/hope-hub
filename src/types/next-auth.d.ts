import type { DefaultSession } from "next-auth";
import type { ActorRole } from "@/modules/authz";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      roles: ActorRole[];
      role: ActorRole;
      assignmentCaseIds: string[];
    };
  }

  interface User {
    id: string;
    roles?: ActorRole[];
    role?: ActorRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roles?: ActorRole[];
    role?: ActorRole;
    assignmentCaseIds?: string[];
  }
}
