import React, { useMemo, useState } from 'react';
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
import '../../styles/event.css';

const EVENTS = [
  {
    id: 'teacher-training-program',
    title: 'Primary Teacher Training Program',
    category: 'Training',
    label: 'Workshop, Training Program',
    startAt: '2026-05-01T00:00:00',
    endAt: '2027-04-30T00:00:00',
    venue: 'Rato Bangala School',
    organizer: 'Rato Bangala Foundation',
    mode: 'In-person cohort',
    capacity: '40 educators per batch',
    image: '/sajhaphoto/program.jpg',
    summary:
      'A year-long teacher development track focused on practical classroom delivery, child-centered methods, and sustainable instructional improvement.',
    relatedLink: '/contact',
    relatedCta: 'Talk to our counseling team',
    content: [
      'This teacher training program is designed for educators who want deeper support than a one-day seminar can provide. Participants move through structured learning cycles that combine guided workshops, peer exchange, reflection, and classroom application.',
      'Across the program, facilitators work on lesson planning, formative assessment, student participation, and methods for keeping classrooms responsive to different learning needs. The goal is not only to introduce ideas but to help teachers use them consistently in real instruction.',
      'Schools and educators joining this track can expect a professional development experience that values practice, discussion, and long-term growth rather than quick theory-only sessions.',
    ],
    highlights: [
      'Hands-on lesson design workshops with peer review',
      'Mentor support and follow-up reflection checkpoints',
      'Practical classroom strategies that can be implemented immediately',
    ],
    audience: [
      'Primary-level teachers and assistant teachers',
      'Academic coordinators and school leaders',
      'Institutions looking to strengthen pedagogy across teams',
    ],
  },
  {
    id: 'mock-test-championship',
    title: 'Sajha Entrance Mock Test Championship',
    category: 'Competition',
    label: 'Competition, Assessment',
    startAt: '2026-05-08T09:00:00',
    endAt: '2026-05-08T13:00:00',
    venue: 'Sajha Entrance Hall, Putalisadak',
    organizer: 'Sajha Entrance',
    mode: 'On-site exam session',
    capacity: '250 student seats',
    image: '/sajhaphoto/mocktestevent.jpg',
    summary:
      'A high-energy exam simulation event built to test time management, accuracy, and competitive readiness before entrance exams.',
    relatedLink: '/mocktests',
    relatedCta: 'Practice with mock tests',
    content: [
      'The Sajha Entrance Mock Test Championship gives students an opportunity to sit for a realistic entrance-style assessment under timed conditions. Rather than treating preparation as abstract revision, this event helps students feel the pace, pressure, and structure of an actual exam setting.',
      'Participants receive ranking insight and a clearer picture of how they perform when speed, accuracy, and concentration all matter at once. That makes the event especially useful for students who know the material but want to improve exam execution.',
      'For many students, mock test environments become the bridge between preparation and confidence. This event is built around that idea, with a focus on readiness, comparison, and constructive follow-up.',
    ],
    highlights: [
      'Timed exam-day simulation with ranking and comparison',
      'A sharper understanding of speed, pressure, and performance gaps',
      'A motivating competitive environment for serious aspirants',
    ],
    audience: [
      'Students preparing for competitive entrance examinations',
      'Learners who want to benchmark readiness before the real exam',
      'Students who need practice managing time under pressure',
    ],
  },
  {
    id: 'scholarship-awareness-session',
    title: 'Scholarship Awareness and Counseling Session',
    category: 'Seminar',
    label: 'Seminar, Guidance Session',
    startAt: '2026-05-15T13:30:00',
    endAt: '2026-05-15T15:30:00',
    venue: 'Online via Google Meet',
    organizer: 'Sajha Counseling Desk',
    mode: 'Live online session',
    capacity: 'Unlimited online attendance',
    image: '/sajhaphoto/mocktestgift.jpg',
    summary:
      'A focused online session for students and families who want clarity on scholarship options, documents, and application timing.',
    relatedLink: '/scholarships',
    relatedCta: 'Explore scholarship options',
    content: [
      'Scholarship applications often feel confusing because students have to navigate eligibility rules, deadlines, required documents, and institution-specific expectations all at once. This session is designed to simplify that process.',
      'Counselors walk through the main scholarship pathways, common requirements, and the mistakes that most often delay or weaken applications. The emphasis is on helping students understand what to prepare before deadlines become urgent.',
      'Because the session is online, students and parents can join from anywhere and still receive structured guidance that helps them move forward with more confidence and less guesswork.',
    ],
    highlights: [
      'Overview of scholarship pathways and selection expectations',
      'Document readiness guidance and application planning support',
      'Accessible live format for students and families across locations',
    ],
    audience: [
      'Students looking for scholarship or financial support',
      'Parents helping compare academic options and costs',
      'Applicants preparing documents for upcoming admission cycles',
    ],
  },
  {
    id: 'engineering-orientation-seminar',
    title: 'Engineering Entrance Orientation Seminar',
    category: 'Seminar',
    label: 'Seminar',
    startAt: '2026-05-22T11:00:00',
    endAt: '2026-05-22T14:00:00',
    venue: 'Thapathali Campus, Kathmandu',
    organizer: 'Academic Guidance Team',
    mode: 'Campus seminar',
    capacity: '180 participant seats',
    image: '/sajhaphoto/studenthall.jpg',
    summary:
      'A campus-based orientation event that helps engineering aspirants understand pathways, entrance preparation, and decision-making.',
    relatedLink: '/courses',
    relatedCta: 'See engineering prep courses',
    content: [
      'Students aiming for engineering often need more than course lists and exam dates. They need a clearer sense of how entrance preparation connects with campus choice, expectations, and long-term study planning. This seminar is built to answer those questions in one place.',
      'The session introduces key preparation priorities, explains common pathway differences, and gives students a more grounded sense of what to expect from engineering-focused academic tracks.',
      'By bringing guidance into a campus setting, the seminar also helps students connect academic planning with a more concrete picture of student life, discipline expectations, and next steps.',
    ],
    highlights: [
      'A clearer picture of engineering entrance pathways',
      'Preparation planning support for science-background students',
      'In-person discussion in an academic campus environment',
    ],
    audience: [
      '+2 science students exploring engineering options',
      'Students comparing entrance tracks and campuses',
      'Families supporting engineering-focused academic plans',
    ],
  },
  {
    id: 'education-fair-nepal',
    title: 'Higher Education and Career Expo Nepal 2026',
    category: 'Expo',
    label: 'Education Fair, Expo',
    startAt: '2026-06-05T10:00:00',
    endAt: '2026-06-06T17:00:00',
    venue: 'Bhrikutimandap Exhibition Hall, Kathmandu',
    organizer: 'Partner Colleges and Universities',
    mode: 'Expo and counseling booths',
    capacity: 'Open public attendance',
    image: '/img/hero-img.png',
    summary:
      'A large-format higher education expo where students can compare institutions, programs, and academic pathways in person.',
    relatedLink: '/colleges',
    relatedCta: 'Browse partner colleges',
    content: [
      'The Higher Education and Career Expo brings together colleges, universities, and student guidance representatives into one shared venue. For students who are still comparing institutions, this creates a much more efficient way to gather information.',
      'Instead of visiting separate campuses or searching scattered sources online, students can ask direct questions, compare program options, and understand what different institutions emphasize in admissions and student support.',
      'The expo is especially helpful for students who are at the decision stage and want a side-by-side sense of how different institutions align with their goals.',
    ],
    highlights: [
      'Direct conversations with multiple institutions in one place',
      'Better visibility into admissions, programs, and student support',
      'Useful comparison opportunities for undecided students',
    ],
    audience: [
      'Students comparing colleges and universities',
      'Families collecting admissions and program information',
      'Learners exploring future academic and career directions',
    ],
  },
  {
    id: 'nelta-international-conference',
    title: '31st NELTA International Conference 2027',
    category: 'Conference',
    label: 'Conference',
    startAt: '2027-02-19T07:00:00',
    endAt: '2027-02-21T16:00:00',
    venue: 'Pathshala Nepal Foundation, Bagdol, Lalitpur',
    organizer: 'NELTA',
    mode: 'Conference and breakout sessions',
    capacity: 'National and international delegates',
    image: '/sajhaphoto/program1.jpg',
    summary:
      'A multi-day language education conference featuring presentations, workshops, and professional exchange across the teaching community.',
    relatedLink: '/contact',
    relatedCta: 'Contact us for event support',
    content: [
      'The NELTA International Conference is designed as a professional meeting point for teachers, trainers, and educational leaders working in language education. Over several days, attendees can take part in presentations, workshops, and broader conversations about classroom practice and development.',
      'Events of this type are valuable not only because of formal sessions, but because they bring together communities that can learn from one another across institutions and teaching contexts.',
      'For educators looking to stay connected to current conversations in pedagogy and practice, the conference offers both structured learning and professional network-building.',
    ],
    highlights: [
      'Keynotes, breakout sessions, and professional workshops',
      'Networking opportunities across teaching communities',
      'A strong platform for exchanging ideas around pedagogy and practice',
    ],
    audience: [
      'English language teachers and trainers',
      'Education leaders and institutional representatives',
      'Professionals interested in pedagogy, curriculum, and practice',
    ],
  },
];

