import type { Metadata } from 'next';
import { DocumentPage } from '@/components/document-page';
import { PrivacyPolicy } from '@/content/privacy';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'What the XASRI AI user research survey collects, why it is collected, how it is stored, how long it is kept, and your rights.',
};

export default function PrivacyPage() {
  return (
    <DocumentPage
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="What this survey collects, why, and what happens to it afterwards."
    >
      <PrivacyPolicy />
    </DocumentPage>
  );
}
