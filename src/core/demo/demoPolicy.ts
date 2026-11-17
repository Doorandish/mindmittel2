/** Author address used for the baseline sample policies seeded into the public demo. */
export const DEMO_SEED_AUTHOR_EMAIL = 'governance-board@mindmittel.de';

/**
 * Seeded demo policies are read-only so that one visitor cannot empty the
 * public demo for everyone else. Visitor-created documents stay editable.
 */
export function isProtectedDemoDocument(doc: { createdByEmail?: string | null }): boolean {
  return (doc.createdByEmail ?? '').trim().toLowerCase() === DEMO_SEED_AUTHOR_EMAIL;
}
