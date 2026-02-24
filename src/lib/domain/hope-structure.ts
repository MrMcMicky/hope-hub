import type { DataClass, LegalBasis, ProgramArea, SharePolicy } from "@prisma/client";

export type HopeOffering = {
  code: string;
  label: string;
  area: ProgramArea;
  defaultPurpose: string;
  defaultLegalBasis: LegalBasis;
  defaultSharePolicy: SharePolicy;
  defaultDataClass: DataClass;
  defaultRetentionRule: string;
  occupancySite?: string;
  capacity?: number;
};

export const HOPE_PROGRAM_AREAS: Array<{ value: ProgramArea; label: string }> = [
  { value: "BEGEGNUNG", label: "Begegnung" },
  { value: "BETREUEN", label: "Betreuen" },
  { value: "BEHERBERGEN", label: "Beherbergen" },
  { value: "BESCHAEFTIGEN", label: "Beschäftigen" },
];

export const HOPE_OFFERINGS: HopeOffering[] = [
  {
    code: "HOPE_RESTAURANT",
    label: "Öffentliches Restaurant",
    area: "BEGEGNUNG",
    defaultPurpose: "Niederschwellige Begegnung und soziale Teilhabe",
    defaultLegalBasis: "LEGITIMATE_INTEREST",
    defaultSharePolicy: "INTERNAL_ONLY",
    defaultDataClass: "INTERNAL",
    defaultRetentionRule: "Kontakt- und Verlaufsdaten 5 Jahre",
  },
  {
    code: "FOOD_DISTRIBUTION",
    label: "Lebensmittelabgabe",
    area: "BEGEGNUNG",
    defaultPurpose: "Grundversorgung und Stabilisierung",
    defaultLegalBasis: "VITAL_INTEREST",
    defaultSharePolicy: "INTERNAL_ONLY",
    defaultDataClass: "CONFIDENTIAL",
    defaultRetentionRule: "Klientenakte bis 100. Altersjahr",
  },
  {
    code: "STREETWORK",
    label: "Streetwork",
    area: "BEGEGNUNG",
    defaultPurpose: "Aufsuchende Unterstützung und Erstabklärung",
    defaultLegalBasis: "VITAL_INTEREST",
    defaultSharePolicy: "NEED_TO_KNOW",
    defaultDataClass: "HIGHLY_SENSITIVE",
    defaultRetentionRule: "Klientenakte bis 100. Altersjahr",
  },
  {
    code: "SOCIAL_COUNSELING",
    label: "Soziale Beratungsstelle",
    area: "BETREUEN",
    defaultPurpose: "Beratung und Begleitung im Hilfeprozess",
    defaultLegalBasis: "CONTRACT",
    defaultSharePolicy: "NEED_TO_KNOW",
    defaultDataClass: "HIGHLY_SENSITIVE",
    defaultRetentionRule: "Klientenakte bis 100. Altersjahr",
  },
  {
    code: "EMERGENCY_SHELTER",
    label: "Notschlafstelle",
    area: "BEHERBERGEN",
    defaultPurpose: "Akute Unterbringung und Schutz",
    defaultLegalBasis: "VITAL_INTEREST",
    defaultSharePolicy: "NEED_TO_KNOW",
    defaultDataClass: "HIGHLY_SENSITIVE",
    defaultRetentionRule: "Klientenakte bis 100. Altersjahr",
    occupancySite: "Notschlafstelle",
    capacity: 12,
  },
  {
    code: "EMERGENCY_PENSION",
    label: "Notpension",
    area: "BEHERBERGEN",
    defaultPurpose: "Kurzfristige Stabilisierung",
    defaultLegalBasis: "CONTRACT",
    defaultSharePolicy: "NEED_TO_KNOW",
    defaultDataClass: "CONFIDENTIAL",
    defaultRetentionRule: "Klientenakte bis 100. Altersjahr",
    occupancySite: "Notpension",
    capacity: 10,
  },
  {
    code: "TRANSITION_HOUSING",
    label: "Übergangswohnen",
    area: "BEHERBERGEN",
    defaultPurpose: "Begleitete Wohnphase",
    defaultLegalBasis: "CONTRACT",
    defaultSharePolicy: "NEED_TO_KNOW",
    defaultDataClass: "CONFIDENTIAL",
    defaultRetentionRule: "Klientenakte bis 100. Altersjahr",
    occupancySite: "Übergangswohnen",
    capacity: 18,
  },
  {
    code: "HOUSING_CENTER",
    label: "Wohnzentrum",
    area: "BEHERBERGEN",
    defaultPurpose: "Begleitete Unterbringung im Wohnzentrum",
    defaultLegalBasis: "CONTRACT",
    defaultSharePolicy: "NEED_TO_KNOW",
    defaultDataClass: "CONFIDENTIAL",
    defaultRetentionRule: "Klientenakte bis 100. Altersjahr",
    occupancySite: "Wohnzentrum",
    capacity: 24,
  },
  {
    code: "EXTERNAL_HOUSING",
    label: "Wohnexternat",
    area: "BEHERBERGEN",
    defaultPurpose: "Begleitetes Wohnen im externen Setting",
    defaultLegalBasis: "CONTRACT",
    defaultSharePolicy: "NEED_TO_KNOW",
    defaultDataClass: "CONFIDENTIAL",
    defaultRetentionRule: "Klientenakte bis 100. Altersjahr",
    occupancySite: "Wohnexternat",
    capacity: 16,
  },
  {
    code: "HOUSING_SUPPORT",
    label: "Wohnbegleitung / Umzugsbegleitung",
    area: "BETREUEN",
    defaultPurpose: "Wohnstabilisierung und Begleitung im Übergang",
    defaultLegalBasis: "CONTRACT",
    defaultSharePolicy: "NEED_TO_KNOW",
    defaultDataClass: "CONFIDENTIAL",
    defaultRetentionRule: "Klientenakte bis 100. Altersjahr",
  },
  {
    code: "DAY_STRUCTURE",
    label: "Tagesstruktur / Beschäftigung",
    area: "BESCHAEFTIGEN",
    defaultPurpose: "Tagesstruktur und soziale Teilhabe",
    defaultLegalBasis: "CONTRACT",
    defaultSharePolicy: "INTERNAL_ONLY",
    defaultDataClass: "INTERNAL",
    defaultRetentionRule: "Verwaltungsakten 10 Jahre",
  },
  {
    code: "WORK_INTEGRATION",
    label: "Arbeitsintegration",
    area: "BESCHAEFTIGEN",
    defaultPurpose: "Schrittweise Integration in Arbeit und Alltag",
    defaultLegalBasis: "CONTRACT",
    defaultSharePolicy: "INTERNAL_ONLY",
    defaultDataClass: "INTERNAL",
    defaultRetentionRule: "Verwaltungsakten 10 Jahre",
  },
];

