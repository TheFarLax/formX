/**
 * Brand constants and external links.
 *
 * The XASRI URLs were supplied by the company and are used verbatim. Do not
 * edit, normalise or "tidy" them.
 */

export const SITE = {
  brand: 'XASRI AI',
  headline: 'What is AI still failing to solve?',
  lede: "AI is becoming more capable, but there are still problems it doesn't solve reliably.",
  description:
    'XASRI AI wants to understand the real problems people face with AI today—and what they want AI to do better.',
  tagline: 'Building AI around real-world problems.',
  footerLine: 'Help Us Understand What AI Still Fails to Solve.',
  estimatedMinutes: '~3–4 minutes',
} as const;

export const XASRI_LINKS = {
  website: 'https://xasri.xyz/',
  x: 'https://x.com/xasrihq',
  linkedin: 'https://www.linkedin.com/company/xasri/',
  instagram: 'https://www.instagram.com/xasrihq?igsi=dzY5Yjd3ZTNkaWVk',
} as const;

export const SOCIAL_LINKS = [
  { label: 'X', href: XASRI_LINKS.x, name: 'X / Twitter' },
  { label: 'LinkedIn', href: XASRI_LINKS.linkedin, name: 'LinkedIn' },
  { label: 'Instagram', href: XASRI_LINKS.instagram, name: 'Instagram' },
] as const;

/** Reward terms. Kept in one place so page copy cannot contradict the rules. */
export const REWARD = {
  participantCount: 25,
  prize: 'one month of XASRI AI Pro',
  prizeTitleCase: 'One month of XASRI AI Pro',
} as const;
