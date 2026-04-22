import React, { useEffect } from 'react';
import CourseCard from './CourseCard';
import './VideoLibrarySection.css';

const formatSyncDate = (value) => {
  if (!value) {
    return 'Sync pending';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Sync pending';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatVideoDate = (value) => {
  if (!value) {
    return 'Date TBD';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Date TBD';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getSearchPlaceholder = (activeView) =>
  activeView === 'playlists' ? 'Search playlists' : 'Search videos';

const SkeletonCard = ({ type = 'video' }) => (
  <div className={`video-library-skeleton ${type === 'playlist' ? 'is-playlist' : ''}`}>
    <div className="video-library-skeleton__thumb"></div>
    <div className="video-library-skeleton__line is-wide"></div>
    <div className="video-library-skeleton__line"></div>
  </div>
);

const LibraryTabs = ({ activeView, availableViews, counts, onViewChange }) => (
  <div className="video-library-view-tabs" role="tablist" aria-label="Video library views">
    {availableViews.includes('videos') && (
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'videos'}
        className={`video-library-view-tab ${activeView === 'videos' ? 'active' : ''}`}
        onClick={() => onViewChange('videos')}
      >
        <span>Videos</span>
        <strong>{counts.videos || 0}</strong>
      </button>
    )}

    {availableViews.includes('playlists') && (
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'playlists'}
        className={`video-library-view-tab ${activeView === 'playlists' ? 'active' : ''}`}
        onClick={() => onViewChange('playlists')}
      >
        <span>Playlists</span>
        <strong>{counts.playlists || 0}</strong>
      </button>
    )}
  </div>
);

const PlaylistCard = ({ playlist }) => {
  const canOpen = Boolean(playlist?.playlistUrl);

  return (
    <CourseCard
      className="playlist-card"
      overlay={
        canOpen
          ? {
              type: 'link',
              href: playlist.playlistUrl,
            }
          : {
              type: 'link',
              disabled: true,
            }
      }
      ariaLabel={`Open playlist ${playlist.title || 'playlist'}`}
      thumbnail={playlist.thumbnail}
      imageAlt={playlist.title}
      title={playlist.title}
      category={playlist.subjectTag || 'Playlist'}
      categoryIconClass="fa-solid fa-layer-group"
      categoryTone={playlist.subjectTag ? 'is-subject' : 'is-playlist'}
      dateLabel={formatVideoDate(playlist.publishedAt)}
      mediaBadge={{
        iconClass: 'fa-solid fa-list-ul',
        label: `${playlist.videoCount || 0} videos`,
        className: 'is-neutral',
      }}
      primaryAction={{
        label: 'Open Playlist',
        iconClass: 'fa-solid fa-arrow-up-right-from-square',
        href: playlist.playlistUrl,
        disabled: !canOpen,
      }}
    />
  );
};

const VideoCard = ({ video, onWatchVideo }) => {
  const canWatch = Boolean(video?.youtubeVideoId) && typeof onWatchVideo === 'function';
  const handleWatchVideo = () => {
    onWatchVideo?.(video);
  };

  return (
    <CourseCard
      overlay={{
        type: 'button',
        onClick: handleWatchVideo,
        disabled: !canWatch,
      }}
      ariaLabel={`Watch ${video.title || 'video'}`}
      thumbnail={video.thumbnail}
      imageAlt={video.title}
      title={video.title}
      category={video.subjectTag || 'Recorded Class'}
      categoryIconClass="fa-solid fa-book-open"
      categoryTone={video.subjectTag ? 'is-subject' : 'is-recorded'}
      dateLabel={formatVideoDate(video.publishedAt)}
      mediaBadge={
        video.isLiveStreamRecording
          ? {
              iconClass: 'fa-solid fa-tower-broadcast',
              label: 'Live Archive',
              className: 'is-live-archive',
            }
          : null
      }
      primaryAction={{
        label: 'Watch Now',
        iconClass: 'fa-solid fa-circle-play',
        onClick: handleWatchVideo,
        disabled: !canWatch,
      }}
      secondaryAction={
        video.videoUrl
          ? {
              label: 'Open in YouTube',
              iconClass: 'fa-brands fa-youtube',
              href: video.videoUrl,
            }
          : null
      }
    />
  );
};

const PlaylistsSection = ({ playlists, counts, loading }) => (
  <section className="video-library-section">
    <div className="video-library-section__header">
      <div>
        <p className="video-library-section__eyebrow">Featured Collections</p>
        <h3>Playlists</h3>
      </div>
      <span>{counts.playlists || 0} available</span>
    </div>

    {loading && playlists.length === 0 ? (
      <div className="video-library-grid is-playlists">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonCard key={`playlist-skeleton-${index}`} type="playlist" />
        ))}
      </div>
    ) : playlists.length > 0 ? (
      <div className="video-library-grid is-playlists">
        {playlists.map((playlist) => (
          <PlaylistCard key={playlist._id || playlist.youtubePlaylistId} playlist={playlist} />
        ))}
      </div>
    ) : (
      <div className="video-library-state">
        <i className="fa-solid fa-list-ul"></i>
        <h3>No playlists found</h3>
        <p>Try a different search or subject filter to find synced playlists.</p>
      </div>
    )}
  </section>
);