export const CASE_STATUS_OPTIONS = [
  { value: "INTAKE", label: "Intake" },
  { value: "ACTIVE", label: "Aktiv" },
  { value: "FOLLOW_UP", label: "Nachbetreuung" },
  { value: "WAITLIST", label: "Warteliste" },
  { value: "CLOSED", label: "Abgeschlossen" },
] as const;

export const RISK_LEVEL_OPTIONS = [
  { value: "LOW", label: "Tief" },
  { value: "MEDIUM", label: "Mittel" },
  { value: "HIGH", label: "Hoch" },
] as const;

export const TASK_PRIORITY_OPTIONS = [
  { value: "P1", label: "P1" },
  { value: "P2", label: "P2" },
  { value: "P3", label: "P3" },
] as const;

export const TASK_STATUS_OPTIONS = [
  { value: "OPEN", label: "Offen" },
  { value: "IN_PROGRESS", label: "In Arbeit" },
  { value: "DONE", label: "Erledigt" },
] as const;

export function offeringByCode(code: string): HopeOffering | undefined {
  return HOPE_OFFERINGS.find((item) => item.code === code);
}

export function offeringByLabel(label: string): HopeOffering | undefined {
  return HOPE_OFFERINGS.find((item) => item.label === label);
}

export function offeringsByArea(area: ProgramArea): HopeOffering[] {
  return HOPE_OFFERINGS.filter((item) => item.area === area);
}
