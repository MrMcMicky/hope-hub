import Link from "next/link";

type HubNavTab = "dashboard" | "cases" | "billing" | "exports" | "sync" | "reports";

type HubNavProps = {
  active: HubNavTab;
};

const TABS: Array<{ key: HubNavTab; label: string; href: string }> = [
  { key: "dashboard", label: "Dashboard", href: "/hub" },
  { key: "cases", label: "Fälle", href: "/hub/cases" },
  { key: "billing", label: "Billing", href: "/hub/billing" },
  { key: "exports", label: "Exporte", href: "/hub/exports" },
  { key: "sync", label: "Sync", href: "/hub/sync" },
  { key: "reports", label: "Reports", href: "/hub/reports" },
];

function tabClass(isActive: boolean): string {
  if (isActive) {
    return "rounded-xl border border-brand/35 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand-strong";
  }

  return "rounded-xl border border-black/12 bg-white px-4 py-2 text-sm font-semibold text-foreground/85 hover:border-brand/40";
}

export function HubNav({ active }: HubNavProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/hub/cases#new-case"
        className="inline-flex items-center gap-1.5 rounded-xl border border-brand/80 bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_-12px_rgba(199,61,133,0.85)] hover:bg-brand-strong"
      >
        <span aria-hidden>+</span>
        Neuer Fall
      </Link>
      {TABS.map((tab) => (
        <Link key={tab.key} href={tab.href} className={tabClass(active === tab.key)}>
          {tab.label}
        </Link>
      ))}
      <Link href="/" className="rounded-xl border border-black/12 bg-white px-4 py-2 text-sm font-semibold text-foreground/85 hover:border-brand/40">
        Landing
      </Link>
      <Link href="/api/auth/signout?callbackUrl=%2F" className="rounded-xl border border-black/12 bg-white px-4 py-2 text-sm font-semibold text-foreground/85 hover:border-brand/40">
        Logout
      </Link>
    </div>
  );
}
