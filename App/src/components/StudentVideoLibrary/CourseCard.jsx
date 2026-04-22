import React from 'react';

const CardOverlay = ({ overlay, ariaLabel }) => {
  if (!overlay) {
    return null;
  }

  if (overlay.type === 'link') {
    if (overlay.disabled || !overlay.href) {
      return <span className="video-library-card__hit-area is-disabled" aria-hidden="true" />;
    }

    return (
      <a
        href={overlay.href}
        target="_blank"
        rel="noopener noreferrer"
        className="video-library-card__hit-area"
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <button
      type="button"
      className="video-library-card__hit-area"
      onClick={overlay.onClick}
      aria-label={ariaLabel}
      disabled={overlay.disabled}
    />
  );
};

const CardAction = ({ action, tone }) => {
  if (!action) {
    return null;
  }

  const className = [
    'video-library-card__action',
    `is-${tone}`,
    action.disabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {action.iconClass && <i className={action.iconClass} aria-hidden="true"></i>}
      <span>{action.label}</span>
    </>
  );

  if (action.href && !action.disabled) {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  if (typeof action.onClick === 'function') {
    return (
      <button type="button" className={className} onClick={action.onClick} disabled={action.disabled}>
        {content}
      </button>
    );
  }

  return (
    <span className={className} aria-hidden="true">
      {content}
    </span>
  );
};

const CourseCard = ({
  overlay,
  thumbnail,
  imageAlt,
  title,
  category,
  categoryIconClass = 'fa-solid fa-book-open',
  categoryTone = 'is-subject',
  dateLabel,
  mediaBadge,
  primaryAction,
  secondaryAction,
  ariaLabel,
  className = '',
}) => {
  const cardClassName = [
    'video-library-card',
    overlay && !overlay.disabled ? 'is-clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClassName}>
      <CardOverlay overlay={overlay} ariaLabel={ariaLabel} />

      <div className="video-library-card__media">
        <img src={thumbnail} alt={imageAlt} loading="lazy" />

        {mediaBadge?.label && (
          <span
            className={[
              'video-library-card__media-badge',
              mediaBadge.className || '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {mediaBadge.iconClass && <i className={mediaBadge.iconClass} aria-hidden="true"></i>}
            <span>{mediaBadge.label}</span>
          </span>
        )}
      </div>

      <div className="video-library-card__body">
        <div className="video-library-card__meta">
          <span className={['video-library-pill', categoryTone].filter(Boolean).join(' ')}>
            {categoryIconClass && <i className={categoryIconClass} aria-hidden="true"></i>}
            <span>{category}</span>
          </span>
        </div>

        <h4 title={title}>{title}</h4>

        <div className="video-library-card__footer">
          <span className="video-library-card__date">
            <i className="fa-regular fa-calendar"></i>
            <span>{dateLabel}</span>
          </span>

          <div
            className={[
              'video-library-card__actions',
              secondaryAction ? 'has-secondary' : 'is-single',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <CardAction action={primaryAction} tone="primary" />
            {secondaryAction && <CardAction action={secondaryAction} tone="secondary" />}
          </div>
        </div>
      </div>
    </article>
  );
};

export default CourseCard;
