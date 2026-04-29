export type ArcadeTone = "teal" | "orange" | "purple" | "blue" | "red";

export interface ArcadeStat {
  label: string;
  value: string;
  detail?: string;
}

export interface ArcadeGamebreaker {
  level: 1 | 2 | 3;
  label: string;
  detail: string;
}

export interface ArcadeRouteMeta {
  href: string;
  label: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: string;
  tone: ArcadeTone;
  stats: ArcadeStat[];
  gamebreaker?: ArcadeGamebreaker;
}

export const arcadeRoutes: ArcadeRouteMeta[] = [
  {
    href: "/overview",
    label: "Overview",
    eyebrow: "Quarter Start",
    title: "Company Film Room",
    subtitle: "Full-roster read on reach, conversion, assists, and trust gravity.",
    accent: "Tipoff",
    tone: "orange",
    stats: [
      { label: "Mode", value: "90D" },
      { label: "Read", value: "Company" },
      { label: "Signal", value: "All" },
    ],
    gamebreaker: {
      level: 2,
      label: "Full-Court Read",
      detail: "Company, roster, surface, and post layers are live.",
    },
  },
  {
    href: "/court-heat",
    label: "Court Heat",
    eyebrow: "Zone Control",
    title: "Intent Heat Map",
    subtitle: "Volume and efficiency by offensive region without moving the floor.",
    accent: "Hot Zones",
    tone: "red",
    stats: [
      { label: "Map", value: "Intent" },
      { label: "Color", value: "Mode" },
      { label: "Panel", value: "Region" },
    ],
  },
  {
    href: "/shot-plot",
    label: "Shot Plot",
    eyebrow: "Shot Chart",
    title: "Post Landing Map",
    subtitle: "Position by intent, color by platform, brightness by recency.",
    accent: "Live Dots",
    tone: "teal",
    stats: [
      { label: "X", value: "Intent" },
      { label: "Hue", value: "Surface" },
      { label: "Glow", value: "Time" },
    ],
    gamebreaker: {
      level: 1,
      label: "Visual Layer",
      detail: "The court renders existing classifications only.",
    },
  },
  {
    href: "/shot-zones",
    label: "Shot Zones",
    eyebrow: "Loadout",
    title: "Zone Playbook",
    subtitle: "Surface and motion groups ranked by what they set up.",
    accent: "Best Use",
    tone: "purple",
    stats: [
      { label: "Sort", value: "TS%" },
      { label: "Mode", value: "Zones" },
      { label: "Plays", value: "Linked" },
    ],
  },
  {
    href: "/stream",
    label: "Stream",
    eyebrow: "Replay Chain",
    title: "Ripple Stream",
    subtitle: "Root posts, teammate assists, external echoes, and conversions.",
    accent: "Replay",
    tone: "blue",
    stats: [
      { label: "Timeline", value: "Live" },
      { label: "Filter", value: "Event" },
      { label: "Chain", value: "Root" },
    ],
  },
  {
    href: "/splits",
    label: "Splits",
    eyebrow: "Box Score",
    title: "Advanced Splits",
    subtitle: "NBA-style tables for surface, player, archetype, content, and campaign reads.",
    accent: "Table Mode",
    tone: "teal",
    stats: [
      { label: "Rows", value: "Dynamic" },
      { label: "Cut", value: "5" },
      { label: "Stats", value: "Full" },
    ],
  },
  {
    href: "/players",
    label: "Players",
    eyebrow: "Roster Select",
    title: "Surface IQ Roster",
    subtitle: "Player cards, signature moves, surface coverage, and role-specific spacing.",
    accent: "Roster",
    tone: "orange",
    stats: [
      { label: "View", value: "Cards" },
      { label: "Role", value: "Active" },
      { label: "Rank", value: "Off" },
    ],
  },
  {
    href: "/plays",
    label: "Plays",
    eyebrow: "Motion Lab",
    title: "Playbook",
    subtitle: "Reusable growth motions and the next experiments worth running.",
    accent: "Practice",
    tone: "purple",
    stats: [
      { label: "Cards", value: "Plays" },
      { label: "Tests", value: "Next" },
      { label: "Motion", value: "Active" },
    ],
  },
  {
    href: "/attribution",
    label: "Attribution",
    eyebrow: "Signal Integrity",
    title: "Confidence Stack",
    subtitle: "Direct, estimated, modeled, and internal-analytics requirements.",
    accent: "Proof",
    tone: "blue",
    stats: [
      { label: "Sources", value: "4" },
      { label: "Badges", value: "5" },
      { label: "Mocks", value: "Marked" },
    ],
  },
  {
    href: "/acquisition",
    label: "Acquisition",
    eyebrow: "Connector Bay",
    title: "Signal Capture",
    subtitle: "Routes, providers, raw activity, and canonical ingestion readiness.",
    accent: "Pipeline",
    tone: "red",
    stats: [
      { label: "Path", value: "Canonical" },
      { label: "Jobs", value: "Routed" },
      { label: "Raw", value: "Stored" },
    ],
  },
];

export function arcadeMetaForPath(pathname: string) {
  return arcadeRoutes.find((route) => pathname === route.href || pathname.startsWith(`${route.href}/`)) ?? arcadeRoutes[0];
}
