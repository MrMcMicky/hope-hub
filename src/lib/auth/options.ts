import type { NextAuthOptions } from "next-auth";
import AuthentikProvider, { type AuthentikProfile } from "next-auth/providers/authentik";
import CredentialsProvider from "next-auth/providers/credentials";

import { caseIdsFromClaims, caseIdsFromTokenLike, rolesFromClaims, rolesFromTokenLike } from "./role-mapping";

const authentikEnv = {
  issuer: process.env.AUTHENTIK_ISSUER,
  clientId: process.env.AUTHENTIK_CLIENT_ID,
  clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
  scope: process.env.AUTHENTIK_SCOPE ?? "openid profile email groups",
};

const hasAuthentikEnv = Boolean(authentikEnv.issuer && authentikEnv.clientId && authentikEnv.clientSecret);

const demoAdminEnv = {
  email: process.env.DEMO_ADMIN_EMAIL,
  password: process.env.DEMO_ADMIN_PASSWORD,
  name: process.env.DEMO_ADMIN_NAME ?? "Demo Super Admin",
};

const hasDemoAdminEnv = Boolean(demoAdminEnv.email && demoAdminEnv.password);

if (!hasAuthentikEnv && process.env.NODE_ENV === "development") {
  console.warn(
    "[auth] Authentik OIDC variables are missing. Configure AUTHENTIK_ISSUER, AUTHENTIK_CLIENT_ID, AUTHENTIK_CLIENT_SECRET.",
  );
}

const authentikProvider = AuthentikProvider({
  issuer: authentikEnv.issuer ?? "https://invalid.local/application/o/hope-hub/",
  clientId: authentikEnv.clientId ?? "missing-client-id",
  clientSecret: authentikEnv.clientSecret ?? "missing-client-secret",
  authorization: {
    params: {
      scope: authentikEnv.scope,
    },
  },
  profile(profile: AuthentikProfile) {
    const roles = rolesFromClaims(profile as Record<string, unknown>);
    const displayName =
      profile.name ||
      [profile.given_name, profile.family_name].filter(Boolean).join(" ") ||
      profile.preferred_username ||
      profile.email ||
      profile.sub;

    return {
      id: profile.sub,
      email: profile.email,
      name: displayName,
      roles,
      role: roles[0],
    };
  },
});

const demoCredentialsProvider = CredentialsProvider({
  id: "demo-admin",
  name: "Demo Admin Login",
  credentials: {
    email: { label: "E-Mail", type: "email" },
    password: { label: "Passwort", type: "password" },
  },
  async authorize(credentials) {
    if (!hasDemoAdminEnv) return null;

    const email = credentials?.email?.trim().toLowerCase() ?? "";
    const password = credentials?.password ?? "";

    if (email !== demoAdminEnv.email?.toLowerCase()) return null;
    if (password !== demoAdminEnv.password) return null;

    return {
      id: `demo-admin:${demoAdminEnv.email}`,
      email: demoAdminEnv.email,
      name: demoAdminEnv.name,
      role: "ADMIN",
      roles: ["ADMIN"],
    };
  },
});

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [demoCredentialsProvider, authentikProvider],
  callbacks: {
    async jwt({ token, user, profile }) {
      if (profile && typeof profile === "object") {
        const profileRecord = profile as Record<string, unknown>;
        token.roles = rolesFromClaims(profileRecord);
        token.assignmentCaseIds = caseIdsFromClaims(profileRecord);
      }

      if (user) {
        const userRecord = user as typeof user & {
          id?: string;
          roles?: unknown;
          role?: unknown;
        };

        token.id = userRecord.id ?? token.id;
        const userRoles = rolesFromTokenLike({ roles: userRecord.roles, role: userRecord.role });
        token.roles = userRoles;
        token.role = userRoles[0];
      }

      if (!token.roles || !Array.isArray(token.roles) || token.roles.length === 0) {
        const fallbackRoles = rolesFromTokenLike({ roles: token.roles, role: token.role });
        token.roles = fallbackRoles;
        token.role = fallbackRoles[0];
      }

      token.assignmentCaseIds = caseIdsFromTokenLike({ assignmentCaseIds: token.assignmentCaseIds });

      return token;
    },
    async session({ session, token }) {
      if (!session.user) return session;

      const roles = rolesFromTokenLike({ roles: token.roles, role: token.role });

      session.user.id = String(token.id ?? token.sub ?? "");
      session.user.roles = roles;
      session.user.role = roles[0];
      session.user.assignmentCaseIds = caseIdsFromTokenLike({ assignmentCaseIds: token.assignmentCaseIds });

      return session;
    },
  },
};

export const authentikConfigStatus = {
  configured: hasAuthentikEnv,
};

export const demoCredentialsStatus = {
  configured: hasDemoAdminEnv,
  email: demoAdminEnv.email ?? "",
};