const CATEGORY_LABELS = {
  all: 'All categories',
  Competition: 'Competition',
  Conference: 'Conference',
  Expo: 'Expo',
  Seminar: 'Seminar',
  Training: 'Training Program',
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

  return (
    <div className="event-detail">
      <Link to="/events" className="event-detail__back">
        <ArrowLeft size={16} />
        Back to events
      </Link>

      <div className="event-detail__hero">
        <div className="event-detail__image-wrap">
          <img src={event.image} alt={event.title} className="event-detail__image" />
        </div>

        <div className="event-detail__hero-content">
          <p className="event-detail__kicker">
            {event.category.toUpperCase()} - {formatDate(event.startAt).toUpperCase()}
          </p>
          <div className="event-detail__headline-row">
            <h1 className="event-detail__title">{event.title}</h1>
            <span className={`event-detail__status event-detail__status--${status.tone}`}>
              {status.label}
            </span>
          </div>
          <p className="event-detail__summary">{event.summary}</p>

          <div className="event-detail__facts">
            <div className="event-detail__fact">
              <CalendarDays size={17} />
              <div>
                <span>Date</span>
                <strong>{formatDateRange(event.startAt, event.endAt)}</strong>
              </div>
            </div>

            <div className="event-detail__fact">
              <MapPin size={17} />
              <div>
                <span>Venue</span>
                <strong>{event.venue}</strong>
              </div>
            </div>

            <div className="event-detail__fact">
              <Clock3 size={17} />
              <div>
                <span>Format</span>
                <strong>{event.mode}</strong>
              </div>
            </div>

            <div className="event-detail__fact">
              <Users size={17} />
              <div>
                <span>Attendance</span>
                <strong>{event.capacity}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="event-detail__body">
        <div className="event-detail__main">
          <section className="event-detail__section">
            <h2>About this event</h2>
            {event.content.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>

          <section className="event-detail__section">
            <h2>What this event includes</h2>
            <ul className="event-detail__list">
              {event.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="event-detail__section">
            <h2>Who should attend</h2>
            <ul className="event-detail__list">
              {event.audience.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="event-detail__sidebar">
          <div className="event-detail__panel">
            <p className="event-detail__panel-label">Organizer</p>
            <h3>{event.organizer}</h3>
            <p>
              This event is connected to Sajha Entrance or one of its education partners and can
              lead directly into guidance, preparation, or institution discovery.
            </p>
            <Link to={event.relatedLink} className="event-detail__panel-link">
              {event.relatedCta}
              <ArrowUpRight size={16} />
            </Link>
          </div>

          {relatedEvents.length ? (
            <div className="event-detail__panel">
              <p className="event-detail__panel-label">More events</p>
              <div className="event-detail__related-list">
                {relatedEvents.map((item) => (
                  <Link key={item.id} to={`/events/${item.id}`} className="event-detail__related-item">
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

const EventNotFound = () => (
  <div className="events-hub__empty">
    <h3>That event could not be found.</h3>
    <p>The link may be outdated, or the event may no longer be listed.</p>
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

  const sortedEvents = useMemo(
    () =>
      [...EVENTS].sort(
        (left, right) => new Date(left.startAt) - new Date(right.startAt)
      ),
    []
  );

  const selectedEvent = useMemo(
    () => sortedEvents.find((item) => item.id === id),
    [id, sortedEvents]
  );

  const relatedEvents = useMemo(() => {
    if (!selectedEvent) {
      return [];
    }

    return sortedEvents.filter((item) => item.id !== selectedEvent.id).slice(0, 3);
  }, [selectedEvent, sortedEvents]);

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: CATEGORY_LABELS.all },
      ...Object.entries(
        sortedEvents.reduce((accumulator, item) => {
          accumulator[item.category] = true;
          return accumulator;
        }, {})
      )
        .sort((left, right) => left[0].localeCompare(right[0]))
        .map(([value]) => ({
          value,
          label: CATEGORY_LABELS[value] || value,
        })),
    ],
    [sortedEvents]
  );

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return sortedEvents.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        item.title,
        item.label,
        item.summary,
        item.venue,
        item.organizer,
        item.category,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [categoryFilter, searchTerm, sortedEvents]);

  return (
    <div className="events-hub">
      <div className="container-fluid events-hub__container">
        {id && !selectedEvent ? (
          <EventNotFound />
        ) : selectedEvent ? (
          <EventDetail event={selectedEvent} relatedEvents={relatedEvents} />
        ) : (
          <>
            <div className="events-hub__header">
              <div className="events-hub__heading">
                <p className="events-hub__eyebrow">Sajha events</p>
                <h1 className="events-hub__title">Browse events and open a dedicated page for each one.</h1>
                <p className="events-hub__subtitle">
                  Every event card now opens its own detail page so students and families can read
                  the full context before moving on to a course, scholarship, or college page.
                </p>
              </div>

              <div className="events-hub__controls">
                <label className="events-hub__select-wrap">
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
              </div>
            </div>

            {filteredEvents.length ? (
              <div className="events-hub__grid">
                {filteredEvents.map((item) => {
                  const status = getStatus(item.startAt, item.endAt);

                  return (
                    <Link key={item.id} to={`/events/${item.id}`} className="events-hub__card">
                      <div className="events-hub__card-image-wrap">
                        <img src={item.image} alt={item.title} className="events-hub__card-image" />
                        <div className="events-hub__card-date">
                          <span>{monthShort(item.startAt)}</span>
                          <strong>{dayNumber(item.startAt)}</strong>
                        </div>
                      </div>

                      <div className="events-hub__card-content">
                        <div className="events-hub__card-topline">
                          <p className="events-hub__card-category">{item.label}</p>
                          <span className={`events-hub__card-status events-hub__card-status--${status.tone}`}>
                            {status.label}
                          </span>
                        </div>

                        <h2 className="events-hub__card-title">{item.title}</h2>
                        <p className="events-hub__card-summary">{item.summary}</p>

                        <div className="events-hub__card-meta">
                          <span>
                            <CalendarDays size={16} />
                            {formatDateRange(item.startAt, item.endAt)}
                          </span>
                          <span>
                            <MapPin size={16} />
                            {item.venue}
                          </span>
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
