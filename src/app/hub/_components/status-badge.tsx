type StatusBadgeProps = {
  value: string;
};

function classesForStatus(value: string): string {
  const status = value.toUpperCase();

  if (["ACTIVE", "DONE", "PAID", "APPROVED", "RELEASED", "CHECKED_OUT", "ARCHIVED"].includes(status)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (["HIGH", "P1", "REJECTED", "CANCELLED", "DELETION_SCHEDULED"].includes(status)) {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  if (["DRAFT", "READY", "SUBMITTED", "IN_PROGRESS", "DUE", "CHECKED_IN", "EXPIRED"].includes(status)) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-sky-200 bg-sky-50 text-sky-800";
}

export function StatusBadge({ value }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold tracking-[0.04em] ${classesForStatus(value)}`}>
      {value}
    </span>
  );
}
