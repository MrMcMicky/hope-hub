export type PrototypeCaseStatus = "INTAKE" | "ACTIVE" | "FOLLOW_UP" | "WAITLIST" | "CLOSED";
export type PrototypeRiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type PrototypePriority = "P1" | "P2" | "P3";

export type PrototypeCase = {
  id: string;
  caseRef: string;
  subjectName: string;
  status: PrototypeCaseStatus;
  riskLevel: PrototypeRiskLevel;
  assignedTeam: string;
  openTasks: number;
  nights: number;
  legalBasis: "CONTRACT" | "CONSENT" | "LEGAL_OBLIGATION";
  dataClass: "INTERNAL" | "CONFIDENTIAL" | "HIGHLY_SENSITIVE";
  lastContactAt: string;
};

export type PrototypeActivity = {
  id: string;
  occurredAt: string;
  type: "CHECK_IN" | "COUNSELING" | "DOCUMENT_UPLOAD" | "MEDICAL" | "FOLLOW_UP";
  caseRef: string;
  actor: string;
  note: string;
};

export type PrototypeTask = {
  id: string;
  title: string;
  caseRef: string;
  owner: string;
  dueAt: string;
  priority: PrototypePriority;
  status: "OPEN" | "IN_PROGRESS" | "DONE";
};

export type PrototypeSyncClient = {
  id: string;
  label: string;
  owner: string;
  lastSeenAt: string;
  pendingEvents: number;
  battery: number;
};

export type PrototypeSnapshot = {
  generatedAt: string;
  kpis: {
    activeCases: number;
    openTasks: number;
    highRiskCases: number;
    pendingSyncEvents: number;
    occupancyRate: number;
  };
  occupancy: Array<{ site: string; capacity: number; occupied: number }>;
  cases: PrototypeCase[];
  activities: PrototypeActivity[];
  tasks: PrototypeTask[];
  syncClients: PrototypeSyncClient[];
};

const subjectNames = [
  "M. Schneider",
  "L. Baumann",
  "S. Novak",
  "R. Costa",
  "E. Berger",
  "F. Keller",
  "A. Yildiz",
  "T. Huber",
  "N. Lenz",
  "J. Meier",
  "P. Wolf",
  "I. Rossi",
  "D. Frei",
  "K. Lorenz",
  "G. Haas",
  "B. Krüger",
  "Y. Lehmann",
  "C. Steiner",
  "O. Graf",
  "W. Schmid",
  "V. Moser",
  "H. Kunz",
  "Q. Dietrich",
  "U. Langer",
  "R. Baum",
  "Z. Maurer",
  "M. Vogel",
  "X. Fischer",
  "N. Albrecht",
  "S. Weber",
];

const teams = ["Outreach Nord", "Outreach West", "Case Mgmt Mitte", "24h Intake", "Medical Mobile"];
const taskOwners = ["Anna", "Jasmin", "Noah", "Samira", "Jonas", "Luca", "Eva"];
const activityActors = ["Anna", "Noah", "Samira", "Leitung", "Nachtteam"];

const caseStatuses: PrototypeCaseStatus[] = ["ACTIVE", "ACTIVE", "ACTIVE", "FOLLOW_UP", "WAITLIST", "INTAKE", "CLOSED"];
const riskLevels: PrototypeRiskLevel[] = ["LOW", "MEDIUM", "HIGH", "MEDIUM", "LOW", "HIGH"];
const legalBases: Array<PrototypeCase["legalBasis"]> = ["CONTRACT", "CONSENT", "LEGAL_OBLIGATION"];
const dataClasses: Array<PrototypeCase["dataClass"]> = ["INTERNAL", "CONFIDENTIAL", "HIGHLY_SENSITIVE"];

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function isoHoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function buildCases(): PrototypeCase[] {
  return subjectNames.map((subjectName, index) => {
    const seq = index + 1;
    return {
      id: `case-${seq}`,
      caseRef: `HH-26-${String(seq).padStart(4, "0")}`,
      subjectName,
      status: caseStatuses[index % caseStatuses.length],
      riskLevel: riskLevels[index % riskLevels.length],
      assignedTeam: teams[index % teams.length],
      openTasks: (index % 4) + (index % 5 === 0 ? 2 : 0),
      nights: 1 + (index % 34),
      legalBasis: legalBases[index % legalBases.length],
      dataClass: dataClasses[index % dataClasses.length],
      lastContactAt: isoHoursAgo(index * 3 + 2),
    };
  });
}

