/**
 * OEE = Availability * Performance * Quality
 */

// PUBLIC_INTERFACE
export function computeOee({ availability, performance, quality }) {
  /** Compute OEE and provide percent helpers. All inputs are 0..1 numbers. */
  const a = Number(availability ?? 0);
  const p = Number(performance ?? 0);
  const q = Number(quality ?? 0);
  const oee = Math.max(0, Math.min(1, a * p * q));
  return {
    availability: a,
    performance: p,
    quality: q,
    oee,
    pct: {
      availability: Math.round(a * 1000) / 10,
      performance: Math.round(p * 1000) / 10,
      quality: Math.round(q * 1000) / 10,
      oee: Math.round(oee * 1000) / 10,
    },
  };
}
