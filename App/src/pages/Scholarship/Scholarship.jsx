import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Award,
  Banknote,
  Building2,
  Globe2,
  Microscope,
  Search,
} from 'lucide-react';
import { collegeAPI, universityAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';
import { getImageFieldUrl } from '../../utils/imageHelper';
import '../../styles/scholarship.css';

const CATEGORY_META = {
  all: {
    label: 'All Categories',
    color: '#1f3c68',
    icon: Award,
  },
  merit: {
    label: 'Merit Scholarship',
    color: '#1f6feb',
    icon: Award,
  },
  need: {
    label: 'Need-Based Aid',
    color: '#cf5f22',
    icon: Banknote,
  },
  research: {
    label: 'Research Grant',
    color: '#0f766e',
    icon: Microscope,
  },
  international: {
    label: 'International',
    color: '#7c3aed',
    icon: Globe2,
  },
  institutional: {
    label: 'Institutional',
    color: '#475569',
    icon: Building2,
  },
};

const cleanText = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const formatDate = (value) => {
  if (!value) {
    return 'Recently updated';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Recently updated';
  }

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const shortenText = (value, maxLength = 170) => {
  if (!value) {
    return '';
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trim()}...`;
};

const classifyCategory = (text) => {
  const source = cleanText(text).toLowerCase();

  if (/\b(research|grant|fellowship|proposal|innovation)\b/.test(source)) {
    return 'research';
  }

  if (/\b(exchange|international|abroad|global|foreign)\b/.test(source)) {
    return 'international';
  }

  if (/\b(need|financial aid|disadvantaged|underprivileged|marginalized|rural)\b/.test(source)) {
    return 'need';
  }

  if (/\b(merit|meritorious|academic excellence|excellent|topper|performance)\b/.test(source)) {
    return 'merit';
  }

  return 'institutional';
};

const buildTopics = (text) => {
  const source = cleanText(text).toLowerCase();
  const topics = [];

  if (/\b(bachelor|undergraduate)\b/.test(source)) {
    topics.push('Undergraduate');
  }

  if (/\b(master|graduate|postgraduate|phd|doctorate)\b/.test(source)) {
    topics.push('Graduate');
  }

  if (/\b(merit|meritorious|performance)\b/.test(source)) {
    topics.push('Merit');
  }

  if (/\b(need|financial aid|disadvantaged|underprivileged|marginalized|rural)\b/.test(source)) {
    topics.push('Need-Based');
  }

  if (/\b(research|grant|fellowship|innovation)\b/.test(source)) {
    topics.push('Research');
  }

  if (/\b(international|exchange|abroad|foreign)\b/.test(source)) {
    topics.push('International');
  }

  return topics.length ? topics.slice(0, 3) : ['Scholarship Support'];
};

const buildTitle = (institutionName, category) => {
  switch (category) {
    case 'research':
      return `Research grants and scholarship support at ${institutionName}`;
    case 'need':
      return `Need-based scholarship support at ${institutionName}`;
    case 'international':
      return `International scholarship opportunities at ${institutionName}`;
    case 'merit':
      return `Merit scholarship opportunities at ${institutionName}`;
    default:
      return `Scholarship opportunities at ${institutionName}`;
  }
};

const buildMetaLine = (record, kind) => {
  if (kind === 'university') {
    const details = [cleanText(record.type), cleanText(record.universityAddress)].filter(Boolean);
    return details.join(' | ');
  }

  const details = [cleanText(record.universityName), cleanText(record.collegeAddress)].filter(Boolean);
  return details.join(' | ');
};

const normalizeScholarship = (record, kind) => {
  const institutionName =
    kind === 'college' ? cleanText(record.collegeName) : cleanText(record.universityName);
  const scholarshipText = cleanText(record.scholarshipInfo);
  const category = classifyCategory(scholarshipText);
  const publishedRaw = record.createdAt ? new Date(record.createdAt).getTime() : 0;
  const updatedRaw = record.updatedAt ? new Date(record.updatedAt).getTime() : publishedRaw;

  return {
    id: `${kind}-${record._id}`,
    title: buildTitle(institutionName, category),
    category,
    description: shortenText(scholarshipText, 200),
    provider: institutionName,
    topics: buildTopics(scholarshipText),
    metaLine: buildMetaLine(record, kind),
    kindLabel: kind === 'college' ? 'College' : 'University',
    kind,
    link: kind === 'college' ? `/college/${record._id}` : `/university/${record._id}`,
    logoUrl:
      kind === 'college'
        ? getImageFieldUrl(record, 'collegeLogo', 'colleges')
        : getImageFieldUrl(record, 'universityLogo', 'universities'),
    publishedAt: formatDate(record.createdAt),
    updatedAt: formatDate(record.updatedAt || record.createdAt),
    sortTime: Number.isNaN(updatedRaw) ? 0 : updatedRaw,
  };
};

const fetchAllPages = async (fetchPage, dataKey) => {
  const items = [];
  let page = 1;

  while (page) {
    const response = await fetchPage(page);
    const payload = response?.data?.data;
    const records = payload?.[dataKey] || [];
    const nextPage = payload?.nextPage || 0;

    items.push(...records);

    if (!records.length || !nextPage || nextPage === page) {
      break;
    }

    page = nextPage;
  }

  return items;
};

const Scholarship = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scholarships, setScholarships] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadScholarships = async () => {
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

        const colleges =
          collegesResult.status === 'fulfilled'
            ? collegesResult.value
                .filter((item) => cleanText(item.scholarshipInfo))
                .map((item) => normalizeScholarship(item, 'college'))
            : [];

        const universities =
          universitiesResult.status === 'fulfilled'
            ? universitiesResult.value
                .filter((item) => cleanText(item.scholarshipInfo))
                .map((item) => normalizeScholarship(item, 'university'))
            : [];

        if (collegesResult.status === 'rejected' && universitiesResult.status === 'rejected') {
          setError('We could not load scholarships right now. Please try again shortly.');
        } else if (
          collegesResult.status === 'rejected' ||
          universitiesResult.status === 'rejected'
        ) {
          setError('Some scholarship entries could not be loaded, so this list may be incomplete.');
        }

        const merged = [...universities, ...colleges].sort(
          (left, right) => right.sortTime - left.sortTime
        );

        setScholarships(merged);
      } catch (requestError) {
        console.error('Error loading scholarships:', requestError);

        if (!ignore) {
          setScholarships([]);
          setError('We could not load scholarships right now. Please try again shortly.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadScholarships();

    return () => {
      ignore = true;
    };
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredScholarships = scholarships.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const searchableText = [
      item.title,
      item.description,
      item.provider,
      item.metaLine,
      item.topics.join(' '),
      CATEGORY_META[item.category]?.label || '',
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  const categoryOptions = [
    { value: 'all', label: 'Category' },
    ...Object.entries(
      scholarships.reduce((accumulator, item) => {
        accumulator[item.category] = (accumulator[item.category] || 0) + 1;
        return accumulator;
      }, {})
    )
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([value]) => ({
        value,
        label: CATEGORY_META[value]?.label || value,
      })),
  ];

  if (loading) {
    return (
      <div className="container mt-5 pt-5 d-flex justify-content-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="scholarships-directory">
      <div className="container-fluid scholarships-directory__container">
        <div className="scholarships-directory__header">
          <div className="scholarships-directory__heading">
            <h1 className="scholarships-directory__title">Scholarships and Grants</h1>
            <p className="scholarships-directory__subtitle">
              Explore scholarship support already published by colleges and universities.
            </p>
          </div>

          <div className="scholarships-directory__controls">
            <label className="scholarships-directory__select-wrap">
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter scholarships by category"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="scholarships-directory__search">
              <Search size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search for scholarships..."
                aria-label="Search scholarships"
              />
            </label>
          </div>
        </div>

        {error && <div className="scholarships-directory__alert">{error}</div>}

        {filteredScholarships.length ? (
          <div className="scholarships-directory__grid">
            {filteredScholarships.map((item) => {
              const category = CATEGORY_META[item.category] || CATEGORY_META.institutional;
              const Icon = category.icon;

              return (
                <Link key={item.id} to={item.link} className="scholarships-directory__card">
                  <div className="scholarships-directory__hero">
                    <div
                      className="scholarships-directory__icon-box"
                      style={{ color: category.color }}
                    >
                      <Icon size={30} />
                    </div>

                    {item.logoUrl ? (
                      <img
                        src={item.logoUrl}
                        alt={item.provider}
                        className="scholarships-directory__logo"
                      />
                    ) : (
                      <span className="scholarships-directory__kind">
                        {item.kindLabel}
                      </span>
                    )}
                  </div>

                  <p className="scholarships-directory__topics">
                    {item.topics.join(', ').toUpperCase()}
                  </p>

                  <h2 className="scholarships-directory__card-title">{item.title}</h2>

                  <p className="scholarships-directory__provider">
                    <span
                      className="scholarships-directory__category-dot"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.label}
                  </p>

                  <p className="scholarships-directory__description">{item.description}</p>

                  <p className="scholarships-directory__meta">{item.metaLine}</p>

                  <div className="scholarships-directory__dates">
                    <span>Published: {item.publishedAt}</span>
                    <span>Updated: {item.updatedAt}</span>
                  </div>

                  <div className="scholarships-directory__card-link">
                    View details
                    <ArrowUpRight size={16} />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="scholarships-directory__empty">
            <h3>
              {scholarships.length
                ? 'No scholarships matched your search.'
                : 'No scholarship entries have been published yet.'}
            </h3>
            <p>
              {scholarships.length
                ? 'Try a different category or broader search term.'
                : 'Once colleges and universities add scholarship information, it will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scholarship;
