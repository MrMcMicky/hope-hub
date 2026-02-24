import Link from "next/link";

type ErrorPageProps = {
  searchParams?: {
    error?: string;
  };
};

export const metadata = {
  title: "HOPE Hub Login Fehler",
};

export default function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const errorCode = searchParams?.error ?? "unknown";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-12">
      <section className="rounded-3xl border border-black/10 bg-surface/95 p-8 shadow-[0_18px_60px_-26px_rgb(18_22_27/0.38)] sm:p-10">
        <h1 className="font-display text-3xl leading-tight text-foreground">Anmeldung fehlgeschlagen</h1>
        <p className="mt-4 text-sm leading-6 text-foreground/75">
          Der Login konnte nicht abgeschlossen werden. Fehlercode: <code>{errorCode}</code>
        </p>
        <div className="mt-8 flex gap-4 text-sm">
          <Link href="/auth/login" className="rounded-xl bg-brand px-4 py-2 font-semibold text-white">
            Erneut versuchen
          </Link>
          <Link href="/" className="rounded-xl border border-black/10 px-4 py-2 font-semibold text-foreground/80">
            Startseite
          </Link>
        </div>
      </section>
    </main>
  );
}
