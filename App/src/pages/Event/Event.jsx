import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  Users,
} from 'lucide-react';
import { eventAPI } from '../../api/services';
import { getImageUrl } from '../../utils/imageHelper';
import { STATIC_EVENTS } from '../../data/staticNewsEvents';
import Loader from '../../components/Loader/Loader';
import '../../styles/event.css';

const CATEGORY_LABELS = {
  all: 'All categories',
  Competition: 'Competition',
  Conference: 'Conference',
  Expo: 'Expo',
  Seminar: 'Seminar',
  Training: 'Training Program',
};

const toContentHtml = (event) => {
  const sections = event.content.map((paragraph) => `<p>${paragraph}</p>`);
  if (event.highlights?.length) {
    sections.push('<h2>What this event includes</h2>');
    sections.push(`<ul>${event.highlights.map((item) => `<li>${item}</li>`).join('')}</ul>`);
  }
  if (event.audience?.length) {
    sections.push('<h2>Who should attend</h2>');
    sections.push(`<ul>${event.audience.map((item) => `<li>${item}</li>`).join('')}</ul>`);
  }
  return sections.join('');
};

const toStaticEvent = (event) => ({
  slug: event.id,
  legacyId: event.id,
  title: event.title,
  category: event.category,
  label: event.label || event.category,
  startAt: event.startAt,
  endAt: event.endAt,
  venue: event.venue,
  organizer: event.organizer,
  mode: event.mode,
  capacity: event.capacity,
  image: event.image,
  imageAlt: event.title,
  excerpt: event.summary,
  contentHtml: toContentHtml(event),
  registrationUrl: '',
  externalUrl: event.relatedLink || '',
});

const staticEvents = STATIC_EVENTS.map(toStaticEvent);

const resolveEventImage = (event) => {
  const imagePath = event.featuredImageUrl || event.featuredImage || event.image;
  if (!imagePath) return '/sajhaphoto/program.jpg';
  if (imagePath.startsWith('/img/') || imagePath.startsWith('/sajhaphoto/')) return imagePath;
  return getImageUrl(imagePath, 'event');
};

const formatDate = (value) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Date to be announced';
  }

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDateRange = (startAt, endAt) => {
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Date to be announced';
  }

  const sameDay = start.toDateString() === end.toDateString();
  const hasTime =
    start.getHours() !== 0 ||
    start.getMinutes() !== 0 ||
    end.getHours() !== 0 ||
    end.getMinutes() !== 0;

  if (sameDay && hasTime) {
    const timeRange = `${start.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })} - ${end.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })}`;

    return `${formatDate(startAt)} | ${timeRange}`;
  }

  if (sameDay) {
    return formatDate(startAt);
  }

  return `${formatDate(startAt)} - ${formatDate(endAt)}`;
};

const monthShort = (value) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'TBA';
  }

  return parsed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
};

const dayNumber = (value) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }

  return parsed.toLocaleDateString('en-US', { day: '2-digit' });
};

const getStatus = (startAt, endAt) => {
  const now = new Date();
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { label: 'To be announced', tone: 'muted' };
  }

  if (now > end) {
    return { label: 'Completed', tone: 'muted' };
  }

  if (now >= start && now <= end) {
    return { label: 'Ongoing', tone: 'live' };
  }

  const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / 86400000);

  if (daysUntilStart <= 14) {
    return { label: 'Registration open', tone: 'warm' };
  }

  return { label: 'Upcoming', tone: 'cool' };
};

