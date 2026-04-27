import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Search } from 'lucide-react';
import '../../styles/news.css';

const NEWS_ITEMS = [
  {
    id: 'ministry-politics-free-education',
    title: 'Ministry Emphasizes Politics-Free Education Sector',
    category: 'Others',
    createdAt: '2026-04-26',
    excerpt:
      'Kathmandu, April 26: The Ministry of Education, Science and Technology has advanced a drive to free the education sector from political meddling and strengthen student-focused governance.',
    image: '/img/learn.png',
    content: [
      'The Ministry of Education, Science and Technology has said that keeping schools and campuses focused on academic quality remains a national priority.',
      'Officials highlighted the need for institutions to reduce political interference, improve classroom delivery, and create a more stable environment for students and teachers.',
      'The ministry also noted that reforms will be coordinated with universities, local governments, and partner institutions in the months ahead.',
    ],
  },
  {
    id: 'womens-access-higher-education',
    title: "Scholarship scheme for promoting women's access to higher education implemented",
    category: 'Scholarship',
    createdAt: '2026-04-26',
    excerpt:
      "A new scholarship initiative has been rolled out to increase women's access to higher education, with local authorities focusing on long-term participation and retention.",
    image: '/img/scholar.png',
    content: [
      "The scholarship scheme has been introduced to support women pursuing higher education in public and community institutions.",
      'Program coordinators say the support package is designed to reduce financial barriers and encourage continued enrollment for students from underserved backgrounds.',
      'Implementation guidelines and application support are expected to be distributed through municipal and institutional channels.',
    ],
  },
  {
    id: 'bhimdutta-scholarships-for-women',
    title: 'Bhimdatta Municipality Launches Higher Education Scholarships for Women',
    category: 'Others',
    createdAt: '2026-04-26',
    excerpt:
      "Bhimdatta Municipality has launched a scholarship program designed to expand higher education opportunities for daughters and daughters-in-law across the region.",
    image: '/img/contact.png',
    content: [
      'Bhimdatta Municipality has announced a new education support scheme targeting women entering higher education.',
      'Local leaders described the program as part of a broader effort to improve educational access, social mobility, and family-level economic resilience.',
      'Students will be able to receive information about eligibility, required documents, and timelines through local education offices.',
    ],
  },
  {
    id: 'research-grants-students-nepal',
    title: 'Research Grant Windows Open for Undergraduate and Graduate Students',
    category: 'Research',
    createdAt: '2026-04-24',
    excerpt:
      'Several institutions have opened new research grant opportunities for students working in science, technology, education, and public policy disciplines.',
    image: '/img/re.png',
    content: [
      'Universities and partner organizations have opened grant windows to encourage student-led research in applied and academic disciplines.',
      'Applicants are expected to submit concept notes, brief proposals, and institutional endorsements based on the program guidelines.',
      'The grants are intended to support both new research activity and small-scale dissemination or innovation projects.',
    ],
  },
  {
    id: 'tu-it-curriculum-update',
    title: 'Tribhuvan University Revises IT Curriculum for Greater Industry Alignment',
    category: 'Education',
    createdAt: '2026-04-22',
    excerpt:
      'Tribhuvan University has updated selected IT-related curricula with a stronger emphasis on practical work, project-based learning, and contemporary tools.',
    image: '/img/hero-img.png',
    content: [
      'Updated course structures are expected to place more emphasis on hands-on learning, practical labs, and student project work.',
      'Faculty members say the revisions are intended to better match graduate skills with employer expectations and current technical practices.',
      'The curriculum update is also expected to influence affiliated institutions delivering related programs.',
    ],
  },
  {
    id: 'career-fair-2026-announced',
    title: 'Career Fair 2026 Announced with Participation from Colleges and Employers',
    category: 'Events',
    createdAt: '2026-04-20',
    excerpt:
      'An annual career fair in Kathmandu will bring together colleges, employers, and student communities for guidance, recruitment, and networking sessions.',
    image: '/img/exam.png',
    content: [
      'Organizers say the fair will feature institution booths, career talks, and sessions focused on employability and academic pathways.',
      'Students will be able to meet counselors, faculty representatives, and employers in one venue.',
      'Additional schedule details and participation guidelines are expected closer to the event date.',
    ],
  },
  {
    id: 'online-learning-initiative',
    title: 'Online Learning Initiative Expanded Across Partner Institutions',
    category: 'Technology',
    createdAt: '2026-04-18',
    excerpt:
      'A wider digital learning push is being introduced to improve access to academic resources, recorded content, and hybrid learning support.',
    image: '/img/online.png',
    content: [
      'Partner institutions are expanding their use of online learning tools to support both classroom teaching and self-paced study.',
      'The initiative is expected to improve access for students balancing travel, work, or remote learning needs.',
      'Institutions involved say the next phase will focus on content quality, platform reliability, and student onboarding.',
    ],
  },
  {
    id: 'new-campus-facilities-pokhara',
    title: 'New Campus Facilities Announced to Support Growing Student Demand',
    category: 'Infrastructure',
    createdAt: '2026-04-16',
    excerpt:
      'New academic facilities and student support spaces are being prepared to accommodate increasing enrollment and updated program delivery needs.',
    image: '/img/physical.png',
    content: [
      'Institutions expanding their campuses say new infrastructure will support labs, student services, and more flexible learning environments.',
      'Administrators expect the improved facilities to help meet growth in enrollment and provide a better overall student experience.',
      'The projects are being framed as part of a longer-term push toward quality improvement and institutional readiness.',
    ],
  },
];

