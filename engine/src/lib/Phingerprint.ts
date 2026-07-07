/**
 * Phingerprint - a deterministic content fingerprint (ADR 0011).
 * The canonical (recursively key-sorted) JSON of a value, hashed with FNV-1a.
 * Used to identify a universe by its Phormulae: same rules -> same Phingerprint,
 * different rules -> different Phingerprint, regardless of authoring/key order.
 *
 * Not cryptographic - a collision-cheap identity for the Ω-first trust model (ADR 0011);
 * the 32-bit width is wideable later without changing callers.
 * Pure and dependency-free (ADR 0003 integer style via Math.imul).
 */
export function phingerprint(value: unknown): string {
  return fnv1a(canonicalJSON(value));
}

/**
 * JSON with object keys sorted recursively, so equal content hashes equally.
 * Array order stays significant (it is meaningful for e.g. cost lists).
 */
export function canonicalJSON(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJSON).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJSON(record[k])}`).join(',')}}`;
}

function fnv1a(str: string): string {
  let hash = 0x811c9dc5; // FNV-1a 32-bit offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime, kept in 32-bit
  }
  // unsigned 32-bit, zero-padded hex
  return (hash >>> 0).toString(16).padStart(8, '0');
}
