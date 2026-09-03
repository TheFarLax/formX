import type { Metadata } from 'next';
import { DocumentPage } from '@/components/document-page';
import { TermsAndConditions } from '@/content/terms';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'Terms for taking part in the XASRI AI user research survey and for the participant reward.',
};

export default function TermsPage() {
  return (
    <DocumentPage
      eyebrow="Terms"
      title="Terms & Conditions"
      intro="The rules for taking part in the survey and for the thank-you reward."
    >
      <TermsAndConditions />
    </DocumentPage>
  );
}
