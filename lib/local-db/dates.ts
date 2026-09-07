/** Persist dates as ISO strings in IndexedDB; map to Date at domain boundaries. */

export function toIso(value: Date | string | number): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

export function fromIso(value: string | null | undefined): Date {
  if (!value) return new Date();
  return new Date(value);
}

export function fromIsoOrNull(value: string | null | undefined): Date | null {
  if (value == null) return null;
  return new Date(value);
}

export function nowIso(): string {
  return new Date().toISOString();
}
