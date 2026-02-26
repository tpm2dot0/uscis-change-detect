import { createPatch } from 'diff';

/**
 * Recursively sort all object keys so that JSON.stringify
 * produces a canonical representation regardless of insertion order.
 */
export function sortKeys(val: unknown): unknown {
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(sortKeys);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(val as Record<string, unknown>).sort()) {
    sorted[key] = sortKeys((val as Record<string, unknown>)[key]);
  }
  return sorted;
}

/**
 * Compute a unified diff between two JSON objects.
 * Returns null if they are semantically identical (key-order-insensitive).
 */
export function computeDiff(
  label: string,
  oldObj: unknown,
  newObj: unknown
): string | null {
  const oldStr = JSON.stringify(sortKeys(oldObj), null, 2) + '\n';
  const newStr = JSON.stringify(sortKeys(newObj), null, 2) + '\n';
  if (oldStr === newStr) return null;
  return createPatch(label, oldStr, newStr, 'previous', 'current');
}
