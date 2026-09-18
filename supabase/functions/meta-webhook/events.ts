type WebhookRecord = Record<string, unknown>;

export function revokedExternalAccountIds(payload: unknown): string[] {
  if (!isRecord(payload) || !Array.isArray(payload.entry)) return [];

  const ids = new Set<string>();
  for (const candidate of payload.entry) {
    if (!isRecord(candidate) || !hasExplicitRevocation(candidate.changes)) continue;

    const id = candidate.id;
    if (typeof id === 'string' || typeof id === 'number') ids.add(String(id));
  }
  return [...ids];
}

function hasExplicitRevocation(changes: unknown): boolean {
  if (!Array.isArray(changes)) return false;

  return changes.some((candidate) => {
    if (!isRecord(candidate)) return false;
    if (candidate.field === 'deauthorization') return true;
    if (candidate.field !== 'permissions' || !isRecord(candidate.value)) return false;
    return candidate.value.verb === 'remove';
  });
}

function isRecord(value: unknown): value is WebhookRecord {
  return typeof value === 'object' && value !== null;
}
