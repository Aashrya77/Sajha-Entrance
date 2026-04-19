import React from 'react';
import './LiveStreamBanner.css';

const formatStartedAt = (value) => {
  if (!value) {
    return 'Started recently';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Started recently';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatCheckedAt = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getAudienceLabel = (stream = {}) => {
  const allowedCourses = Array.isArray(stream.allowedCourses)
    ? stream.allowedCourses.filter(Boolean)
    : [];

  if (stream.inferredCourse) {
    return stream.inferredCourse;
  }

  if (!allowedCourses.length || allowedCourses.includes('All Courses')) {
    return 'All Courses';
  }

  if (allowedCourses.length === 1) {
    return allowedCourses[0];
  }

  if (allowedCourses.length <= 3) {
    return allowedCourses.join(' | ');
  }

  return `${allowedCourses.length} course groups`;
};

const LiveStreamBanner = ({ loading, stream, onWatchLive, showManualLiveHint = false }) => {
  if (!loading && !stream?.isLive) {
    return null;
  }

  if (loading && !stream?.isLive) {
    return (
      <section className="youtube-live-panel is-loading">
        <div className="youtube-live-panel__media shimmer"></div>
        <div className="youtube-live-panel__content">
          <div className="youtube-live-panel__line shimmer is-short"></div>
          <div className="youtube-live-panel__line shimmer is-wide"></div>
          <div className="youtube-live-panel__line shimmer"></div>
        </div>
      </section>
    );
  }

  const audienceLabel = getAudienceLabel(stream);
  const checkedAt = formatCheckedAt(stream?.checkedAt);

  return (
    <section className="youtube-live-panel">
      <div className="youtube-live-panel__media">
        <img src={stream.thumbnail} alt={stream.title || 'Currently live'} loading="lazy" />
        <div className="youtube-live-panel__media-overlay"></div>
        <span className="youtube-live-badge">
          <i className="fa-solid fa-tower-broadcast"></i>
          LIVE
        </span>
      </div>

      <div className="youtube-live-panel__content">
        <div className="youtube-live-panel__header">
          <div className="youtube-live-panel__title-wrap">
            <p className="youtube-live-panel__eyebrow">
              {stream.liveSectionLabel || 'Currently Live'}
            </p>
            <h3>{stream.title || 'YouTube Live Session'}</h3>
          </div>

          <div className="youtube-live-panel__header-meta">
            <span className="youtube-live-channel">
              <i className="fa-brands fa-youtube"></i>
              {stream.channelTitle || 'YouTube Live'}
            </span>
            {checkedAt && (
              <span className="youtube-live-checked">
                <i className="fa-solid fa-rotate-right"></i>
                Checked {checkedAt}
              </span>
            )}
          </div>
        </div>

        <div className="youtube-live-meta">
          <span>
            <i className="fa-regular fa-clock"></i>
            Started {formatStartedAt(stream.startedAt)}
          </span>
          <span>
            <i className="fa-solid fa-graduation-cap"></i>
            {audienceLabel}
          </span>
        </div>

        <p className="youtube-live-panel__note">
          {showManualLiveHint
            ? 'Zoom live classes still remain separate in the Live Classes tab, while this card follows the active YouTube stream.'
            : 'This live stream appears automatically from your Sajha Entrance YouTube channel.'}
        </p>

        <div className="youtube-live-actions">
          {stream.showEmbeddedLivePlayer && (
            <button type="button" className="youtube-live-button" onClick={() => onWatchLive(stream)}>
              Watch Live
            </button>
          )}
          <a
            href={stream.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`youtube-live-button ${stream.showEmbeddedLivePlayer ? 'secondary' : ''}`}
          >
            {stream.showEmbeddedLivePlayer ? 'Open in YouTube' : 'Watch Live'}
          </a>
        </div>
      </div>
    </section>
  );
};

export default LiveStreamBanner;
