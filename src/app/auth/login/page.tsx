import Link from "next/link";

import { HopeLogo } from "@/app/_components/hope-logo";
import { authentikConfigStatus, demoCredentialsStatus } from "@/lib/auth/options";

import { DemoAdminLoginForm } from "./login-form";

export const metadata = {
  title: "HOPE Hub Login",
};

type LoginPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const callbackUrl = searchParams?.callbackUrl || "/hub";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-12">
      <section className="rounded-3xl border border-black/10 bg-surface/95 p-8 shadow-[0_18px_60px_-26px_rgb(18_22_27/0.38)] sm:p-10">
        <HopeLogo
          variant="full"
          priority
          className="mb-4 h-auto w-[220px] sm:w-[250px]"
          sizes="(max-width: 640px) 220px, 250px"
        />
        <h1 className="font-display text-3xl leading-tight text-foreground">Geschützter Bereich</h1>
        <p className="mt-4 text-sm leading-6 text-foreground/75">
          Anmeldung per Demo-Credentials oder über den zentralen OIDC-Provider (Authentik).
        </p>

        <DemoAdminLoginForm
          enabled={demoCredentialsStatus.configured}
          defaultEmail={demoCredentialsStatus.email}
          callbackUrl={callbackUrl}
        />

        {!demoCredentialsStatus.configured ? (
          <div className="mt-4 rounded-xl border border-brand/30 bg-white/80 px-4 py-3 text-sm text-foreground/80">
            Demo-Login ist noch nicht konfiguriert. Setze `DEMO_ADMIN_EMAIL` und `DEMO_ADMIN_PASSWORD`.
          </div>
        ) : null}

        <div className="my-6 h-px w-full bg-black/10" />

        {authentikConfigStatus.configured ? (
          <Link
            href={`/api/auth/signin/authentik?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="inline-flex rounded-xl border border-black/15 bg-white px-5 py-3 text-sm font-semibold text-foreground/80"
          >
            Alternativ mit Authentik anmelden
          </Link>
        ) : null}

        <div className="mt-8 text-sm text-foreground/70">
          <Link href="/" className="underline decoration-brand/50 underline-offset-4">
            Zurück zur Startseite
          </Link>
        </div>
      </section>
    </main>
  );
}
