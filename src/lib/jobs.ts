export type JobListing = {
  id: string;
  title: string;
  company: string;
  pay: number;
  location?: string;
  distance?: string;
  time: string;
  day: string;
  match?: number;
  icon: string;
  category: string;
  workMode: string;
  shiftType: string;
  description: string;
  requirements: string[];
  workersNeeded?: number;
  status?: "active" | "closed";
  source?: "demo" | "database";
};

export type DatabaseJobRow = {
  id: string;
  owner_id: string;
  title: string;
  company: string;
  pay: number;
  location: string;
  shift_day: string;
  shift_time: string;
  category: string;
  work_mode: string;
  shift_type: string;
  description: string;
  requirements: string[] | null;
  workers_needed: number;
  status: "active" | "closed";
  created_at: string;
  updated_at: string;
};

export function iconForCategory(category: string): string {
  const icons: Record<string, string> = {
    Retail: "🛒",
    Hospitality: "🍔",
    Operations: "📦",
    Creative: "📱",
    Tutoring: "📚",
    Events: "🎟️",
    Delivery: "🛵",
    Other: "💼",
  };
  return icons[category] || "💼";
}

export function databaseRowToJob(row: DatabaseJobRow): JobListing {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    pay: Number(row.pay),
    location: row.location,
    time: row.shift_time,
    day: row.shift_day,
    icon: iconForCategory(row.category),
    category: row.category,
    workMode: row.work_mode,
    shiftType: row.shift_type,
    description: row.description,
    requirements: Array.isArray(row.requirements) ? row.requirements : [],
    workersNeeded: row.workers_needed,
    status: row.status,
    source: "database",
  };
}
