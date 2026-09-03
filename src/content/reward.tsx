import Link from 'next/link';
import { Placeholder, Prose } from '@/components/ui/prose';
import { LEGAL_PLACEHOLDERS, LEGAL_VERSIONS } from '@/lib/legal';
import { REWARD } from '@/lib/site';

/**
 * Participant reward conditions. Rendered identically in the landing-page modal
 * and on /reward, so the two can never say different things.
 *
 * Deliberately describes the reward as "one month of XASRI AI Pro" and nothing
 * more: no feature list, no comparison table, no capability claims.
 */
export function RewardDetails() {
  return (
    <Prose>
      <p>
        As a thank you for taking part, {REWARD.participantCount} randomly selected participants
        will receive {REWARD.prize} at no cost.
      </p>

      <h2>Conditions</h2>
      <ul>
        <li>
          <strong>{REWARD.participantCount} participants</strong> will be selected in total.
        </li>
        <li>
          <strong>Selection is random</strong> among eligible participants. Answer quality, length
          and content play no part in it.
        </li>
        <li>
          The reward is <strong>{REWARD.prize}</strong>.
        </li>
        <li>
          A <strong>valid email address is required</strong>, because it is the only way selected
          participants can be contacted.
        </li>
        <li>
          <strong>One entry per person.</strong> Duplicate or automated submissions are removed
          before selection.
        </li>
        <li>
          Promotional access <strong>does not automatically become a paid subscription</strong>. It
          ends when the month ends unless you separately choose to subscribe.
        </li>
        <li>
          Eligibility restrictions may apply: <Placeholder>{LEGAL_PLACEHOLDERS.eligibilityRestrictions}</Placeholder>.
        </li>
      </ul>

      <h2>Selection and notification</h2>
      <p>
        Selection happens after the research period closes. Selected participants are contacted at
        the email address they provided, within{' '}
        <Placeholder>{LEGAL_PLACEHOLDERS.notificationWindow}</Placeholder>. If a selected
        participant does not respond within{' '}
        <Placeholder>{LEGAL_PLACEHOLDERS.claimWindow}</Placeholder>, XASRI may select a replacement.
      </p>
      <p>
        Participant emails and reward records are private. They are never published, shown on this
        website, or shared with anyone outside XASRI.
      </p>

      <h2>Why the reward exists</h2>
      <p>
        Your feedback is the reason we are doing this. The Pro access is simply our way of thanking
        selected participants for taking the time to share their experience — it is not a prize
        draw, a promotion, or a sale.
      </p>

      <p className="!mt-8 text-note text-ink-3">
        These conditions form part of the{' '}
        <Link href="/terms">Terms &amp; Conditions</Link>. Data handling is described in the{' '}
        <Link href="/privacy">Privacy Policy</Link>. Reward rules version{' '}
        <code>{LEGAL_VERSIONS.rewardRules}</code>.
      </p>
    </Prose>
  );
}
