import type { Metadata } from 'next';
import { DocumentPage } from '@/components/document-page';
import { RewardDetails } from '@/content/reward';
import { REWARD } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Participant Reward',
  description: `${REWARD.participantCount} randomly selected survey participants receive ${REWARD.prize} at no cost. Conditions and selection process.`,
};

export default function RewardPage() {
  return (
    <DocumentPage
      eyebrow="Thank-you reward"
      title="Participant reward details"
      intro={`${REWARD.participantCount} randomly selected participants may receive ${REWARD.prize} at no cost. Here is exactly how that works.`}
    >
      <RewardDetails />
    </DocumentPage>
  );
}
