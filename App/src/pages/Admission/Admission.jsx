import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  MapPin,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { collegeAPI, universityAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';
import '../../styles/admission.css';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'closingSoon', label: 'Closing Soon' },
  { value: 'rolling', label: 'Rolling' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_META = {
  open: { label: 'Open', sort: 0 },
  closingSoon: { label: 'Closing Soon', sort: 1 },
  rolling: { label: 'Rolling', sort: 2 },
  closed: { label: 'Closed', sort: 3 },
};

const LEVEL_PATTERNS = [
  { label: 'PhD', pattern: /\b(ph\.?d|doctorate)\b/i },
  { label: 'Master', pattern: /\b(master|masters|mba|mca|msc|m\.sc|ma|m\.a|med|m\.ed|mtech|m\.tech|mit)\b/i },
  { label: 'Bachelor', pattern: /\b(bachelor|bba|bca|bbs|bsc|b\.sc|ba|b\.a|be|bit|bim|llb|btech|b\.tech)\b/i },
  { label: 'Plus Two', pattern: /\b(\+2|plus two|ten\+two|higher secondary|11\/12)\b/i },
  { label: 'Diploma', pattern: /\b(diploma|pre-diploma)\b/i },
  { label: 'Training', pattern: /\b(training|bootcamp|certificate|short term)\b/i },
];

const cleanText = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const formatDate = (value) => {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getStatus = (closeDate) => {
  if (!closeDate) {
    return 'rolling';
  }

  const parsed = new Date(closeDate);

  if (Number.isNaN(parsed.getTime())) {
    return 'rolling';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);

  const daysRemaining = Math.ceil((parsed.getTime() - today.getTime()) / MS_PER_DAY);

  if (daysRemaining < 0) {
    return 'closed';
  }

  if (daysRemaining <= 14) {
    return 'closingSoon';
  }

  return 'open';
};

const getLocationLabel = (address = '') => {
  const text = cleanText(address);
  const parts = text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!parts.length) {
    return 'Location not specified';
  }

  return parts[parts.length - 1];
};

const deriveLevels = (input) => {
  const source = cleanText(input);
  const matchedLevels = LEVEL_PATTERNS.filter(({ pattern }) => pattern.test(source)).map(
    ({ label }) => label
  );

  return matchedLevels.length ? matchedLevels : ['General'];
};

const buildDateLine = (publishedAt, closeDate) => {
  const publishedText = formatDate(publishedAt);
  const closeText = formatDate(closeDate);

  if (publishedText && closeText) {
    return `From ${publishedText} Until ${closeText}`;
  }

  if (closeText) {
    return `Apply until ${closeText}`;
  }

  if (publishedText) {
    return `Updated ${publishedText}`;
  }

  return 'Admission timeline will be updated soon';
};

const buildSummary = (record, kind, affiliation, programCount) => {
  const overviewText = cleanText(record.overview);

  if (overviewText) {
    return overviewText.length > 180 ? `${overviewText.slice(0, 177).trim()}...` : overviewText;
  }

  const summaryParts = [];

  if (kind === 'college' && affiliation && affiliation !== cleanText(record.collegeName)) {
    summaryParts.push(`Affiliated to ${affiliation}`);
  }

  if (kind === 'university' && record.type) {
    summaryParts.push(`${cleanText(record.type)} university`);
  }

  if (programCount) {
    summaryParts.push(`${programCount} program${programCount > 1 ? 's' : ''} listed`);
  }

  return summaryParts.join(' | ') || 'Updated admission information is available for this institution.';
};

const normalizeAdmission = (record, kind) => {
  const institutionName =
    kind === 'college' ? cleanText(record.collegeName) : cleanText(record.universityName);
  const affiliation =
    kind === 'college'
      ? cleanText(record.universityName) || 'Independent'
      : cleanText(record.universityName) || 'University';
  const noticeText = cleanText(record.admissionNotice);
  const programNames = (record.coursesOffered || [])
    .map((course) => cleanText(course.fullForm || course.title || course.courseName || ''))
    .filter(Boolean);
  const levels = deriveLevels([noticeText, ...programNames].join(' '));
  const programCount = programNames.length;
  const title = noticeText || `${institutionName} admission notice`;

  return {
    id: `${kind}-${record._id}`,
    title,
    summary: buildSummary(record, kind, affiliation, programCount),
    institutionName,
    affiliation,
    location: getLocationLabel(kind === 'college' ? record.collegeAddress : record.universityAddress),
    kind,
    kindLabel: kind === 'college' ? 'College' : 'University',
    levels,
    programs: programNames,
    status: getStatus(record.admissionCloseDate),
    closeDate: record.admissionCloseDate || null,
    publishedAt: record.createdAt || record.updatedAt || null,
    dateLine: buildDateLine(record.createdAt || record.updatedAt, record.admissionCloseDate),
    link: kind === 'college' ? `/college/${record._id}` : `/university/${record._id}`,
  };
};

const fetchAllPages = async (fetchPage, dataKey) => {
  const records = [];
  let page = 1;

  while (page) {
    const response = await fetchPage(page);
    const payload = response?.data?.data;
    const pageRecords = payload?.[dataKey] || [];
    const nextPage = payload?.nextPage || 0;

    records.push(...pageRecords);

    if (!pageRecords.length || !nextPage || nextPage === page) {
      break;
    }

    page = nextPage;
  }

  return records;
};

const buildOptionCounts = (values, sortOrder = []) => {
  const counts = values.reduce((accumulator, value) => {
    if (!value) {
      return accumulator;
    }

    accumulator[value] = (accumulator[value] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .map(([value, count]) => ({
      value,
      label: value,
      count,
    }))
    .sort((left, right) => {
      const leftIndex = sortOrder.indexOf(left.value);
      const rightIndex = sortOrder.indexOf(right.value);

      if (leftIndex !== -1 || rightIndex !== -1) {
        if (leftIndex === -1) return 1;
        if (rightIndex === -1) return -1;
        return leftIndex - rightIndex;
      }

      return left.label.localeCompare(right.label);
    });
};

const Admission = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [admissions, setAdmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedAffiliations, setSelectedAffiliations] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [levelSearch, setLevelSearch] = useState('');
  const [affiliationSearch, setAffiliationSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    level: true,
    affiliation: true,
    location: false,
  });

  useEffect(() => {
    let ignore = false;

    const loadAdmissions = async () => {
      setLoading(true);
      setError('');

      try {
        const [collegesResult, universitiesResult] = await Promise.allSettled([
          fetchAllPages((page) => collegeAPI.getAllColleges(page, '', ''), 'colleges'),
          fetchAllPages((page) => universityAPI.getAllUniversities(page, '', ''), 'universities'),
        ]);

        if (ignore) {
          return;
        }

        const collegeRecords =
          collegesResult.status === 'fulfilled' ? collegesResult.value : [];
        const universityRecords =
          universitiesResult.status === 'fulfilled' ? universitiesResult.value : [];

        if (collegesResult.status === 'rejected' && universitiesResult.status === 'rejected') {
          setError('We could not load admissions right now. Please try again shortly.');
        } else if (
          collegesResult.status === 'rejected' ||
          universitiesResult.status === 'rejected'
        ) {
          setError('Some admissions could not be loaded, so the list may be incomplete.');
        }

        const mergedAdmissions = [
          ...collegeRecords
            .filter((record) => cleanText(record.admissionNotice) || record.admissionCloseDate)
            .map((record) => normalizeAdmission(record, 'college')),
          ...universityRecords
            .filter((record) => cleanText(record.admissionNotice) || record.admissionCloseDate)
            .map((record) => normalizeAdmission(record, 'university')),
        ].sort((left, right) => {
          const statusDifference = STATUS_META[left.status].sort - STATUS_META[right.status].sort;

          if (statusDifference !== 0) {
            return statusDifference;
          }

          const leftCloseDate = left.closeDate
            ? new Date(left.closeDate).getTime()
            : Number.MAX_SAFE_INTEGER;
          const rightCloseDate = right.closeDate
            ? new Date(right.closeDate).getTime()
            : Number.MAX_SAFE_INTEGER;

          if (leftCloseDate !== rightCloseDate) {
            return leftCloseDate - rightCloseDate;
          }

          return left.title.localeCompare(right.title);
        });

        setAdmissions(mergedAdmissions);
      } catch (requestError) {
        console.error('Error loading admissions:', requestError);

        if (!ignore) {
          setAdmissions([]);
          setError('We could not load admissions right now. Please try again shortly.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadAdmissions();

    return () => {
      ignore = true;
    };
  }, []);

  const statusOptions = STATUS_OPTIONS.map((option) => ({
    ...option,
    count: admissions.filter((item) => item.status === option.value).length,
  }));
  const levelOptions = buildOptionCounts(
    admissions.flatMap((item) => item.levels),
    [...LEVEL_PATTERNS.map((item) => item.label), 'General']
  );
  const affiliationOptions = buildOptionCounts(admissions.map((item) => item.affiliation));
  const locationOptions = buildOptionCounts(admissions.map((item) => item.location));
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredAdmissions = admissions.filter((item) => {
    if (normalizedSearchTerm) {
      const searchableText = [
        item.title,
        item.summary,
        item.institutionName,
        item.affiliation,
        item.location,
        item.levels.join(' '),
        item.programs.join(' '),
      ]
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(normalizedSearchTerm)) {
        return false;
      }
    }

    if (selectedStatuses.length && !selectedStatuses.includes(item.status)) {
      return false;
    }

    if (
      selectedLevels.length &&
      !selectedLevels.some((selectedLevel) => item.levels.includes(selectedLevel))
    ) {
      return false;
    }

    if (
      selectedAffiliations.length &&
      !selectedAffiliations.includes(item.affiliation)
    ) {
      return false;
    }

    if (selectedLocations.length && !selectedLocations.includes(item.location)) {
      return false;
    }

    return true;
  });

  const visibleLevelOptions = levelOptions.filter((option) =>
    option.label.toLowerCase().includes(levelSearch.trim().toLowerCase())
  );
  const visibleAffiliationOptions = affiliationOptions.filter((option) =>
    option.label.toLowerCase().includes(affiliationSearch.trim().toLowerCase())
  );
  const visibleLocationOptions = locationOptions.filter((option) =>
    option.label.toLowerCase().includes(locationSearch.trim().toLowerCase())
  );
  const hasActiveFilters =
    Boolean(searchTerm) ||
    selectedStatuses.length > 0 ||
    selectedLevels.length > 0 ||
    selectedAffiliations.length > 0 ||
    selectedLocations.length > 0;

  const toggleSelection = (value, setter) => {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const toggleSection = (section) => {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatuses([]);
    setSelectedLevels([]);
    setSelectedAffiliations([]);
    setSelectedLocations([]);
    setLevelSearch('');
    setAffiliationSearch('');
    setLocationSearch('');
  };

  const renderChecklist = (options, selectedValues, onToggle, emptyMessage) => {
    if (!options.length) {
      return (
        <div className="admissions-directory__filter-empty">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="admissions-directory__checklist">
        {options.map((option) => (
          <label key={option.value} className="admissions-directory__checkitem">
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={() => onToggle(option.value)}
            />
            <span className="admissions-directory__checkcopy">{option.label}</span>
            <span className="admissions-directory__checkcount">{option.count}</span>
          </label>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mt-5 pt-5 d-flex justify-content-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="admissions-directory">
      <div className="container-fluid admissions-directory__container">
        <div className="admissions-directory__header">
          <div className="admissions-directory__heading">
            <span className="admissions-directory__eyebrow">Live intake updates</span>
            <h1 className="admissions-directory__title">Admissions</h1>
            <p className="admissions-directory__subtitle">
              Browse published admission notices from colleges and universities in one place.
            </p>
          </div>

          <label className="admissions-directory__search">
            <Search size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search for admissions..."
              aria-label="Search admissions"
            />
          </label>
        </div>

        {error && <div className="admissions-directory__alert">{error}</div>}

        <div className="admissions-directory__shell">
          <aside className="admissions-directory__sidebar">
            <div className="admissions-directory__sidebar-header">
              <span>
                <SlidersHorizontal size={16} />
                Filter admissions
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="admissions-directory__clear"
                  onClick={clearFilters}
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="admissions-directory__filter-group">
              <button
                type="button"
                className="admissions-directory__filter-toggle"
                onClick={() => toggleSection('status')}
              >
                <span>Status</span>
                <ChevronDown
                  size={16}
                  className={expandedSections.status ? 'is-open' : ''}
                />
              </button>
              {expandedSections.status &&
                renderChecklist(
                  statusOptions,
                  selectedStatuses,
                  (value) => toggleSelection(value, setSelectedStatuses),
                  'No statuses available.'
                )}
            </div>

            <div className="admissions-directory__filter-group">
              <button
                type="button"
                className="admissions-directory__filter-toggle"
                onClick={() => toggleSection('level')}
              >
                <span>Level</span>
                <ChevronDown
                  size={16}
                  className={expandedSections.level ? 'is-open' : ''}
                />
              </button>
              {expandedSections.level && (
                <div className="admissions-directory__filter-panel">
                  <label className="admissions-directory__mini-search">
                    <Search size={14} />
                    <input
                      type="text"
                      value={levelSearch}
                      onChange={(event) => setLevelSearch(event.target.value)}
                      placeholder="Search level"
                    />
                  </label>
                  {renderChecklist(
                    visibleLevelOptions,
                    selectedLevels,
                    (value) => toggleSelection(value, setSelectedLevels),
                    'No matching levels.'
                  )}
                </div>
              )}
            </div>

            <div className="admissions-directory__filter-group">
              <button
                type="button"
                className="admissions-directory__filter-toggle"
                onClick={() => toggleSection('affiliation')}
              >
                <span>Affiliation</span>
                <ChevronDown
                  size={16}
                  className={expandedSections.affiliation ? 'is-open' : ''}
                />
              </button>
              {expandedSections.affiliation && (
                <div className="admissions-directory__filter-panel">
                  <label className="admissions-directory__mini-search">
                    <Search size={14} />
                    <input
                      type="text"
                      value={affiliationSearch}
                      onChange={(event) => setAffiliationSearch(event.target.value)}
                      placeholder="Search affiliation"
                    />
                  </label>
                  {renderChecklist(
                    visibleAffiliationOptions,
                    selectedAffiliations,
                    (value) => toggleSelection(value, setSelectedAffiliations),
                    'No matching affiliations.'
                  )}
                </div>
              )}
            </div>

            <div className="admissions-directory__filter-group">
              <button
                type="button"
                className="admissions-directory__filter-toggle"
                onClick={() => toggleSection('location')}
              >
                <span>Location</span>
                <ChevronDown
                  size={16}
                  className={expandedSections.location ? 'is-open' : ''}
                />
              </button>
              {expandedSections.location && (
                <div className="admissions-directory__filter-panel">
                  <label className="admissions-directory__mini-search">
                    <Search size={14} />
                    <input
                      type="text"
                      value={locationSearch}
                      onChange={(event) => setLocationSearch(event.target.value)}
                      placeholder="Search location"
                    />
                  </label>
                  {renderChecklist(
                    visibleLocationOptions,
                    selectedLocations,
                    (value) => toggleSelection(value, setSelectedLocations),
                    'No matching locations.'
                  )}
                </div>
              )}
            </div>
          </aside>

          <section className="admissions-directory__results">
            <div className="admissions-directory__toolbar">
              <div>
                <p className="admissions-directory__count">
                  {filteredAdmissions.length} admission
                  {filteredAdmissions.length === 1 ? ' notice' : ' notices'}
                </p>
                <p className="admissions-directory__caption">
                  Showing institutions with published admission information.
                </p>
              </div>

              {hasActiveFilters && (
                <div className="admissions-directory__active">
                  <span>Filters active</span>
                  <button
                    type="button"
                    className="admissions-directory__clear admissions-directory__clear--inline"
                    onClick={clearFilters}
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            {filteredAdmissions.length ? (
              <div className="admissions-directory__list">
                {filteredAdmissions.map((admission) => (
                  <Link
                    key={admission.id}
                    to={admission.link}
                    className="admissions-directory__card"
                  >
                    <div className="admissions-directory__card-top">
                      <div className="admissions-directory__card-badges">
                        <span
                          className={`admissions-directory__pill admissions-directory__pill--${admission.kind}`}
                        >
                          {admission.kindLabel}
                        </span>
                        <span
                          className={`admissions-directory__pill admissions-directory__pill--status admissions-directory__pill--${admission.status}`}
                        >
                          {STATUS_META[admission.status].label}
                        </span>
                      </div>

                      <ArrowUpRight size={18} className="admissions-directory__card-arrow" />
                    </div>

                    <h2 className="admissions-directory__card-title">{admission.title}</h2>

                    <div className="admissions-directory__card-meta">
                      <span>
                        <Building2 size={15} />
                        {admission.institutionName}
                      </span>
                      <span>
                        <MapPin size={15} />
                        {admission.location}
                      </span>
                    </div>

                    <p className="admissions-directory__card-summary">{admission.summary}</p>

                    <div className="admissions-directory__card-tags">
                      <span className="admissions-directory__tag admissions-directory__tag--affiliation">
                        {admission.affiliation}
                      </span>
                      {admission.levels.slice(0, 3).map((level) => (
                        <span key={`${admission.id}-${level}`} className="admissions-directory__tag">
                          <GraduationCap size={13} />
                          {level}
                        </span>
                      ))}
                    </div>

                    <div className="admissions-directory__card-date">
                      <CalendarDays size={16} />
                      <span>{admission.dateLine}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="admissions-directory__empty">
                <h3>
                  {admissions.length
                    ? 'No admissions matched your filters.'
                    : 'No admission notices have been published yet.'}
                </h3>
                <p>
                  {admissions.length
                    ? 'Try clearing a few filters or searching with broader keywords.'
                    : 'Once colleges and universities add admission notices in the admin panel, they will appear here.'}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={clearFilters}
                  >
                    Show all admissions
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Admission;
