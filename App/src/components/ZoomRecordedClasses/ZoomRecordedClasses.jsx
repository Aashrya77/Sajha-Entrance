import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  GraduationCap,
  Play,
  RefreshCw,
  Search,
  Tag,
  Video,
  X,
} from 'lucide-react';
import { zoomRecordingAPI } from '../../api/services';
import './ZoomRecordedClasses.css';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const modalDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const formatDuration = (minutes) => {
  if (!minutes) {
    return 'Class recording';
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

const formatDate = (value, formatter = dateFormatter) => {
  if (!value) {
    return 'Undated';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Undated';
  }

  return formatter.format(date);
};

const paletteFor = (recording) => {
  const seed = String(recording?.id || recording?.title || '')
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return `is-palette-${seed % 3}`;
};

const getNoticeIcon = (tone, syncing) => {
  if (tone === 'error') {
    return <AlertCircle size={20} strokeWidth={2.1} />;
  }

  if (tone === 'success') {
    return <CheckCircle2 size={20} strokeWidth={2.1} />;
  }

  return <RefreshCw className={syncing ? 'is-spinning' : ''} size={20} strokeWidth={2.1} />;
};

const SkeletonCard = ({ index }) => (
  <div className="zoom-recording-skeleton" aria-hidden="true" key={index}>
    <div className="zoom-recording-skeleton__media"></div>
    <div className="zoom-recording-skeleton__body">
      <div className="zoom-recording-skeleton__line is-wide"></div>
      <div className="zoom-recording-skeleton__line"></div>
    </div>
  </div>
);

const CategoryFilter = ({ categories, selectedCategory, onSelect }) => (
  <label className="zoom-recording-filter">
    <span className="sr-only">Filter classes</span>
    <Tag className="zoom-recording-filter__icon" size={16} strokeWidth={2.1} />
    <select value={selectedCategory} onChange={(event) => onSelect(event.target.value)}>
      <option value="">All classes</option>
      {categories.map((category) => (
        <option key={category.name} value={category.name}>
          {category.name} ({category.count})
        </option>
      ))}
    </select>
    <ChevronDown className="zoom-recording-filter__chevron" size={16} strokeWidth={2.1} />
  </label>
);

const EmptyState = ({ onSync, syncing, allowSync }) => (
  <div className="zoom-recording-empty">
    <div className="zoom-recording-empty__icon">
      <GraduationCap size={26} strokeWidth={2.1} />
    </div>
    <h2>No recordings yet</h2>
    <p>
      Once Zoom credentials and MongoDB are configured, synced cloud recordings will appear here
      automatically.
    </p>
    {allowSync && (
      <button
        type="button"
        className="zoom-recording-primary-btn"
        onClick={onSync}
        disabled={syncing}
      >
        <RefreshCw className={syncing ? 'is-spinning' : ''} size={16} strokeWidth={2.1} />
        Sync Zoom
      </button>
    )}
  </div>
);

const RecordingCard = ({ recording, onOpen }) => (
  <button type="button" className="zoom-recording-card" onClick={() => onOpen(recording)}>
    <span className="zoom-recording-card__media">
      {recording.hasThumbnail ? (
        <img src={zoomRecordingAPI.thumbnailUrl(recording.id)} alt="" loading="lazy" />
      ) : (
        <span className={`zoom-recording-card__fallback ${paletteFor(recording)}`}></span>
      )}
      <span className="zoom-recording-card__shade"></span>
      <span className="zoom-recording-card__play">
        <Video className="zoom-recording-card__video-icon" size={31} strokeWidth={2.1} />
        <Play className="zoom-recording-card__play-icon" size={31} strokeWidth={2.1} />
      </span>
      <span className="zoom-recording-card__duration">
        <Clock3 size={16} strokeWidth={2.2} />
        {formatDuration(recording.durationMinutes)}
      </span>
    </span>

    <span className="zoom-recording-card__body">
      <strong title={recording.title}>{recording.title}</strong>
      <span>
        <CalendarDays size={16} strokeWidth={2.1} />
        {formatDate(recording.startTime)}
      </span>
    </span>
  </button>
);

const RecordingPlayer = ({ recording, onClose }) => {
  useEffect(() => {
    if (!recording) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, recording]);

  if (!recording) {
    return null;
  }

  return (
    <div
      className="zoom-recording-player-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="zoom-recording-player"
        role="dialog"
        aria-modal="true"
        aria-labelledby="zoom-recording-player-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="zoom-recording-player__header">
          <div className="zoom-recording-player__copy">
            <div className="zoom-recording-player__meta">
              <span>{recording.category}</span>
              <span>
                <CalendarDays size={16} strokeWidth={2.1} />
                {formatDate(recording.startTime, modalDateFormatter)}
              </span>
            </div>
            <h2 id="zoom-recording-player-title">{recording.title}</h2>
          </div>

          <button
            type="button"
            className="zoom-recording-icon-btn"
            onClick={onClose}
            aria-label="Close player"
          >
            <X size={21} strokeWidth={2.1} />
          </button>
        </div>

        <div className="zoom-recording-player__video">
          <video
            key={recording.id}
            src={zoomRecordingAPI.streamUrl(recording.id)}
            controls
            playsInline
            autoPlay
          />
        </div>

        {recording.playUrl && (
          <div className="zoom-recording-player__footer">
            <a href={recording.playUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={16} strokeWidth={2.1} />
              Open Zoom page
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

const ZoomRecordedClasses = ({ isPaid, onCountChange, allowSync = true }) => {
  const [recordings, setRecordings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [syncNotice, setSyncNotice] = useState(null);

  const queryParams = useMemo(
    () => ({
      category: selectedCategory,
      search: search.trim(),
      page: 1,
      limit: 24,
    }),
    [search, selectedCategory]
  );

  const loadRecordings = async ({ silent = false } = {}) => {
    if (!isPaid) {
      setRecordings([]);
      setCategories([]);
      onCountChange?.(0);
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    setError('');

    try {
      const [recordingResponse, categoryResponse] = await Promise.all([
        zoomRecordingAPI.getRecordings(queryParams),
        zoomRecordingAPI.getCategories(),
      ]);

      const recordingData = recordingResponse.data?.data || {};
      const categoryData = categoryResponse.data?.data || {};
      const nextRecordings = Array.isArray(recordingData.items) ? recordingData.items : [];
      const nextCategories = Array.isArray(categoryData.items) ? categoryData.items : [];
      const totalCategoryCount = nextCategories.reduce(
        (sum, category) => sum + Number(category.count || 0),
        0
      );

      setRecordings(nextRecordings);
      setCategories(nextCategories);
      onCountChange?.(totalCategoryCount || Number(recordingData.total || nextRecordings.length || 0));
    } catch (loadError) {
      const message =
        loadError.response?.data?.error || 'We could not load Zoom recordings right now.';
      setError(message);
      onCountChange?.(0);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadRecordings();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [queryParams, isPaid]);

  useEffect(() => {
    if (!syncNotice || syncNotice.persist) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSyncNotice(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [syncNotice]);

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    setSyncNotice({
      message: 'Updating the latest videos...',
      tone: 'updating',
      persist: true,
    });

    try {
      const response = await zoomRecordingAPI.sync();
      const syncResult = response.data?.data?.result || response.data?.result || {};
      const hasLibraryChanges =
        (syncResult.created || 0) > 0 ||
        (syncResult.deleted || 0) > 0 ||
        (syncResult.updated || 0) > 0;

      await loadRecordings({ silent: true });

      setSyncNotice({
        message: hasLibraryChanges
          ? 'Updating the latest videos...'
          : 'Video library is up to date.',
        tone: hasLibraryChanges ? 'updating' : 'success',
        persist: false,
      });
    } catch (syncError) {
      const message =
        syncError.response?.data?.error || 'Unable to sync Zoom recordings right now.';
      setError(message);
      setSyncNotice({
        message,
        tone: 'error',
        persist: false,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <section className="zoom-recordings">
      <div className="zoom-recordings__toolbar">
        <label className="zoom-recordings__search">
          <span className="sr-only">Search recordings</span>
          <Search size={17} strokeWidth={2.1} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search classes"
          />
        </label>

        {allowSync && (
          <button
            type="button"
            className="zoom-recording-primary-btn"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={syncing ? 'is-spinning' : ''} size={16} strokeWidth={2.1} />
            Sync
          </button>
        )}

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      <div className="zoom-recordings__content">
        {error && <div className="zoom-recordings__error">{error}</div>}

        {loading ? (
          <div className="zoom-recordings__grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard index={index} key={index} />
            ))}
          </div>
        ) : recordings.length > 0 ? (
          <div className="zoom-recordings__grid">
            {recordings.map((recording) => (
              <RecordingCard
                key={recording.id}
                recording={recording}
                onOpen={setSelectedRecording}
              />
            ))}
          </div>
        ) : (
          <EmptyState onSync={handleSync} syncing={syncing} allowSync={allowSync} />
        )}
      </div>

      {syncNotice && (
        <div className="zoom-recording-toast" role="status" aria-live="polite">
          <div className={`zoom-recording-toast__card is-${syncNotice.tone}`}>
            {getNoticeIcon(syncNotice.tone, syncing)}
            <p>{syncNotice.message}</p>
            <button
              type="button"
              className="zoom-recording-toast__close"
              onClick={() => setSyncNotice(null)}
            >
              <span className="sr-only">Dismiss sync message</span>
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      )}

      <RecordingPlayer
        recording={selectedRecording}
        onClose={() => setSelectedRecording(null)}
      />
    </section>
  );
};

export default ZoomRecordedClasses;
