/**
 * Legal document versions and the details XASRI must supply before launch.
 *
 * Version strings are stamped onto every stored response *from the server*, never
 * from the request body, so a participant cannot be recorded as having accepted a
 * version that was not the one served to them. Bump the relevant string whenever
 * the corresponding document changes materially.
 */

export const LEGAL_VERSIONS = {
  terms: '2026-09-02.1',
  privacy: '2026-09-02.1',
  rewardRules: '2026-09-02.1',
} as const;

export const LAST_UPDATED = '2 September 2026';

/**
 * Deliberate placeholders. These are rendered on the published pages exactly as
 * written, in square brackets, so an unfilled value is impossible to miss during
 * review. Nothing here is invented — XASRI must supply each one before launch.
 */
export const LEGAL_PLACEHOLDERS = {
  legalEntity: '[XASRI legal entity name]',
  registeredAddress: '[XASRI registered address]',
  privacyContact: '[privacy contact email]',
  generalContact: '[general contact email]',
  dataProtectionContact: '[data protection contact, if appointed]',
  governingLaw: '[governing law and jurisdiction]',
  retentionPeriod: '[retention period]',
  hostingRegion: '[data hosting region]',
  eligibilityRestrictions: '[age and territory eligibility restrictions]',
  notificationWindow: '[notification window]',
  claimWindow: '[claim window]',
} as const;

export type LegalPlaceholderKey = keyof typeof LEGAL_PLACEHOLDERS;
