import Link from "next/link";

import { authentikConfigStatus } from "@/lib/auth/options";

export const metadata = {
  title: "HOPE Hub Login",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-12">
      <section className="rounded-3xl border border-black/10 bg-surface/95 p-8 shadow-[0_18px_60px_-26px_rgb(18_22_27/0.38)] sm:p-10">
        <p className="mb-4 inline-flex rounded-full border border-brand/25 bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">
          HOPE Hub
        </p>
        <h1 className="font-display text-3xl leading-tight text-foreground">Geschuetzter Bereich</h1>
        <p className="mt-4 text-sm leading-6 text-foreground/75">
          Anmeldung erfolgt ueber den zentralen OIDC-Provider (Authentik).
        </p>

        {authentikConfigStatus.configured ? (
          <Link
            href="/api/auth/signin/authentik?callbackUrl=%2F"
            className="mt-6 inline-flex rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white"
          >
            Mit Authentik anmelden
          </Link>
        ) : (
          <div className="mt-6 rounded-xl border border-brand/30 bg-white/80 px-4 py-3 text-sm text-foreground/80">
            Authentik ist noch nicht konfiguriert. Setze `AUTHENTIK_ISSUER`, `AUTHENTIK_CLIENT_ID`,
            `AUTHENTIK_CLIENT_SECRET` in deiner lokalen `.env`.
          </div>
        )}

        <div className="mt-8 text-sm text-foreground/70">
          <Link href="/" className="underline decoration-brand/50 underline-offset-4">
            Zurueck zur Startseite
          </Link>
        </div>
      </section>
    </main>
  );
}
