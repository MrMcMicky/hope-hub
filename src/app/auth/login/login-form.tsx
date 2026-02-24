"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

type LoginFormProps = {
  defaultEmail?: string;
  enabled: boolean;
  callbackUrl?: string;
};

export function DemoAdminLoginForm({ defaultEmail, enabled, callbackUrl = "/hub" }: LoginFormProps) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled) return;

    setIsSubmitting(true);
    setError("");

    const result = await signIn("demo-admin", {
      email,
      password,
      callbackUrl,
      redirect: true,
    });

    if (result?.error) {
      setError("Anmeldung fehlgeschlagen. Bitte Zugangsdaten prüfen.");
      setIsSubmitting(false);
      return;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
          E-Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={!enabled || isSubmitting}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand/70 focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70"
        >
          Passwort
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={!enabled || isSubmitting}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand/70 focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={!enabled || isSubmitting}
        className="inline-flex rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "Anmeldung läuft..." : "Als Demo Admin anmelden"}
      </button>
    </form>
  );
}
