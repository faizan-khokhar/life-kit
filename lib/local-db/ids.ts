/** Client-generated entity ids (used as Firestore document ids). */
export function newEntityId(): string {
  return crypto.randomUUID();
}
