import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileImage,
  FileText,
  FolderOpen,
  Layers,
  List,
  Search,
  X,
} from "lucide-react";
import { questionBankAPI } from "../../api/services";
import { resolveBackendPath } from "../../api/config";
import "./PastQuestions.css";

const DEFAULT_EXAMS = [
  "CEE",
  "IOE",
  "BSc. CSIT",
  "BIT",
  "BCA",
  "CMAT",
  "NEB Class 11",
  "NEB Class 12",
  "Other",
];

const DEFAULT_TYPES = [
  "Model Question",
  "Past Question",
  "Practice Set",
  "Mock Test",
];

const DEFAULT_YEARS = ["2082", "2081", "2080", "2079"];
const QUESTION_LIMIT = 12;
const FALLBACK_THUMBNAIL = "/img/exam.png";

const emptyFilters = {
  search: "",
  exam: "",
  type: "",
  year: "",
};

const resolveResourceUrl = (value = "") =>
  value ? resolveBackendPath(value) : FALLBACK_THUMBNAIL;

const formatNumber = (value = 0) =>
  Number(value || 0).toLocaleString("en-US");

const mergeFilterOptions = (filters = {}) => ({
  exams: filters.exams?.length ? filters.exams : DEFAULT_EXAMS,
  questionTypes: filters.questionTypes?.length
    ? filters.questionTypes
    : DEFAULT_TYPES,
  years: filters.years?.length ? filters.years : DEFAULT_YEARS,
});

const QuestionThumbnail = ({ src, title, className = "" }) => {
  const [imageSrc, setImageSrc] = useState(resolveResourceUrl(src));

  useEffect(() => {
    setImageSrc(resolveResourceUrl(src));
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={title || "Question resource"}
      className={className}
      loading="lazy"
      onError={() => {
        if (imageSrc !== FALLBACK_THUMBNAIL) {
          setImageSrc(FALLBACK_THUMBNAIL);
        }
      }}
    />
  );
};

const QuestionCard = ({ question, compact = false }) => (
  <Link
    to={`/past-questions/${question.slug}`}
    className={`question-card${compact ? " question-card--compact" : ""}`}
  >
    <div className="question-card__media">
      <QuestionThumbnail
        src={question.thumbnailUrl}
        title={question.title}
        className="question-card__image"
      />
      <span className="question-card__resource">
        {question.resourceType === "PDF" ? (
          <FileText size={14} aria-hidden="true" />
        ) : (
          <FileImage size={14} aria-hidden="true" />
        )}
        {question.resourceType}
      </span>
    </div>
    <div className="question-card__body">
      <div className="question-card__meta-row">
        <span>{question.exam || "Entrance"}</span>
        {question.year ? <span>{question.year}</span> : null}
      </div>
      <h3 className="question-card__title">{question.title}</h3>
      <div className="question-card__footer">
        <span className="question-card__type">{question.questionType}</span>
        <span className="question-card__views">
          <Eye size={14} aria-hidden="true" />
          {formatNumber(question.viewsCount)}
        </span>
      </div>
    </div>
  </Link>
);

const QuestionSkeletonGrid = () => (
  <div className="past-questions-page__grid">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="question-card question-card--skeleton">
        <div className="question-card__media" />
        <div className="question-card__body">
          <span className="skeleton-line skeleton-line--short" />
          <span className="skeleton-line skeleton-line--title" />
          <span className="skeleton-line" />
        </div>
      </div>
    ))}
  </div>
);