const VideosSection = ({
  videos,
  counts,
  loading,
  loadingMore,
  pagination,
  onWatchVideo,
  onLoadMore,
}) => (
  <section className="video-library-section">
    <div className="video-library-section__header">
      <div>
        <p className="video-library-section__eyebrow">Recently Uploaded</p>
        <h3>Recorded Videos</h3>
      </div>
      <span>{counts.videos || 0} total</span>
    </div>

    {loading && videos.length === 0 ? (
      <div className="video-library-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={`video-skeleton-${index}`} />
        ))}
      </div>
    ) : videos.length > 0 ? (
      <>
        <div className="video-library-grid">
          {videos.map((video) => (
            <VideoCard
              key={video._id || video.youtubeVideoId}
              video={video}
              onWatchVideo={onWatchVideo}
            />
          ))}
        </div>

        {pagination?.hasMore && (
          <div className="video-library-loadmore">
            <button
              type="button"
              className="video-library-btn secondary"
              onClick={onLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading more...' : 'Load More Videos'}
            </button>
          </div>
        )}
      </>
    ) : (
      <div className="video-library-state">
        <i className="fa-solid fa-circle-play"></i>
        <h3>No videos found</h3>
        <p>Try a different search or subject filter to find synced recorded videos.</p>
      </div>
    )}
  </section>
);

const VideoLibrarySection = ({
  loading,
  loadingMore,
  error,
  search,
  subject,
  subjects,
  playlists,
  videos,
  counts,
  pagination,
  config,
  activeView = 'videos',
  onSearchChange,
  onSubjectChange,
  onViewChange,
  onLoadMore,
  onWatchVideo,
  onRetry,
}) => {
  const hasContent = playlists.length > 0 || videos.length > 0;
  const availableViews = [];

  if (config?.showVideos !== false) {
    availableViews.push('videos');
  }

  if (config?.showPlaylists !== false) {
    availableViews.push('playlists');
  }

  const fallbackView = availableViews[0] || 'videos';
  const resolvedView = availableViews.includes(activeView) ? activeView : fallbackView;
  const viewsSignature = availableViews.join(',');

  useEffect(() => {
    if (availableViews.length > 0 && activeView !== resolvedView) {
      onViewChange?.(resolvedView);
    }
  }, [activeView, onViewChange, resolvedView, viewsSignature]);

  return (
    <section className="video-library-panel">
      <div className="video-library-panel__intro">
        <div>
          <p className="video-library-panel__eyebrow">Auto Synced Classroom Library</p>
          <h2>Video Library</h2>
          <p>
            Playlists and recorded classes synced directly from{' '}
            {config?.channelTitle || 'your Sajha Entrance YouTube channel'}.
          </p>
        </div>

        <div className="video-library-stats">
          <div className="video-library-stat">
            <strong>{counts.playlists || 0}</strong>
            <span>Playlists</span>
          </div>
          <div className="video-library-stat">
            <strong>{counts.videos || 0}</strong>
            <span>Videos</span>
          </div>
          <div className="video-library-stat">
            <strong>{formatSyncDate(config?.lastSyncedAt)}</strong>
            <span>Last Synced</span>
          </div>
        </div>
      </div>

      <div className="video-library-toolbar">
        <label className="video-library-search">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={getSearchPlaceholder(resolvedView)}
          />
        </label>

        {availableViews.length > 1 && (
          <LibraryTabs
            activeView={resolvedView}
            availableViews={availableViews}
            counts={counts}
            onViewChange={onViewChange}
          />
        )}

        <div className="video-library-chip-row">
          <button
            type="button"
            className={`video-library-chip ${!subject ? 'active' : ''}`}
            onClick={() => onSubjectChange('')}
          >
            All Subjects
          </button>
          {subjects.map((entry) => (
            <button
              type="button"
              key={entry}
              className={`video-library-chip ${subject === entry ? 'active' : ''}`}
              onClick={() => onSubjectChange(entry)}
            >
              {entry}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="video-library-state is-error">
          <div>
            <h3>We could not load the video library</h3>
            <p>{error}</p>
          </div>
          <button type="button" className="video-library-btn" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      {!error && !loading && !hasContent && (
        <div className="video-library-state">
          <i className="fa-solid fa-film"></i>
          <h3>No synced recorded classes yet</h3>
          <p>
            Once the YouTube channel is synced from the admin panel, playlists and recorded videos
            will appear here automatically.
          </p>
        </div>
      )}

      {!error &&
        (loading || hasContent) &&
        availableViews.includes(resolvedView) &&
        resolvedView === 'videos' && (
        <VideosSection
          videos={videos}
          counts={counts}
          loading={loading}
          loadingMore={loadingMore}
          pagination={pagination}
          onWatchVideo={onWatchVideo}
          onLoadMore={onLoadMore}
        />
      )}

      {!error &&
        (loading || hasContent) &&
        availableViews.includes(resolvedView) &&
        resolvedView === 'playlists' && (
        <PlaylistsSection playlists={playlists} counts={counts} loading={loading} />
      )}
    </section>
  );
};

export default VideoLibrarySection;
