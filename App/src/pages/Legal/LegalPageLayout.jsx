import React from 'react';
import { Link } from 'react-router-dom';
import './legal.css';

const LegalPageLayout = ({
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  highlights,
  sections,
}) => {
  return (
    <div className="legal-page">
      <div className="container legal-container">
        <section className="legal-header">
          <span className="legal-eyebrow">{eyebrow}</span>
          <h1 className="legal-title">{title}</h1>
          <p className="legal-subtitle">{subtitle}</p>

          <div className="legal-meta">
            <span className="legal-meta-badge">Last updated: {lastUpdated}</span>
            <span className="legal-meta-text">Applies to Sajha Entrance website, classes, mock tests, and related student services.</span>
          </div>

          {highlights?.length ? (
            <ul className="legal-highlights">
              {highlights.map((highlight) => (
                <li key={highlight.title}>
                  <strong>{highlight.title}:</strong> {highlight.description}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="legal-body">
          {sections.map((section, index) => (
            <article className="legal-section" key={section.title}>
              <div className="legal-section-heading">
                <span className="legal-section-number">{index + 1}.</span>
                <h2>{section.title}</h2>
              </div>

              {section.paragraphs.map((paragraph) => (
                <p className="legal-copy" key={paragraph}>
                  {paragraph}
                </p>
              ))}

              {section.bullets?.length ? (
                <ul className="legal-list">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}

          <div className="legal-contact">
            <h3>Questions about this page?</h3>
            <p>
              Reach us through the <Link to="/contact">contact page</Link>, call
              {' '}
              <a href="tel:+9779860688212">+977 9860688212</a>, or email
              {' '}
              <a href="mailto:sajhaentrance01@gmail.com">sajhaentrance01@gmail.com</a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LegalPageLayout;
