export type MatchPreferences = {
  skills?: string[] | null;
  preferredCategories?: string[] | null;
  minimumHourlyPay?: number | null;
  preferredLocation?: string | null;
};

export type MatchJob = {
  category?: string | null;
  pay?: number | null;
  location?: string | null;
  requirements?: string[] | null;
  description?: string | null;
};

export type MatchResult = {
  score: number;
  reasons: string[];
  missingProfileData: boolean;
};

/**
 * Transparent rule-based fit score, not an AI/ML prediction.
 * Only dimensions with usable profile and job data contribute to the denominator.
 */
export function calculateJobMatch(
  preferences: MatchPreferences,
  job: MatchJob,
): MatchResult {
  let earned = 0;
  let possible = 0;
  const reasons: string[] = [];
  const skills = (preferences.skills ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);
  const requirements = (job.requirements ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);
  const description = (job.description ?? "").toLowerCase();
  const category = (job.category ?? "").trim();
  const preferredCategories = (preferences.preferredCategories ?? []).map((value) => value.toLowerCase());
  const minimumPay = preferences.minimumHourlyPay;
  const location = (preferences.preferredLocation ?? "").trim().toLowerCase();
  const jobLocation = (job.location ?? "").trim().toLowerCase();

  if (skills.length && (requirements.length || description)) {
    possible += 35;
    const matched = skills.filter((skill) => requirements.includes(skill) || description.includes(skill));
    const ratio = matched.length / Math.max(skills.length, 1);
    earned += 35 * ratio;
    if (matched.length) reasons.push(`Skills match: ${matched.slice(0, 3).join(", ")}`);
  }

  if (category && preferredCategories.length) {
    possible += 25;
    if (preferredCategories.includes(category.toLowerCase())) {
      earned += 25;
      reasons.push(`Matches your preferred ${category} category`);
    }
  }

  if (typeof minimumPay === "number" && typeof job.pay === "number") {
    possible += 25;
    if (job.pay >= minimumPay) {
      earned += 25;
      reasons.push(`Pay meets your ₹${minimumPay}/hr minimum`);
    }
  }

  if (location && jobLocation) {
    possible += 15;
    if (jobLocation.includes(location) || location.includes(jobLocation)) {
      earned += 15;
      reasons.push(`Location matches your preference: ${job.location}`);
    }
  }

  return {
    score: possible ? Math.round((earned / possible) * 100) : 0,
    reasons,
    missingProfileData: possible === 0,
  };
}
