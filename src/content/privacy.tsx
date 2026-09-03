import Link from 'next/link';
import { Placeholder, Prose } from '@/components/ui/prose';
import { LAST_UPDATED, LEGAL_PLACEHOLDERS, LEGAL_VERSIONS } from '@/lib/legal';
import { REWARD } from '@/lib/site';

/**
 * Privacy Policy.
 *
 * Describes only what this survey actually does. No company legal details are
 * invented — every such value is a bracketed placeholder XASRI must fill in, and
 * no claim of compliance with any particular regime is made.
 */
export function PrivacyPolicy() {
  return (
    <Prose>
      <p className="text-ink-3">
        Version <code>{LEGAL_VERSIONS.privacy}</code> · Last updated {LAST_UPDATED}
      </p>

      <p>
        This policy explains what the XASRI AI user research survey collects, why, and what happens
        to it afterwards. It covers this survey only.
      </p>

      <h2>Who is responsible</h2>
      <p>
        The survey is operated by <Placeholder>{LEGAL_PLACEHOLDERS.legalEntity}</Placeholder>,{' '}
        <Placeholder>{LEGAL_PLACEHOLDERS.registeredAddress}</Placeholder>. Questions about this
        policy can be sent to <Placeholder>{LEGAL_PLACEHOLDERS.privacyContact}</Placeholder>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Your survey answers.</strong> The questions you were shown and answered. Questions
          that were skipped because they did not apply to you are stored as empty, not guessed at.
        </li>
        <li>
          <strong>Your email address.</strong> Required, and used only as described below.
        </li>
        <li>
          <strong>Your country.</strong> Used to understand where problems with AI are being
          reported from.
        </li>
        <li>
          <strong>An optional link</strong> to a website, GitHub profile or portfolio, if you choose
          to provide one.
        </li>
        <li>
          <strong>Your consent choices</strong> and the version of the Terms, Privacy Policy and
          reward rules in effect when you submitted.
        </li>
        <li>
          <strong>A one-way hash of your IP address</strong>, kept briefly and separately, purely to
          limit automated and duplicate submissions. The address itself is never stored, and the
          hash cannot be linked back to your response.
        </li>
      </ul>
      <p>
        We do not ask for your name. We do not use advertising or analytics trackers on this site,
        and we do not build a profile of you.
      </p>

      <h2>Why we collect it</h2>
      <h3>Survey research</h3>
      <p>
        The answers are used to understand which problems people actually face with AI today, and
        which of them XASRI should work on. Findings may be summarised internally or published in
        aggregate. Published material never includes your email address, your link, or any free-text
        answer that could identify you.
      </p>

      <h3>Reward administration</h3>
      <p>
        {REWARD.participantCount} randomly selected participants receive {REWARD.prize}. Your email
        address is used to contact you if you are selected, and to check that a person has only
        entered once. Selection and reward records are private and are never published. Full
        conditions are in the <Link href="/reward">participant reward details</Link>.
      </p>

      <h3>Optional product communication</h3>
      <p>
        If you asked to receive XASRI AI beta-testing and product updates, we will use your email
        address for that as well. That consent is optional, it is not required to take part or to be
        eligible for the reward, and you can withdraw it at any time by contacting{' '}
        <Placeholder>{LEGAL_PLACEHOLDERS.privacyContact}</Placeholder>.
      </p>

      <h2>Storing your answers</h2>
      <p>
        Responses are stored in a managed PostgreSQL database hosted in{' '}
        <Placeholder>{LEGAL_PLACEHOLDERS.hostingRegion}</Placeholder>. Access is restricted to
        server-side credentials held by XASRI. The website itself has no read access at all: there is
        no public listing, no response feed, and no way for one participant to see another
        participant&apos;s answers or email address.
      </p>
      <p>
        While you are filling the survey in, your progress is saved in your own browser&apos;s local
        storage so a refresh does not lose your work. That draft never leaves your device until you
        submit, and it is deleted from your browser once your response has been recorded.
      </p>

      <h2>Data retention</h2>
      <p>
        Survey responses are kept for{' '}
        <Placeholder>{LEGAL_PLACEHOLDERS.retentionPeriod}</Placeholder>, after which they are deleted
        or reduced to anonymous aggregates. Rate-limiting hashes are deleted within seven days.
      </p>

      <h2>Sharing</h2>
      <p>
        We do not sell your data and we do not share it for advertising. It is shared only with the
        infrastructure providers needed to run the survey — hosting and the database — acting on
        XASRI&apos;s instructions, and where XASRI is legally required to disclose it.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask us to give you a copy of your response, correct it, or delete it. To do so,
        contact <Placeholder>{LEGAL_PLACEHOLDERS.privacyContact}</Placeholder> from the email address
        you submitted, which is how we confirm the request is yours. If you ask for deletion before
        selection takes place, your entry is removed from the reward pool as well.
      </p>
      <p>
        Depending on where you live, local law may give you further rights and may give you the right
        to complain to a supervisory authority. The applicable framework and the relevant authority
        are <Placeholder>{LEGAL_PLACEHOLDERS.governingLaw}</Placeholder>. Any data protection
        contact is <Placeholder>{LEGAL_PLACEHOLDERS.dataProtectionContact}</Placeholder>.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes materially, the version number above changes with it. The version
        recorded against your response is the one that was in effect when you submitted.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy: <Placeholder>{LEGAL_PLACEHOLDERS.privacyContact}</Placeholder>
        <br />
        General: <Placeholder>{LEGAL_PLACEHOLDERS.generalContact}</Placeholder>
      </p>

      <p className="!mt-8 text-note text-ink-3">
        Bracketed values above are placeholders that XASRI must complete before launch. This policy
        does not claim compliance with any specific legal framework; that assessment is for XASRI and
        its advisers to make.
      </p>


    </Prose>
  );
}
