/**
 * Deterministic-friendly random adjustments for simulation values.
 * Uses Math.random() but logic is reproducible for same seed behavior in memory.
 */

const CLAMP = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

/** Random float in [min, max] */
export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Random int in [min, max] inclusive */
export function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 0.999));
}

/** Random chance 0-1, returns true if random() < chance */
export function randomChance(chance: number): boolean {
  return Math.random() < chance;
}

/** Nudge value by ±delta, clamped to [0, 100] */
export function nudgeValue(value: number, delta: number): number {
  const change = randomInRange(-delta, delta);
  return CLAMP(value + change, 0, 100);
}

/** Force a spike: move value toward target by amount (for temp, generator etc) */
export function spikeToward(value: number, target: number, amount: number): number {
  const diff = target - value;
  const move = Math.sign(diff) * Math.min(Math.abs(diff), amount);
  return CLAMP(value + move, 0, 100);
}
