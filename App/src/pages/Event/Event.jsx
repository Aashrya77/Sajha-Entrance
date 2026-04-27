import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, MapPin, Search } from 'lucide-react';
import '../../styles/event.css';

const EVENTS = [
  {
    id: 'teacher-training-program',
    title: 'Primary Teacher Training Program',
    category: 'training',
    label: 'Workshop, Training Program',
    startAt: '2026-05-01T00:00:00',
    endAt: '2027-04-30T00:00:00',
    venue: 'Rato Bangala School',
    organizer: 'Rato Bangala Foundation',
    image: '/sajhaphoto/program.jpg',
    link: '/contact',
  },
  {
    id: 'nelta-international-conference',
    title: '31st NELTA International Conference 2027',
    category: 'conference',
    label: 'Conference',
    startAt: '2027-02-19T07:00:00',
    endAt: '2027-02-21T16:00:00',
    venue: 'Pathshala Nepal Foundation, Bagdol, Lalitpur',
    organizer: 'NELTA',
    image: '/sajhaphoto/program1.jpg',
    link: '/contact',
  },
  {
    id: 'mock-test-championship',
    title: 'Sajha Entrance Mock Test Championship',
    category: 'competition',
    label: 'Competition, Assessment',
    startAt: '2026-05-08T09:00:00',
    endAt: '2026-05-08T13:00:00',
    venue: 'Sajha Entrance Hall, Putalisadak',
    organizer: 'Sajha Entrance',
    image: '/sajhaphoto/mocktestevent.jpg',
    link: '/mocktests',
  },
  {
    id: 'scholarship-awareness-session',
    title: 'Scholarship Awareness and Counseling Session',
    category: 'seminar',
    label: 'Seminar, Guidance Session',
    startAt: '2026-05-15T13:30:00',
    endAt: '2026-05-15T15:30:00',
    venue: 'Online via Google Meet',
    organizer: 'Sajha Counseling Desk',
    image: '/sajhaphoto/mocktestgift.jpg',
    link: '/scholarships',
  },
  {
    id: 'engineering-orientation-seminar',
    title: 'Engineering Entrance Orientation Seminar',
    category: 'seminar',
    label: 'Seminar',
    startAt: '2026-05-22T11:00:00',
    endAt: '2026-05-22T14:00:00',
    venue: 'Thapathali Campus, Kathmandu',
    organizer: 'Academic Guidance Team',
    image: '/sajhaphoto/studenthall.jpg',
    link: '/courses',
  },
  {
    id: 'education-fair-nepal',
    title: 'Higher Education and Career Expo Nepal 2026',
    category: 'expo',
    label: 'Education Fair, Expo',
    startAt: '2026-06-05T10:00:00',
    endAt: '2026-06-06T17:00:00',
    venue: 'Bhrikutimandap Exhibition Hall, Kathmandu',
    organizer: 'Partner Colleges and Universities',
    image: '/img/hero-img.png',
    link: '/colleges',
  },
];

const CATEGORY_META = {
  all: 'Category',
  conference: 'Conference',
  competition: 'Competition',
  expo: 'Expo',
  seminar: 'Seminar',
  training: 'Training Program',
};

const formatDateTime = (value) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Date to be announced';
  }

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) + ` ${parsed.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })}`;
};

const Event = () => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'Category' },
      ...Object.entries(
        EVENTS.reduce((accumulator, item) => {
          accumulator[item.category] = true;
          return accumulator;
        }, {})
      ).map(([value]) => ({
        value,
        label: CATEGORY_META[value] || value,
      })),
    ],
    []
  );

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return EVENTS.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        item.title,
        item.label,
        item.venue,
        item.organizer,
        CATEGORY_META[item.category] || '',
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [categoryFilter, searchTerm]);

  return (
    <div className="events-directory">
      <div className="container-fluid events-directory__container">
        <div className="events-directory__header">
          <div className="events-directory__heading">
            <h1 className="events-directory__title">Events</h1>
            <p className="events-directory__subtitle">
              Explore workshops, conferences, training sessions, and career events.
            </p>
          </div>

          <div className="events-directory__controls">
            <label className="events-directory__select-wrap">
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter events by category"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="events-directory__search">
              <Search size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search for events..."
                aria-label="Search events"
              />
            </label>
          </div>
        </div>

        {filteredEvents.length ? (
          <div className="events-directory__list">
            {filteredEvents.map((item) => (
              <Link key={item.id} to={item.link} className="events-directory__card">
                <div className="events-directory__poster">
                  <img src={item.image} alt={item.title} className="events-directory__poster-image" />
                </div>

                <div className="events-directory__content">
                  <p className="events-directory__category">{item.label}</p>
                  <h2 className="events-directory__card-title">{item.title}</h2>

                  <div className="events-directory__meta">
                    <span>
                      <CalendarDays size={16} />
                      {formatDateTime(item.startAt)} - {formatDateTime(item.endAt)}
                    </span>
                    <span>
                      <MapPin size={16} />
                      {item.venue}
                    </span>
                  </div>

                  <p className="events-directory__organizer">{item.organizer}</p>

                  <div className="events-directory__cta">
                    View details
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="events-directory__empty">
            <h3>No events matched your search.</h3>
            <p>Try a different category or broaden the search keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Event;
