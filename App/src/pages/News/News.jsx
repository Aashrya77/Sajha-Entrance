import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Search } from 'lucide-react';
import { newsAPI } from '../../api/services';
import { getImageUrl } from '../../utils/imageHelper';
import { STATIC_NEWS_ITEMS } from '../../data/staticNewsEvents';
import Loader from '../../components/Loader/Loader';
import '../../styles/news.css';

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

const toStaticArticle = (item) => ({
  slug: item.id,
  legacyId: item.id,
  title: item.title,
  category: item.category,
  publishedAt: item.createdAt,
  excerpt: item.excerpt,
  image: item.image,
  imageAlt: item.title,
  contentHtml: item.content.map((paragraph) => `<p>${paragraph}</p>`).join(''),
});

const staticArticles = STATIC_NEWS_ITEMS.map(toStaticArticle);

const resolveArticleImage = (article) => {
  const imagePath = article.featuredImageUrl || article.featuredImage || article.image;
  if (!imagePath) return '/img/learn.png';
  if (imagePath.startsWith('/img/') || imagePath.startsWith('/sajhaphoto/')) return imagePath;
  return getImageUrl(imagePath, 'news');
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
      <img
        src={resolveArticleImage(article)}
        alt={article.imageAlt || article.title}
        className="news-directory__detail-image"
      />
    </div>

    <p className="news-directory__detail-kicker">
      {formatDate(article.publishedAt).toUpperCase()} - {(article.category || 'General').toUpperCase()}
    </p>
    <h1 className="news-directory__detail-title">{article.title}</h1>
    <div
      className="news-directory__detail-body"
      dangerouslySetInnerHTML={{ __html: article.content || article.contentHtml || '' }}
    />
  </div>
);

const News = () => {
  const { id } = useParams();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
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
        const response = await newsAPI.getNewsByIdentifier(id);
        if (!cancelled && response.data?.success) {
          setSelectedArticle(response.data.data.news);
          setUsingFallback(false);
        }
      } catch (error) {
        const shouldUseFallback = !error.response || error.response.status >= 500;
        const fallbackArticle = shouldUseFallback
          ? staticArticles.find((item) => item.slug === id || item.legacyId === id)
          : null;
        if (!cancelled) {
          setSelectedArticle(fallbackArticle || null);
          setUsingFallback(Boolean(fallbackArticle));
          setApiError(fallbackArticle ? '' : 'That news article could not be found.');
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
        const response = await newsAPI.getNews({
          page: currentPage,
          search: submittedSearch,
          category: categoryFilter,
        });
        const apiNews = response.data?.data?.news || [];
        if (!cancelled) {
          setArticles(apiNews);
          setCategories(response.data?.data?.categories || []);
          setPagination(response.data?.data?.pagination || { previousPage: 0, nextPage: 0 });
          setUsingFallback(false);
        }
      } catch (error) {
        const shouldUseFallback = !error.response || error.response.status >= 500;
        if (!cancelled) {
          setArticles(shouldUseFallback ? staticArticles : []);
          setCategories([]);
          setPagination({ previousPage: 0, nextPage: 0 });
          setUsingFallback(shouldUseFallback);
          setApiError(
            shouldUseFallback
              ? 'Showing saved news while the live feed is unavailable.'
              : 'News could not be loaded.'
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

  const categoryOptions = useMemo(() => {
    const sourceCategories = categories.length
      ? categories
      : staticArticles.map((item) => item.category).filter(Boolean);
    const uniqueCategories = [...new Set(sourceCategories)].sort((left, right) => left.localeCompare(right));

    return [
      { value: 'all', label: 'Category' },
      ...uniqueCategories.map((value) => ({ value, label: CATEGORY_LABELS[value] || value })),
    ];
  }, [categories]);

  const visibleArticles = useMemo(() => {
    if (!usingFallback) return articles;
    const normalizedSearch = submittedSearch.trim().toLowerCase();

    return articles.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (!normalizedSearch) return true;
      return [item.title, item.excerpt, item.category].join(' ').toLowerCase().includes(normalizedSearch);
    });
  }, [articles, categoryFilter, submittedSearch, usingFallback]);

  const handleSearch = (event) => {
    event.preventDefault();
    setCurrentPage(1);
    setSubmittedSearch(searchTerm);
  };

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  return (
    <div className="news-directory">
      <div className="container-fluid news-directory__container">
        {id ? (
          selectedArticle ? (
            <NewsDetail article={selectedArticle} />
          ) : (
            <div className="news-directory__empty">
              <h3>That news article could not be found.</h3>
              <p>{apiError || 'The link may be outdated, or the article may no longer be published.'}</p>
              <Link to="/news" className="news-directory__back">Back to news</Link>
            </div>
          )
        ) : (
          <>
            <div className="news-directory__header">
              <div className="news-directory__heading">
                <h1 className="news-directory__title">News</h1>
                <p className="news-directory__subtitle">
                  Stay updated with the latest education-sector news and student-focused announcements.
                </p>
              </div>

              <form className="news-directory__controls" onSubmit={handleSearch}>
                <label className="news-directory__select-wrap">
                  <select
                    value={categoryFilter}
                    onChange={(event) => {
                      setCurrentPage(1);
                      setCategoryFilter(event.target.value);
                    }}
                    aria-label="Filter news by category"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
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
              </form>
            </div>

            {apiError ? <div className="news-directory__empty"><p>{apiError}</p></div> : null}

            {visibleArticles.length ? (
              <>
                <div className="news-directory__grid">
                  {visibleArticles.map((item) => (
                    <Link
                      key={item.slug || item.legacyId}
                      to={`/news/${item.slug || item.legacyId}`}
                      className="news-directory__card"
                    >
                      <div className="news-directory__hero">
                        <img
                          src={resolveArticleImage(item)}
                          alt={item.imageAlt || item.title}
                          className="news-directory__hero-image"
                        />
                      </div>

                      <div className="news-directory__content">
                        <p className="news-directory__meta-line">
                          {formatDate(item.publishedAt).toUpperCase()} - {(item.category || 'General').toUpperCase()}
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