const CATEGORY_LABELS = {
  all: 'Category',
  Education: 'Education',
  Events: 'Events',
  Infrastructure: 'Infrastructure',
  Others: 'Others',
  Research: 'Research',
  Scholarship: 'Scholarship',
  Technology: 'Technology',
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

const NewsDetail = ({ article }) => (
  <div className="news-directory__detail">
    <Link to="/news" className="news-directory__back">
      <ArrowLeft size={16} />
      Back to news
    </Link>

    <div className="news-directory__detail-hero">
      <img src={article.image} alt={article.title} className="news-directory__detail-image" />
    </div>

    <p className="news-directory__detail-kicker">
      {formatDate(article.createdAt).toUpperCase()} - {article.category.toUpperCase()}
    </p>
    <h1 className="news-directory__detail-title">{article.title}</h1>
    <div className="news-directory__detail-body">
      {article.content.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  </div>
);

const News = () => {
  const { id } = useParams();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const article = useMemo(
    () => NEWS_ITEMS.find((item) => item.id === id),
    [id]
  );

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'Category' },
      ...Object.entries(
        NEWS_ITEMS.reduce((accumulator, item) => {
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
    []
  );

  const filteredNews = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return NEWS_ITEMS.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        item.title,
        item.excerpt,
        item.category,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [categoryFilter, searchTerm]);

  return (
    <div className="news-directory">
      <div className="container-fluid news-directory__container">
        {article ? (
          <NewsDetail article={article} />
        ) : (
          <>
            <div className="news-directory__header">
              <div className="news-directory__heading">
                <h1 className="news-directory__title">News</h1>
                <p className="news-directory__subtitle">
                  Stay updated with the latest education-sector news and student-focused announcements.
                </p>
              </div>

              <div className="news-directory__controls">
                <label className="news-directory__select-wrap">
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    aria-label="Filter news by category"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="news-directory__search">
                  <Search size={18} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search for news..."
                    aria-label="Search news"
                  />
                </label>
              </div>
            </div>

            {filteredNews.length ? (
              <div className="news-directory__grid">
                {filteredNews.map((item) => (
                  <Link key={item.id} to={`/news/${item.id}`} className="news-directory__card">
                    <div className="news-directory__hero">
                      <img src={item.image} alt={item.title} className="news-directory__hero-image" />
                    </div>

                    <div className="news-directory__content">
                      <p className="news-directory__meta-line">
                        {formatDate(item.createdAt).toUpperCase()} - {item.category.toUpperCase()}
                      </p>

                      <h2 className="news-directory__card-title">{item.title}</h2>

                      <p className="news-directory__excerpt">{item.excerpt}</p>

                      <div className="news-directory__cta">
                        Read story
                        <ArrowUpRight size={16} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="news-directory__empty">
                <h3>No news matched your search.</h3>
                <p>Try another category or broader search terms.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default News;
