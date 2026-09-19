/** Short unique id for locally stored records. Not meant to be secret. */
export function createId(now: number = Date.now()): string {
  const random = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
  return `${now.toString(36)}-${random}`;
}