const EventDetail = ({ event, relatedEvents }) => {
  const status = getStatus(event.startAt, event.endAt);
  const contentHtml = event.content || event.contentHtml || '';
  const outboundUrl = event.registrationUrl || event.externalUrl;

  return (
    <div className="event-detail">
      <Link to="/events" className="event-detail__back">
        <ArrowLeft size={16} />
        Back to events
      </Link>

      <div className="event-detail__hero">
        <div className="event-detail__image-wrap">
          <img src={resolveEventImage(event)} alt={event.imageAlt || event.title} className="event-detail__image" />
        </div>

        <div className="event-detail__hero-content">
          <p className="event-detail__kicker">
            {(event.category || 'Event').toUpperCase()} - {formatDate(event.startAt).toUpperCase()}
          </p>
          <div className="event-detail__headline-row">
            <h1 className="event-detail__title">{event.title}</h1>
            <span className={`event-detail__status event-detail__status--${status.tone}`}>
              {status.label}
            </span>
          </div>
          <p className="event-detail__summary">{event.excerpt}</p>

          <div className="event-detail__facts">
            <div className="event-detail__fact">
              <CalendarDays size={17} />
              <div>
                <span>Date</span>
                <strong>{formatDateRange(event.startAt, event.endAt)}</strong>
              </div>
            </div>

            {event.venue ? (
              <div className="event-detail__fact">
                <MapPin size={17} />
                <div>
                  <span>Venue</span>
                  <strong>{event.venue}</strong>
                </div>
              </div>
            ) : null}

            {(event.address || event.mode) ? (
              <div className="event-detail__fact">
                <Clock3 size={17} />
                <div>
                  <span>{event.address ? 'Location' : 'Format'}</span>
                  <strong>{event.address || event.mode}</strong>
                </div>
              </div>
            ) : null}

            {(event.contact || event.capacity) ? (
              <div className="event-detail__fact">
                <Users size={17} />
                <div>
                  <span>{event.contact ? 'Contact' : 'Attendance'}</span>
                  <strong>{event.contact || event.capacity}</strong>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="event-detail__body">
        <div className="event-detail__main">
          <section className="event-detail__section">
            <h2>About this event</h2>
            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </section>
        </div>

        <aside className="event-detail__sidebar">
          {(event.organizer || outboundUrl) ? (
            <div className="event-detail__panel">
              {event.organizer ? (
                <>
                  <p className="event-detail__panel-label">Organizer</p>
                  <h3>{event.organizer}</h3>
                </>
              ) : null}
              {outboundUrl ? (
                <a href={outboundUrl} className="event-detail__panel-link" target="_blank" rel="noopener noreferrer">
                  {event.registrationUrl ? 'Register for event' : 'Open event link'}
                  <ArrowUpRight size={16} />
                </a>
              ) : null}
            </div>
          ) : null}

          {relatedEvents.length ? (
            <div className="event-detail__panel">
              <p className="event-detail__panel-label">More events</p>
              <div className="event-detail__related-list">
                {relatedEvents.map((item) => (
                  <Link key={item.slug || item.legacyId} to={`/events/${item.slug || item.legacyId}`} className="event-detail__related-item">
                    <span>{item.title}</span>
                    <ArrowUpRight size={15} />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
};

const EventNotFound = ({ message }) => (
  <div className="events-hub__empty">
    <h3>That event could not be found.</h3>
    <p>{message || 'The link may be outdated, or the event may no longer be listed.'}</p>
    <Link to="/events" className="event-detail__back event-detail__back--inline">
      <ArrowLeft size={16} />
      Return to all events
    </Link>
  </div>
);

const Event = () => {
  const { id } = useParams();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ previousPage: 0, nextPage: 0 });
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      if (!id) return;
      setLoading(true);
      setApiError('');

      try {
        const response = await eventAPI.getEventByIdentifier(id);
        if (!cancelled && response.data?.success) {
          setSelectedEvent(response.data.data.event);
          setUsingFallback(false);
        }
      } catch (error) {
        const shouldUseFallback = !error.response || error.response.status >= 500;
        const fallbackEvent = shouldUseFallback
          ? staticEvents.find((item) => item.slug === id || item.legacyId === id)
          : null;
        if (!cancelled) {
          setSelectedEvent(fallbackEvent || null);
          setUsingFallback(Boolean(fallbackEvent));
          setApiError(fallbackEvent ? '' : 'That event could not be found.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const loadList = async () => {
      if (id) return;
      setLoading(true);
      setApiError('');

      try {
        const response = await eventAPI.getEvents({
          page: currentPage,
          search: submittedSearch,
          category: categoryFilter,
        });
        const apiEvents = response.data?.data?.events || [];
        if (!cancelled) {
          setEvents(apiEvents);
          setCategories(response.data?.data?.categories || []);
          setPagination(response.data?.data?.pagination || { previousPage: 0, nextPage: 0 });
          setUsingFallback(false);
        }
      } catch (error) {
        const shouldUseFallback = !error.response || error.response.status >= 500;
        if (!cancelled) {
          setEvents(shouldUseFallback ? staticEvents : []);
          setCategories([]);
          setPagination({ previousPage: 0, nextPage: 0 });
          setUsingFallback(shouldUseFallback);
          setApiError(
            shouldUseFallback
              ? 'Showing saved events while the live feed is unavailable.'
              : 'Events could not be loaded.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadList();

    return () => {
      cancelled = true;
    };
  }, [categoryFilter, currentPage, id, submittedSearch]);

  const sortedEvents = useMemo(
    () => [...events].sort((left, right) => new Date(left.startAt) - new Date(right.startAt)),
    [events]
  );

  const relatedEvents = useMemo(() => {
    if (!selectedEvent) return [];
    return sortedEvents.filter((item) => item.slug !== selectedEvent.slug).slice(0, 3);
  }, [selectedEvent, sortedEvents]);

  const categoryOptions = useMemo(() => {
    const sourceCategories = categories.length
      ? categories
      : staticEvents.map((item) => item.category).filter(Boolean);
    const uniqueCategories = [...new Set(sourceCategories)].sort((left, right) => left.localeCompare(right));

    return [
      { value: 'all', label: CATEGORY_LABELS.all },
      ...uniqueCategories.map((value) => ({ value, label: CATEGORY_LABELS[value] || value })),
    ];
  }, [categories]);

  const filteredEvents = useMemo(() => {
    if (!usingFallback) return sortedEvents;
    const normalizedSearch = submittedSearch.trim().toLowerCase();

    return sortedEvents.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (!normalizedSearch) return true;
      return [item.title, item.label, item.excerpt, item.venue, item.organizer, item.category]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [categoryFilter, sortedEvents, submittedSearch, usingFallback]);

  const handleSearch = (event) => {
    event.preventDefault();
    setCurrentPage(1);
    setSubmittedSearch(searchTerm);
  };

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  return (
    <div className="events-hub">
      <div className="container-fluid events-hub__container">
        {id && !selectedEvent ? (
          <EventNotFound message={apiError} />
        ) : selectedEvent ? (
          <EventDetail event={selectedEvent} relatedEvents={relatedEvents} />
        ) : (
          <>
            <div className="events-hub__header">
              <div className="events-hub__heading">
                <p className="events-hub__eyebrow">Sajha events</p>
                <h1 className="events-hub__title">Browse events and open a dedicated page for each one.</h1>
                <p className="events-hub__subtitle">
                  Explore upcoming, ongoing, and past student-focused events from Sajha Entrance and education partners.
                </p>
              </div>

              <form className="events-hub__controls" onSubmit={handleSearch}>
                <label className="events-hub__select-wrap">
                  <select
                    value={categoryFilter}
                    onChange={(event) => {
                      setCurrentPage(1);
                      setCategoryFilter(event.target.value);
                    }}
                    aria-label="Filter events by category"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="events-hub__search">
                  <Search size={18} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search events, venues, or organizers..."
                    aria-label="Search events"
                  />
                </label>
              </form>
            </div>

            {apiError ? <div className="events-hub__empty"><p>{apiError}</p></div> : null}

            {filteredEvents.length ? (
              <>
                <div className="events-hub__grid">
                  {filteredEvents.map((item) => {
                    const status = getStatus(item.startAt, item.endAt);

                    return (
                      <Link key={item.slug || item.legacyId} to={`/events/${item.slug || item.legacyId}`} className="events-hub__card">
                        <div className="events-hub__card-image-wrap">
                          <img src={resolveEventImage(item)} alt={item.imageAlt || item.title} className="events-hub__card-image" />
                          <div className="events-hub__card-date">
                            <span>{monthShort(item.startAt)}</span>
                            <strong>{dayNumber(item.startAt)}</strong>
                          </div>
                        </div>

                        <div className="events-hub__card-content">
                          <div className="events-hub__card-topline">
                            <p className="events-hub__card-category">{item.label || item.category}</p>
                            <span className={`events-hub__card-status events-hub__card-status--${status.tone}`}>
                              {status.label}
                            </span>
                          </div>

                          <h2 className="events-hub__card-title">{item.title}</h2>
                          <p className="events-hub__card-summary">{item.excerpt}</p>

                          <div className="events-hub__card-meta">
                            <span>
                              <CalendarDays size={16} />
                              {formatDateRange(item.startAt, item.endAt)}
                            </span>
                            {item.venue ? (
                              <span>
                                <MapPin size={16} />
                                {item.venue}
                              </span>
                            ) : null}
                          </div>

                          <div className="events-hub__card-cta">
                            View event page
                            <ArrowUpRight size={16} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {!usingFallback && (pagination.previousPage || pagination.nextPage) ? (
                  <div className="pagination-wrapper mt-5">
                    <ul className="pagination">
                      {pagination.previousPage ? (
                        <li className="page-item">
                          <button className="page-link" onClick={() => setCurrentPage(pagination.previousPage)}>Previous</button>
                        </li>
                      ) : null}
                      {pagination.nextPage ? (
                        <li className="page-item">
                          <button className="page-link" onClick={() => setCurrentPage(pagination.nextPage)}>Next</button>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="events-hub__empty">
                <h3>No events matched your search.</h3>
                <p>Try a different keyword, venue, or category.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Event;
