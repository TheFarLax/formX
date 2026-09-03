import Link from 'next/link';
import { Placeholder, Prose } from '@/components/ui/prose';
import { LAST_UPDATED, LEGAL_PLACEHOLDERS, LEGAL_VERSIONS } from '@/lib/legal';
import { REWARD } from '@/lib/site';

/**
 * Terms & Conditions for survey participation.
 *
 * Scoped to this survey and its thank-you reward. No XASRI AI product terms, no
 * invented company details, no claimed feature set for XASRI AI Pro.
 */
export function TermsAndConditions() {
  return (
    <Prose>
      <p className="text-ink-3">
        Version <code>{LEGAL_VERSIONS.terms}</code> · Last updated {LAST_UPDATED}
      </p>

      <p>
        These terms apply to taking part in the XASRI AI user research survey and to the participant
        reward described below. They do not cover the use of any XASRI AI product, which is governed
        by its own terms.
      </p>

      <h2>1. Participation</h2>
      <ul>
        <li>Taking part is voluntary and free. There is nothing to buy.</li>
        <li>
          You may stop at any time. Nothing is recorded until you submit — your progress is saved
          only in your own browser until then.
        </li>
        <li>
          By submitting you agree to these terms and confirm you have read the{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </li>
        <li>
          Eligibility restrictions may apply:{' '}
          <Placeholder>{LEGAL_PLACEHOLDERS.eligibilityRestrictions}</Placeholder>.
        </li>
      </ul>

      <h2>2. Accurate information</h2>
      <p>
        Please answer honestly and from your own experience — the whole point of the survey is that
        the answers are real. Your email address must be one you control and can receive mail at,
        because it is the only route by which a selected participant can be contacted. Submissions
        that are fabricated, machine-generated, or contain someone else&apos;s contact details may be
        excluded from the research and from the reward pool.
      </p>

      <h2>3. One entry per person</h2>
      <p>
        Each person may submit one response. Duplicate submissions from the same email address are
        rejected automatically. Attempting to enter repeatedly using additional email addresses makes
        every associated entry ineligible.
      </p>

      <h2>4. Participant reward</h2>
      <p>
        {REWARD.participantCount} participants will be selected to receive {REWARD.prize} at no cost.
        The reward is exactly that: one month of XASRI AI Pro. No other benefit, product, discount or
        guarantee is offered, and no specific Pro capability is promised by these terms.
      </p>
      <p>
        Submitting the survey does not guarantee a reward. Participation is an entry into a random
        selection, not a purchase and not an agreement to supply anything.
      </p>

      <h2>5. Random selection</h2>
      <p>
        Selection is random among eligible participants and is carried out by XASRI after the
        research period closes. The content, length or tone of your answers has no effect on whether
        you are selected. Selection is performed and recorded privately; results are not published.
      </p>
      <p>
        A participant is eligible if they submitted a complete response, confirmed they had read the
        reward information, provided a valid email address, and have not been excluded under
        section&nbsp;3 or section&nbsp;7.
      </p>

      <h2>6. Notification and access</h2>
      <ul>
        <li>
          Selected participants are contacted at the email address they submitted, within{' '}
          <Placeholder>{LEGAL_PLACEHOLDERS.notificationWindow}</Placeholder>.
        </li>
        <li>
          If a selected participant cannot be reached, or does not respond within{' '}
          <Placeholder>{LEGAL_PLACEHOLDERS.claimWindow}</Placeholder>, XASRI may select a replacement.
        </li>
        <li>
          The reward is personal to the participant, and cannot be transferred, sold, or exchanged for
          money.
        </li>
        <li>
          Promotional access lasts one month and{' '}
          <strong>does not automatically continue as a paid subscription</strong>. Continuing beyond
          the month is entirely your choice.
        </li>
        <li>
          If XASRI AI Pro is unavailable for reasons outside XASRI&apos;s control, XASRI may provide
          equivalent access instead, or withdraw the reward and say so.
        </li>
      </ul>

      <h2>7. Fraud and abuse</h2>
      <p>
        XASRI may exclude a submission, remove it from the research set, and withdraw or refuse a
        reward where there is reasonable evidence of automated submission, bulk or scripted entry,
        multiple entries by one person, impersonation, or use of an email address the submitter does
        not control. Automated and duplicate submissions are limited technically as well, and a small
        amount of technical information is retained briefly for that purpose — see the{' '}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>8. Use of your answers</h2>
      <p>
        You keep whatever rights you have in what you write. By submitting, you give XASRI permission
        to read, analyse and act on your answers for research and product decisions, and to quote them
        in aggregate or anonymised form. Nothing you write will be published in a way that identifies
        you, and your email address and any link you provide are never published at all.
      </p>
      <p>
        Please do not include confidential information, credentials, or anything you are not free to
        share.
      </p>

      <h2>9. Changes and availability</h2>
      <p>
        XASRI may correct, update or close the survey at any time, and may amend these terms. The
        version recorded against your response is the one that was in effect when you submitted.
      </p>

      <h2>10. Liability and applicable law</h2>
      <p>
        The survey is provided as is. To the extent permitted by law, XASRI is not liable for
        indirect or consequential loss arising from participation. Nothing here limits any liability
        that cannot lawfully be limited.
      </p>
      <p>
        These terms are governed by <Placeholder>{LEGAL_PLACEHOLDERS.governingLaw}</Placeholder>. The
        contracting entity is <Placeholder>{LEGAL_PLACEHOLDERS.legalEntity}</Placeholder>,{' '}
        <Placeholder>{LEGAL_PLACEHOLDERS.registeredAddress}</Placeholder>. Questions about these
        terms: <Placeholder>{LEGAL_PLACEHOLDERS.generalContact}</Placeholder>.
      </p>

      <p className="!mt-8 text-note text-ink-3">
        Bracketed values above are placeholders that XASRI must complete before launch. These terms
        are a starting point drafted for a research survey, not legal advice, and no claim is made
        that they satisfy the requirements of any particular jurisdiction.
      </p>


    </Prose>
  );
}
