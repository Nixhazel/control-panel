/**
 * localStorage persistence for DCS simulator attempts.
 */

import type { StoredAttempt, PersonalityTraits } from "@/types/gameTypes";

const STORAGE_KEY = "dcs-simulator-results";

export function loadAttempts(): StoredAttempt[] {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredAttempt[];
  } catch {
    return [];
  }
}

export function saveAttempt(attempt: Omit<StoredAttempt, "id">): void {
  try {
    const id = `dcs-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const withId: StoredAttempt = { ...attempt, id };
    const existing = loadAttempts();
    existing.unshift(withId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    }
  } catch {
    // ignore
  }
}

export function clearAttempts(): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function buildStoredAttempt(
  finalScore: number,
  accuracy: number,
  averageReaction: number,
  personality: PersonalityTraits,
  classification: string,
  status: "PASS" | "FAIL"
): Omit<StoredAttempt, "id"> {
  return {
    date: new Date().toISOString(),
    finalScore,
    accuracy,
    averageReaction,
    personality,
    classification: classification as StoredAttempt["classification"],
    status,
  };
}
