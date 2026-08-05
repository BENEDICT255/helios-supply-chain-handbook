import React from 'react';
import { Metadata } from 'next';
import PageHeader from '@/components/ui/PageHeader';
import ButtonLink from '@/components/ui/ButtonLink';
import { MailIcon, BuildingIcon, ClockSmallIcon, UserIcon } from '@/components/icons/Icons';
import { getSiteInformation } from '@/services/siteInfo';

export const metadata: Metadata = {
  title: 'Contact Supply Chain',
  description:
    'Get in touch with the Helios Towers Supply Chain team for guidance and assistance with procurement requests.',
};

export const revalidate = 0; // Dynamic server fetching

export default async function ContactPage() {
  let email = 'supplychain@example.com';
  let office = 'Supply Chain Department';
  let workingHours = 'Monday to Friday, 08:00–17:00';

  try {
    const siteInfo = await getSiteInformation();
    if (siteInfo) {
      email = siteInfo.contact_email || email;
      office = siteInfo.office || office;
      workingHours = siteInfo.working_hours || workingHours;
    }
  } catch (err) {
    console.error('Supabase fetch fallback for contact page:', err);
  }

  return (
    <>
      <PageHeader
        title="Contact Supply Chain"
        description="Contact the Supply Chain team when the handbook does not answer your question or when you need clarification about a procurement request."
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Details Card */}
          <div className="rounded-xl border border-[var(--border-grey)] bg-white p-6 shadow-xs space-y-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-grey)] pb-3">
              Team Contact Details
            </h2>

            <dl className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-[var(--pale-blue)] p-2 text-[var(--primary-blue)]">
                  <UserIcon size={18} />
                </div>
                <div>
                  <dt className="font-semibold text-[var(--text-primary)]">Team</dt>
                  <dd className="text-[var(--text-muted)]">Supply Chain Team</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-[var(--pale-blue)] p-2 text-[var(--primary-blue)]">
                  <MailIcon size={18} />
                </div>
                <div>
                  <dt className="font-semibold text-[var(--text-primary)]">Email</dt>
                  <dd className="text-[var(--text-muted)]">
                    <a
                      href={`mailto:${email}`}
                      className="text-[var(--primary-blue)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] rounded"
                    >
                      {email}
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-[var(--pale-blue)] p-2 text-[var(--primary-blue)]">
                  <BuildingIcon size={18} />
                </div>
                <div>
                  <dt className="font-semibold text-[var(--text-primary)]">Office</dt>
                  <dd className="text-[var(--text-muted)]">{office}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-[var(--pale-blue)] p-2 text-[var(--primary-blue)]">
                  <ClockSmallIcon size={18} />
                </div>
                <div>
                  <dt className="font-semibold text-[var(--text-primary)]">Working Hours</dt>
                  <dd className="text-[var(--text-muted)]">{workingHours}</dd>
                </div>
              </div>
            </dl>

            <div className="pt-4 flex flex-wrap gap-3">
              <ButtonLink href={`mailto:${email}`} variant="primary" id="contact-email-btn">
                Email Supply Chain
              </ButtonLink>
              <ButtonLink href="/faqs" variant="secondary" id="contact-faqs-btn">
                Browse FAQs
              </ButtonLink>
            </div>
          </div>

          {/* Checklist before contacting */}
          <div className="rounded-xl border border-[var(--border-grey)] bg-[var(--light-grey)] p-6 space-y-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-grey)] pb-3">
              Before contacting the team, please include:
            </h2>
            <ul className="space-y-3 text-sm text-[var(--text-muted)] list-disc pl-5">
              <li>Your name and department</li>
              <li>A clear description of the requirement</li>
              <li>The request or reference number, where available</li>
              <li>The required delivery date</li>
              <li>Any relevant supporting documents</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