function buildActivities(cases: PrototypeCase[]): PrototypeActivity[] {
  const types: PrototypeActivity["type"][] = [
    "CHECK_IN",
    "COUNSELING",
    "DOCUMENT_UPLOAD",
    "MEDICAL",
    "FOLLOW_UP",
  ];

  return Array.from({ length: 42 }, (_, index) => {
    const caseItem = cases[index % cases.length];
    const hoursAgo = 1 + index * 2;

    return {
      id: `activity-${index + 1}`,
      occurredAt: isoHoursAgo(hoursAgo),
      type: types[index % types.length],
      caseRef: caseItem.caseRef,
      actor: activityActors[index % activityActors.length],
      note:
        index % 3 === 0
          ? "Kontakt dokumentiert, nächster Schritt terminiert."
          : "Status aktualisiert und Team informiert.",
    };
  });
}

function buildTasks(cases: PrototypeCase[]): PrototypeTask[] {
  const priorities: PrototypePriority[] = ["P1", "P2", "P3"];
  const statuses: PrototypeTask["status"][] = ["OPEN", "IN_PROGRESS", "DONE", "OPEN"];

  return Array.from({ length: 26 }, (_, index) => {
    const caseItem = cases[(index * 2) % cases.length];
    return {
      id: `task-${index + 1}`,
      title: index % 2 === 0 ? "Follow-up Termin bestätigen" : "Dokumentations-Review abschliessen",
      caseRef: caseItem.caseRef,
      owner: taskOwners[index % taskOwners.length],
      dueAt: isoHoursFromNow(index + 2),
      priority: priorities[index % priorities.length],
      status: statuses[index % statuses.length],
    };
  });
}

function buildSyncClients(): PrototypeSyncClient[] {
  return [
    { id: "sync-1", label: "Tablet Nord 1", owner: "Anna", lastSeenAt: isoHoursAgo(0.3), pendingEvents: 0, battery: 86 },
    { id: "sync-2", label: "Tablet Nord 2", owner: "Noah", lastSeenAt: isoHoursAgo(1.2), pendingEvents: 3, battery: 61 },
    { id: "sync-3", label: "Phone Intake", owner: "Samira", lastSeenAt: isoHoursAgo(0.5), pendingEvents: 1, battery: 44 },
    { id: "sync-4", label: "Laptop CaseMgmt", owner: "Jasmin", lastSeenAt: isoHoursAgo(2.4), pendingEvents: 0, battery: 100 },
    { id: "sync-5", label: "Tablet Medical", owner: "Eva", lastSeenAt: isoHoursAgo(3.1), pendingEvents: 7, battery: 27 },
    { id: "sync-6", label: "Night Shift A", owner: "Jonas", lastSeenAt: isoHoursAgo(4.8), pendingEvents: 4, battery: 33 },
  ];
}

export function getPrototypeSnapshot(): PrototypeSnapshot {
  const cases = buildCases();
  const activities = buildActivities(cases);
  const tasks = buildTasks(cases);
  const syncClients = buildSyncClients();

  const occupancy = [
    { site: "Haus A", capacity: 32, occupied: 29 },
    { site: "Haus B", capacity: 24, occupied: 20 },
    { site: "Notaufnahme Nacht", capacity: 12, occupied: 11 },
    { site: "Übergang Wohnen", capacity: 18, occupied: 14 },
  ];

  const totalCapacity = occupancy.reduce((sum, item) => sum + item.capacity, 0);
  const totalOccupied = occupancy.reduce((sum, item) => sum + item.occupied, 0);

  return {
    generatedAt: new Date().toISOString(),
    kpis: {
      activeCases: cases.filter((item) => item.status === "ACTIVE" || item.status === "INTAKE").length,
      openTasks: tasks.filter((item) => item.status !== "DONE").length,
      highRiskCases: cases.filter((item) => item.riskLevel === "HIGH").length,
      pendingSyncEvents: syncClients.reduce((sum, client) => sum + client.pendingEvents, 0),
      occupancyRate: Math.round((totalOccupied / totalCapacity) * 100),
    },
    occupancy,
    cases,
    activities,
    tasks,
    syncClients,
  };
}
