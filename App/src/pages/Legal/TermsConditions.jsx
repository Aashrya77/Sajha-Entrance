import React from 'react';
import LegalPageLayout from './LegalPageLayout';

const highlights = [
  {
    title: 'Using Our Services',
    description: 'These terms apply when you browse the website, create a student account, join classes, buy books, or use mock tests.',
  },
  {
    title: 'Clear Expectations',
    description: 'Students must provide accurate information, protect account access, and avoid misuse of course material or platform features.',
  },
  {
    title: 'Payments & Support',
    description: 'Course fees, product purchases, and support requests are handled according to the instructions shared at the time of purchase or enrollment.',
  },
];

const sections = [
  {
    title: 'Acceptance of Terms',
    paragraphs: [
      'By accessing the Sajha Entrance website or using any of our educational services, you agree to these Terms & Conditions. If you do not agree with them, please stop using the website and related services.',
      'These terms apply to visitors, students, parents or guardians, and anyone who contacts us, subscribes to updates, purchases products, or uses our mock-test platform.',
    ],
  },
  {
    title: 'Educational Services',
    paragraphs: [
      'Sajha Entrance provides educational information, entrance preparation classes, mock tests, counselling support, blog content, book sales, and related student services. We work to keep information accurate and helpful, but course details, schedules, offers, and availability may change from time to time.',
      'Our guidance is intended to support student preparation. Admission, ranking, scholarship, or examination outcomes can never be guaranteed because they depend on many factors beyond our control.',
    ],
  },
  {
    title: 'Student Accounts and Responsibilities',
    paragraphs: [
      'If you create an account, you are responsible for keeping your login credentials secure and for ensuring that the information you submit is accurate and up to date.',
    ],
    bullets: [
      'Do not share your account access with others or allow unauthorized use.',
      'Use the platform only for lawful, personal, and educational purposes.',
      'Parents or guardians should supervise account use when a student is a minor.',
    ],
  },
  {
    title: 'Payments, Enrollments, and Product Orders',
    paragraphs: [
      'Some services on the website require payment, including course registrations, mock-test access, and book purchases. By making a payment, you confirm that the payment details you provide are valid and that you are authorized to use them.',
      'Refunds, transfers, delivery terms, and enrollment policies may differ by program or product. Where specific rules apply, the details shared during registration, invoice confirmation, or purchase checkout will control that transaction.',
    ],
    bullets: [
      'Orders and access may be delayed until payment is successfully confirmed.',
      'We may suspend or cancel access if a payment is reversed, disputed, or found to be fraudulent.',
      'Any delivery timelines shared for books or materials are estimates unless stated otherwise.',
    ],
  },
  {
    title: 'Acceptable Use',
    paragraphs: [
      'You may not misuse the website, courses, or mock-test systems. We reserve the right to limit, suspend, or terminate access if a user harms the platform, staff, or other students.',
    ],
    bullets: [
      'Do not copy, redistribute, record, resell, or publicly share course content, notes, videos, or mock-test questions without written permission.',
      'Do not attempt to interfere with site security, platform performance, rankings, or exam integrity.',
      'Do not submit abusive, defamatory, misleading, or unlawful content through forms, chat, comments, or support channels.',
    ],
  },
  {
    title: 'Intellectual Property',
    paragraphs: [
      'Unless otherwise stated, the website design, branding, text, graphics, mock-test content, study resources, and training materials belong to Sajha Entrance or are used with permission.',
      'You may view or print material for your own non-commercial learning use, but you may not reproduce, republish, modify, or distribute our material for business or public use without prior written consent.',
    ],
  },
  {
    title: 'Third-Party Services and Links',
    paragraphs: [
      'The website may connect to third-party services such as payment gateways, maps, social media, videos, and external educational resources. Those services operate under their own terms and privacy practices.',
      'We are not responsible for the content, availability, or security of third-party websites or tools that are not directly controlled by Sajha Entrance.',
    ],
  },
  {
    title: 'Availability, Liability, and Changes',
    paragraphs: [
      'We aim to keep the website and services available, but interruptions can happen because of maintenance, technical issues, third-party outages, or events beyond our reasonable control.',
      'To the maximum extent allowed by law, Sajha Entrance is not liable for indirect, incidental, or consequential losses arising from the use of the website or services. We may update these Terms & Conditions from time to time, and the revised version will be effective once published on this page.',
    ],
  },
];

const TermsConditions = () => {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Terms & Conditions"
      subtitle="These terms explain the rules for using Sajha Entrance website, student services, educational content, and online learning tools."
      lastUpdated="April 25, 2026"
      highlights={highlights}
      sections={sections}
    />
  );
};

export default TermsConditions;
