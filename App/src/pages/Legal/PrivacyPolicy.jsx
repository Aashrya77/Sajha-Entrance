import React from 'react';
import LegalPageLayout from './LegalPageLayout';

const highlights = [
  {
    title: 'What We Collect',
    description: 'We collect the information you submit through forms, student accounts, newsletter subscriptions, purchases, and support requests.',
  },
  {
    title: 'Why We Use It',
    description: 'Your data helps us deliver classes, process orders, communicate with students, improve services, and keep the platform secure.',
  },
  {
    title: 'Your Choices',
    description: 'You can ask us to update your information, opt out of promotional messages, or contact us with privacy-related concerns.',
  },
];

const sections = [
  {
    title: 'Information We Collect',
    paragraphs: [
      'We may collect personal information that you provide directly to us when you register, fill out inquiry forms, subscribe to newsletters, purchase books or courses, or contact our team.',
    ],
    bullets: [
      'Identity and contact details such as name, phone number, email address, and address.',
      'Academic or service-related details such as preferred course, college name, messages, enrollment interests, and mock-test activity.',
      'Transaction or account details related to purchases, registrations, order history, and payment confirmations.',
      'Technical data such as browser type, device information, approximate location, usage patterns, and local storage or session data used to keep the website working.',
    ],
  },
  {
    title: 'How We Use Your Information',
    paragraphs: [
      'We use collected information to operate the website, deliver student services, respond to inquiries, process enrollments and purchases, and provide academic support.',
    ],
    bullets: [
      'To create and manage student accounts.',
      'To send course updates, mock-test notices, order confirmations, and support responses.',
      'To improve website performance, service quality, and student experience.',
      'To detect fraud, misuse, security threats, or violations of our policies.',
      'To comply with applicable legal obligations or legitimate business requirements.',
    ],
  },
  {
    title: 'Cookies, Local Storage, and Similar Tools',
    paragraphs: [
      'We may use cookies, browser storage, and similar technologies to keep you signed in, remember basic preferences, analyze site usage, and improve performance.',
      'For example, student authentication information may be stored locally in your browser so you can continue using protected features without signing in repeatedly.',
    ],
  },
  {
    title: 'How We Share Information',
    paragraphs: [
      'We do not sell your personal information. We only share information when it is necessary to deliver services, operate the website, or comply with legal requirements.',
    ],
    bullets: [
      'With staff members, teachers, or support personnel who need the information to assist students.',
      'With trusted service providers such as payment processors, hosting providers, communication tools, or delivery partners acting on our behalf.',
      'With authorities or other parties when required by law, regulation, court order, or to protect our rights, users, and systems.',
    ],
  },
  {
    title: 'Data Retention and Security',
    paragraphs: [
      'We retain personal information only for as long as it is reasonably needed for the purposes described in this policy, including academic support, service records, legal compliance, and dispute resolution.',
      'We use reasonable administrative and technical safeguards to protect your information, but no system can guarantee absolute security. You should also take care to protect your own devices and account credentials.',
    ],
  },
  {
    title: 'Your Rights and Choices',
    paragraphs: [
      'You may contact us to review, correct, or update the personal information you have shared with us. You can also unsubscribe from marketing emails or ask us to stop promotional communications.',
      'If you would like us to delete information connected to an inquiry or account, we will review the request and respond in line with our legal, educational, and operational obligations.',
    ],
  },
  {
    title: 'Children and Student Privacy',
    paragraphs: [
      'Many of our users are students. When information is submitted by or for younger students, parents or guardians should review the details being shared and help ensure that the information is accurate.',
      'If you believe a child has provided personal information inappropriately, please contact us so we can review the situation and take appropriate action.',
    ],
  },
  {
    title: 'Policy Updates',
    paragraphs: [
      'We may update this Privacy Policy from time to time to reflect service changes, legal requirements, or operational improvements. The latest version will always be posted on this page with the updated effective date.',
    ],
  },
];

const PrivacyPolicy = () => {
  return (
    <LegalPageLayout
      eyebrow="Privacy"
      title="Privacy Policy"
      subtitle="This page explains what information Sajha Entrance collects, how we use it, when we share it, and what choices you have."
      lastUpdated="April 25, 2026"
      highlights={highlights}
      sections={sections}
    />
  );
};

export default PrivacyPolicy;
