import React from 'react';
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

const SkeletonCard = ({ type = 'video' }) => (
  <div className={`video-library-skeleton ${type === 'playlist' ? 'is-playlist' : ''}`}>
    <div className="video-library-skeleton__thumb"></div>
    <div className="video-library-skeleton__line is-wide"></div>
    <div className="video-library-skeleton__line"></div>
  </div>
);

const PlaylistsSection = ({ playlists, loading, onOpenPlaylist }) => (
  <section className="video-library-section">
    <div className="video-library-section__header">
      <div>
        <p className="video-library-section__eyebrow">Featured Collections</p>
        <h3>Playlists</h3>
      </div>
      <span>{playlists.length} available</span>
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
          <article className="video-library-card playlist-card" key={playlist._id || playlist.youtubePlaylistId}>
            <div className="video-library-card__media">
              <img
                src={playlist.thumbnail}
                alt={playlist.title}
                loading="lazy"
              />
              <span className="video-library-card__badge">
                <i className="fa-solid fa-list-ul"></i>
                {playlist.videoCount || 0} videos
              </span>
            </div>

            <div className="video-library-card__body">
              <div className="video-library-card__meta">
                {playlist.subjectTag ? (
                  <span className="video-library-pill">{playlist.subjectTag}</span>
                ) : (
                  <span className="video-library-pill subtle">Playlist</span>
                )}
              </div>

              <h4>{playlist.title}</h4>

              <div className="video-library-card__footer">
                <span className="video-library-card__date">
                  <i className="fa-regular fa-calendar"></i>
                  {formatVideoDate(playlist.publishedAt)}
                </span>

                <button
                  type="button"
                  className="video-library-btn"
                  onClick={() => onOpenPlaylist(playlist)}
                >
                  Open Playlist
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    ) : null}
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
            <article className="video-library-card" key={video._id || video.youtubeVideoId}>
              <div className="video-library-card__media">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  loading="lazy"
                />
                {video.isLiveStreamRecording && (
                  <span className="video-library-card__badge is-live-archive">
                    <i className="fa-solid fa-tower-broadcast"></i>
                    Live Archive
                  </span>
                )}
              </div>

              <div className="video-library-card__body">
                <div className="video-library-card__meta">
                  {video.subjectTag ? (
                    <span className="video-library-pill">{video.subjectTag}</span>
                  ) : (
                    <span className="video-library-pill subtle">Recorded Class</span>
                  )}
                </div>

                <h4>{video.title}</h4>

                <div className="video-library-card__footer">
                  <span className="video-library-card__date">
                    <i className="fa-regular fa-calendar"></i>
                    {formatVideoDate(video.publishedAt)}
                  </span>

                  <div className="video-library-card__actions">
                    <button
                      type="button"
                      className="video-library-btn"
                      onClick={() => onWatchVideo(video)}
                    >
                      Watch Now
                    </button>
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="video-library-link"
                    >
                      Open in YouTube
                    </a>
                  </div>
                </div>
              </div>
            </article>
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
    ) : null}
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
  onSearchChange,
  onSubjectChange,
  onLoadMore,
  onOpenPlaylist,
  onWatchVideo,
  onRetry,
}) => {
  const hasContent = playlists.length > 0 || videos.length > 0;
  const orderedSections =
    config?.showPlaylistsFirst === false ? ['videos', 'playlists'] : ['playlists', 'videos'];

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
            placeholder="Search videos or playlists"
          />
        </label>

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
        orderedSections.map((sectionKey) => {
          if (sectionKey === 'playlists' && config?.showPlaylists !== false) {
            return (
              <PlaylistsSection
                key="playlists"
                playlists={playlists}
                loading={loading}
                onOpenPlaylist={onOpenPlaylist}
              />
            );
          }

          if (sectionKey === 'videos' && config?.showVideos !== false) {
            return (
              <VideosSection
                key="videos"
                videos={videos}
                counts={counts}
                loading={loading}
                loadingMore={loadingMore}
                pagination={pagination}
                onWatchVideo={onWatchVideo}
                onLoadMore={onLoadMore}
              />
            );
          }

          return null;
        })}
    </section>
  );
};

export default VideoLibrarySection;

