export type LockDays = 7 | 30 | 90 | 180 | 365;

export interface Challenge {
  days: LockDays;
  name: string;
  emoji: string;
  tagline: string;
  vibe: string; // gradient class from design system
}

export const CHALLENGES: Challenge[] = [
  { days: 7,   name: "7-Day Starter",   emoji: "🌱", tagline: "Test the waters",         vibe: "bg-grad-activity" },
  { days: 30,  name: "30-Day Builder",  emoji: "🔨", tagline: "Build the habit",         vibe: "bg-grad-airtime" },
  { days: 90,  name: "90-Day Semester", emoji: "📚", tagline: "One full semester",       vibe: "bg-grad-collections" },
  { days: 180, name: "180-Day Planner", emoji: "🗺️", tagline: "Halfway to graduation",   vibe: "bg-grad-ajo" },
  { days: 365, name: "365-Day Graduate",emoji: "🎓", tagline: "Full academic year",      vibe: "bg-grad-merchants" },
];

export const challengeFor = (days: number) =>
  CHALLENGES.find((c) => c.days === days) ?? CHALLENGES[0];

export const fmtUSD = (n: number) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtNGN = (n: number) =>
  `₦${Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