const PastQuestions = () => {
  const [filters, setFilters] = useState(emptyFilters);
  const [filterOptions, setFilterOptions] = useState(mergeFilterOptions());
  const [questions, setQuestions] = useState([]);
  const [popularExamCategories, setPopularExamCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => String(value || "").trim()),
    [filters]
  );

  useEffect(() => {
    let mounted = true;
    const fetchTimer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await questionBankAPI.getAllQuestions({
          ...filters,
          page,
          limit: QUESTION_LIMIT,
        });

        if (!mounted) {
          return;
        }

        const payload = response.data?.data || {};
        setQuestions(Array.isArray(payload.questions) ? payload.questions : []);
        setPopularExamCategories(
          Array.isArray(payload.popularExamCategories)
            ? payload.popularExamCategories
            : []
        );
        setFilterOptions(mergeFilterOptions(payload.filters || {}));
        setTotalQuestions(Number(payload.totalQuestions || 0));
        setTotalPages(Math.max(Number(payload.totalPages || 1), 1));
      } catch (fetchError) {
        if (mounted) {
          setQuestions([]);
          setError(
            fetchError.response?.data?.error ||
              "Unable to load question resources right now."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }, 280);

    return () => {
      mounted = false;
      clearTimeout(fetchTimer);
    };
  }, [filters, page]);

  const updateFilter = (name, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setPage(1);
  };

  const applyExamCategory = (exam) => {
    updateFilter("exam", exam);
  };

  return (
    <main className="past-questions-page">
      <section className="past-questions-page__hero">
        <div className="container">
          <div className="past-questions-page__hero-inner">
            <div>
            
              <h1>Past Questions &amp; Model Questions</h1>
              <p>Access Entrance, Board and Model Question Collections</p>
            </div>
            <div className="past-questions-page__stats" aria-label="Question bank summary">
              <span>
                <Layers size={20} aria-hidden="true" />
                <strong>{formatNumber(totalQuestions)}</strong>
                <small>Resources</small>
              </span>
              <span>
                <FileText size={20} aria-hidden="true" />
                <strong>{filterOptions.exams.length}</strong>
                <small>Exams</small>
              </span>
              <span>
                <List size={20} aria-hidden="true" />
                <strong>{filterOptions.questionTypes.length}</strong>
                <small>Types</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="past-questions-page__filters" aria-label="Question filters">
          <form
            className="past-questions-page__filter-grid"
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="past-questions-page__search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Search title, exam, or year"
              />
            </label>

            <label className="past-questions-page__select-wrap">
              <span>Exam</span>
              <select
                value={filters.exam}
                onChange={(event) => updateFilter("exam", event.target.value)}
              >
                <option value="">All Exams</option>
                {filterOptions.exams.map((exam) => (
                  <option key={exam} value={exam}>
                    {exam}
                  </option>
                ))}
              </select>
            </label>

            <label className="past-questions-page__select-wrap">
              <span>Type</span>
              <select
                value={filters.type}
                onChange={(event) => updateFilter("type", event.target.value)}
              >
                <option value="">All Types</option>
                {filterOptions.questionTypes.map((questionType) => (
                  <option key={questionType} value={questionType}>
                    {questionType}
                  </option>
                ))}
              </select>
            </label>

            <label className="past-questions-page__select-wrap">
              <span>Year</span>
              <select
                value={filters.year}
                onChange={(event) => updateFilter("year", event.target.value)}
              >
                <option value="">All Years</option>
                {filterOptions.years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </form>

          {hasActiveFilters ? (
            <button
              type="button"
              className="past-questions-page__clear"
              onClick={clearFilters}
            >
              <X size={16} aria-hidden="true" />
              Clear Filters
            </button>
          ) : null}
        </section>

        {popularExamCategories.length ? (
          <section className="past-questions-page__popular" aria-label="Popular exam categories">
            <div className="past-questions-page__section-head">
              <h2>
                <Layers size={20} aria-hidden="true" />
                Popular Exam Categories
              </h2>
            </div>
            <div className="past-questions-page__category-row">
              {popularExamCategories.map((category) => (
                <button
                  key={category.exam}
                  type="button"
                  className={`past-questions-page__category${
                    filters.exam === category.exam
                      ? " past-questions-page__category--active"
                      : ""
                  }`}
                  onClick={() => applyExamCategory(category.exam)}
                >
                  <span>{category.exam}</span>
                  <strong>{formatNumber(category.count)}</strong>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="past-questions-page__results">
          <div className="past-questions-page__section-head past-questions-page__section-head--split">
            <h2>
              <FileText size={20} aria-hidden="true" />
              Question Collections
            </h2>
            <span>{formatNumber(totalQuestions)} found</span>
          </div>

          {error ? (
            <div className="past-questions-page__state past-questions-page__state--error" role="alert">
              <AlertCircle size={34} aria-hidden="true" />
              <h3>Could not load questions</h3>
              <p>{error}</p>
            </div>
          ) : loading ? (
            <QuestionSkeletonGrid />
          ) : questions.length ? (
            <>
              <div className="past-questions-page__grid">
                {questions.map((question) => (
                  <QuestionCard key={question.id || question.slug} question={question} />
                ))}
              </div>

              {totalPages > 1 ? (
                <nav className="past-questions-page__pagination" aria-label="Question pages">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
                  >
                    <ChevronLeft size={17} aria-hidden="true" />
                    Previous
                  </button>
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((currentPage) => Math.min(currentPage + 1, totalPages))
                    }
                  >
                    Next
                    <ChevronRight size={17} aria-hidden="true" />
                  </button>
                </nav>
              ) : null}
            </>
          ) : (
            <div className="past-questions-page__state">
              <FolderOpen size={38} aria-hidden="true" />
              <h3>No Questions Available</h3>
              <p>Try another exam, type, or year.</p>
            </div>
          )}
        </section>

      </div>
    </main>
  );
};

export default PastQuestions;
