import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { questionBankAPI } from "../../api/services";
import { resolveBackendPath } from "../../api/config";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./PastQuestions.css";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const FALLBACK_THUMBNAIL = "/img/exam.png";
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2.25;
const ZOOM_STEP = 0.15;

const resolveResourceUrl = (value = "") => {
  if (!value) {
    return "";
  }

  const normalizedValue = String(value || "").trim();
  if (/^(?:https?:)?\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  return resolveBackendPath(normalizedValue);
};

const formatNumber = (value = 0) =>
  Number(value || 0).toLocaleString("en-US");

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Not available";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const useMeasuredWidth = (ref, fallback = 840) => {
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }

    const updateWidth = () => {
      setWidth(Math.max(Math.floor(element.getBoundingClientRect().width), 320));
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, fallback]);

  return width;
};

const useFullscreen = (targetRef) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    const target = targetRef.current;
    if (!target) {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (target.requestFullscreen) {
        await target.requestFullscreen();
      }
    } catch (_error) {
      setIsFullscreen(false);
    }
  };

  return { isFullscreen, toggleFullscreen };
};

const QuestionThumbnail = ({ src, title }) => {
  const [imageSrc, setImageSrc] = useState(src ? resolveBackendPath(src) : FALLBACK_THUMBNAIL);

  useEffect(() => {
    setImageSrc(src ? resolveBackendPath(src) : FALLBACK_THUMBNAIL);
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={title || "Question thumbnail"}
      className="past-question-detail__thumbnail"
      onError={() => {
        if (imageSrc !== FALLBACK_THUMBNAIL) {
          setImageSrc(FALLBACK_THUMBNAIL);
        }
      }}
    />
  );
};

const DetailMetaItem = ({ icon, label, value }) => (
  <div className="past-question-detail__meta-item">
    <span className="past-question-detail__meta-icon">
      <i className={`fa-solid ${icon}`} aria-hidden="true"></i>
    </span>
    <span>
      <strong>{label}</strong>
      <span>{value || "Not available"}</span>
    </span>
  </div>
);

const PreviewToolbarButton = ({ children, ...props }) => (
  <button type="button" className="resource-preview__button" {...props}>
    {children}
  </button>
);

const DownloadButton = ({ href }) => {
  if (!href) {
    return null;
  }

  const resolvedHref = resolveResourceUrl(href);
  const isSameOrigin = typeof window !== "undefined" && resolvedHref.startsWith(window.location.origin);

  return (
    <a
      href={resolvedHref}
      className="resource-preview__download"
      target="_blank"
      rel="noopener noreferrer"
      {...(isSameOrigin ? { download: true } : {})}
    >
      <i className="fa-solid fa-download" aria-hidden="true"></i>
      Download
    </a>
  );
};

const PdfPreview = ({ question }) => {
  const previewRef = useRef(null);
  const pageShellRef = useRef(null);
  const pageRefs = useRef([]);
  const measuredWidth = useMeasuredWidth(pageShellRef, 860);
  const { isFullscreen, toggleFullscreen } = useFullscreen(previewRef);
  const [totalPages, setTotalPages] = useState(Number(question.pageCount || 0));
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [loadError, setLoadError] = useState("");

  const fileUrl = resolveResourceUrl(question.pdfUrl || question.downloadUrl);
  const downloadUrl = question.allowDownload
    ? resolveResourceUrl(question.downloadUrl)
    : "";
  const [pdfSource, setPdfSource] = useState(fileUrl);
  const [hasTriedDownloadFallback, setHasTriedDownloadFallback] = useState(false);
  const pageWidth = Math.min(Math.max(measuredWidth - 64, 300), isFullscreen ? 1180 : 940);
  const pageNumbers = useMemo(
    () => Array.from({ length: Math.max(totalPages, 0) }, (_, index) => index + 1),
    [totalPages]
  );

  useEffect(() => {
    setPageNumber(1);
    setLoadError("");
    setTotalPages(Number(question.pageCount || 0));
    setHasTriedDownloadFallback(false);
    setPdfSource(fileUrl);
    pageRefs.current = [];
  }, [question.slug, question.pageCount, fileUrl]);

  const setSafePage = (nextPage) => {
    const knownTotalPages = totalPages || 1;
    const safePage = clamp(nextPage, 1, knownTotalPages);
    setPageNumber(safePage);
    window.requestAnimationFrame(() => {
      pageRefs.current[safePage - 1]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const updateActivePageFromScroll = () => {
    const shell = pageShellRef.current;
    if (!shell || !pageRefs.current.length) {
      return;
    }

    const shellTop = shell.getBoundingClientRect().top;
    let closestPage = pageNumber;
    let closestDistance = Number.POSITIVE_INFINITY;

    pageRefs.current.forEach((element, index) => {
      if (!element) {
        return;
      }

      const distance = Math.abs(element.getBoundingClientRect().top - shellTop - 16);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPage = index + 1;
      }
    });

    setPageNumber((currentPage) =>
      currentPage === closestPage ? currentPage : closestPage
    );
  };

  if (!fileUrl) {
    return (
      <div className="resource-preview__state">
        <i className="fa-solid fa-file-circle-xmark" aria-hidden="true"></i>
        <h3>PDF resource not available</h3>
      </div>
    );
  }

  return (
    <section ref={previewRef} className="resource-preview resource-preview--pdf">
      <div className="resource-preview__toolbar">
        <div className="resource-preview__toolbar-group">
          <PreviewToolbarButton
            aria-label="Previous PDF page"
            disabled={pageNumber <= 1}
            onClick={() => setSafePage(pageNumber - 1)}
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
          </PreviewToolbarButton>
          <span className="resource-preview__page-count">
            Page {pageNumber} of {totalPages || "-"}
          </span>
          <PreviewToolbarButton
            aria-label="Next PDF page"
            disabled={!totalPages || pageNumber >= totalPages}
            onClick={() => setSafePage(pageNumber + 1)}
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
          </PreviewToolbarButton>
        </div>

        <div className="resource-preview__toolbar-group">
          <PreviewToolbarButton
            aria-label="Zoom out"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => setZoom((currentZoom) => clamp(currentZoom - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}
          >
            <i className="fa-solid fa-minus" aria-hidden="true"></i>
          </PreviewToolbarButton>
          <span className="resource-preview__zoom">{Math.round(zoom * 100)}%</span>
          <PreviewToolbarButton
            aria-label="Zoom in"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => setZoom((currentZoom) => clamp(currentZoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}
          >
            <i className="fa-solid fa-plus" aria-hidden="true"></i>
          </PreviewToolbarButton>
          <PreviewToolbarButton
            aria-label={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
            onClick={toggleFullscreen}
          >
            <i
              className={`fa-solid ${isFullscreen ? "fa-compress" : "fa-expand"}`}
              aria-hidden="true"
            ></i>
          </PreviewToolbarButton>
          {question.allowDownload ? <DownloadButton href={question.downloadUrl} /> : null}
        </div>
      </div>

      <div
        ref={pageShellRef}
        className="resource-preview__canvas-shell"
        onScroll={updateActivePageFromScroll}
      >
        {loadError ? (
          <div className="resource-preview__state resource-preview__state--error">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
            <h3>Could not load PDF preview</h3>
            <p>{loadError}</p>
          </div>
        ) : (
          <Document
            file={pdfSource}
            loading={
              <div className="resource-preview__loading">
                <span />
                <span />
                <span />
              </div>
            }
            error={
              <div className="resource-preview__state resource-preview__state--error">
                <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
                <h3>Could not load PDF preview</h3>
              </div>
            }
            onLoadSuccess={({ numPages }) => {
              setTotalPages(numPages);
              setPageNumber((currentPage) => clamp(currentPage, 1, numPages));
            }}
            onLoadError={(error) => {
              const message = error?.message || "The PDF preview failed to load.";
              if (!hasTriedDownloadFallback && downloadUrl && downloadUrl !== pdfSource) {
                setHasTriedDownloadFallback(true);
                setPdfSource(downloadUrl);
                return;
              }
              setLoadError(message);
            }}
          >
            <div className="resource-preview__pdf-stack">
              {pageNumbers.map((page) => (
                <figure
                  key={page}
                  ref={(element) => {
                    pageRefs.current[page - 1] = element;
                  }}
                  className={`resource-preview__pdf-page${
                    pageNumber === page ? " resource-preview__pdf-page--active" : ""
                  }`}
                >
                  <Page
                    pageNumber={page}
                    width={pageWidth}
                    scale={zoom}
                    renderAnnotationLayer
                    renderTextLayer
                    loading={<div className="resource-preview__page-skeleton" />}
                  />
                  <figcaption>Page {page}</figcaption>
                </figure>
              ))}
            </div>
          </Document>
        )}
      </div>
    </section>
  );
};

const ImagePreview = ({ question }) => {
  const previewRef = useRef(null);
  const imageRefs = useRef([]);
  const { isFullscreen, toggleFullscreen } = useFullscreen(previewRef);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const imageUrls = Array.isArray(question.imageUrls) ? question.imageUrls : [];
  const downloadUrls = Array.isArray(question.downloadUrls) ? question.downloadUrls : [];

  useEffect(() => {
    setActiveIndex(0);
    setZoom(1);
    imageRefs.current = [];
  }, [question.slug]);

  const setSafeImage = (nextIndex) => {
    const safeIndex = clamp(nextIndex, 0, Math.max(imageUrls.length - 1, 0));
    setActiveIndex(safeIndex);
    window.requestAnimationFrame(() => {
      imageRefs.current[safeIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  if (!imageUrls.length) {
    return (
      <div className="resource-preview__state">
        <i className="fa-solid fa-image" aria-hidden="true"></i>
        <h3>Image resource not available</h3>
      </div>
    );
  }

  return (
    <section ref={previewRef} className="resource-preview resource-preview--images">
      <div className="resource-preview__toolbar">
        <div className="resource-preview__toolbar-group">
          <PreviewToolbarButton
            aria-label="Previous image"
            disabled={activeIndex <= 0}
            onClick={() => setSafeImage(activeIndex - 1)}
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
          </PreviewToolbarButton>
          <span className="resource-preview__page-count">
            Image {activeIndex + 1} of {imageUrls.length}
          </span>
          <PreviewToolbarButton
            aria-label="Next image"
            disabled={activeIndex >= imageUrls.length - 1}
            onClick={() => setSafeImage(activeIndex + 1)}
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
          </PreviewToolbarButton>
        </div>

        <div className="resource-preview__toolbar-group">
          <PreviewToolbarButton
            aria-label="Zoom out"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => setZoom((currentZoom) => clamp(currentZoom - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}
          >
            <i className="fa-solid fa-minus" aria-hidden="true"></i>
          </PreviewToolbarButton>
          <span className="resource-preview__zoom">{Math.round(zoom * 100)}%</span>
          <PreviewToolbarButton
            aria-label="Zoom in"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => setZoom((currentZoom) => clamp(currentZoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}
          >
            <i className="fa-solid fa-plus" aria-hidden="true"></i>
          </PreviewToolbarButton>
          <PreviewToolbarButton
            aria-label={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
            onClick={toggleFullscreen}
          >
            <i
              className={`fa-solid ${isFullscreen ? "fa-compress" : "fa-expand"}`}
              aria-hidden="true"
            ></i>
          </PreviewToolbarButton>
          {question.allowDownload ? (
            <DownloadButton href={downloadUrls[activeIndex] || question.downloadUrl} />
          ) : null}
        </div>
      </div>

      <div className="resource-preview__image-stack">
        {imageUrls.map((imageUrl, index) => (
          <figure
            key={`${imageUrl}-${index}`}
            ref={(element) => {
              imageRefs.current[index] = element;
            }}
            className={`resource-preview__image-page${
              activeIndex === index ? " resource-preview__image-page--active" : ""
            }`}
            style={{
              "--question-image-width": `${Math.round(zoom * 100)}%`,
              "--question-image-max-width": `${Math.round(zoom * 980)}px`,
            }}
            onClick={() => setActiveIndex(index)}
          >
            <img
              src={resolveResourceUrl(imageUrl)}
              alt={`${question.title} page ${index + 1}`}
              loading={index === 0 ? "eager" : "lazy"}
            />
            <figcaption>Page {index + 1}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
};

const QuestionCard = ({ question }) => (
  <Link to={`/past-questions/${question.slug}`} className="question-card question-card--compact">
    <div className="question-card__media">
      <QuestionThumbnail src={question.thumbnailUrl} title={question.title} />
      <span className="question-card__resource">
        <i
          className={`fa-solid ${
            question.resourceType === "PDF" ? "fa-file-pdf" : "fa-images"
          }`}
          aria-hidden="true"
        ></i>
        {question.resourceType}
      </span>
    </div>
    <div className="question-card__body">
      <div className="question-card__meta-row">
        <span>{question.exam}</span>
        {question.year ? <span>{question.year}</span> : null}
      </div>
      <h3 className="question-card__title">{question.title}</h3>
      <div className="question-card__footer">
        <span className="question-card__type">{question.questionType}</span>
        <span className="question-card__views">
          <i className="fa-solid fa-eye" aria-hidden="true"></i>
          {formatNumber(question.viewsCount)}
        </span>
      </div>
    </div>
  </Link>
);

const PastQuestionDetail = () => {
  const { slug } = useParams();
  const [question, setQuestion] = useState(null);
  const [relatedQuestions, setRelatedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadQuestion = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await questionBankAPI.getQuestionBySlug(slug);

        if (!mounted) {
          return;
        }

        const payload = response.data?.data || {};
        setQuestion(payload.question || null);
        setRelatedQuestions(
          Array.isArray(payload.relatedQuestions) ? payload.relatedQuestions : []
        );
      } catch (fetchError) {
        if (mounted) {
          setQuestion(null);
          setRelatedQuestions([]);
          setError(
            fetchError.response?.data?.error ||
              "Unable to load this question resource."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      loadQuestion();
    }

    return () => {
      mounted = false;
    };
  }, [slug]);

  const pageCountLabel = useMemo(() => {
    if (!question) {
      return "";
    }

    if (question.resourceType === "Images") {
      return `${question.imageCount || question.imageUrls?.length || 0} image pages`;
    }

    if (question.pageCount) {
      return `${question.pageCount} PDF pages`;
    }

    return "PDF";
  }, [question]);

  if (loading) {
    return (
      <main className="past-question-detail">
        <div className="container">
          <div className="past-question-detail__loading">
            <span />
            <span />
            <span />
          </div>
        </div>
      </main>
    );
  }

  if (error || !question) {
    return (
      <main className="past-question-detail">
        <div className="container">
          <div className="past-questions-page__state past-questions-page__state--error">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
            <h3>Question not found</h3>
            <p>{error || "This resource is not available."}</p>
            <Link to="/past-questions" className="past-question-detail__back">
              <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
              Back to Past Questions
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="past-question-detail">
      <div className="container">
        <Link to="/past-questions" className="past-question-detail__back">
          <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
          Back to Past Questions
        </Link>

        <section className="past-question-detail__header">
          <div className="past-question-detail__thumbnail-wrap">
            <QuestionThumbnail src={question.thumbnailUrl} title={question.title} />
          </div>

          <div className="past-question-detail__summary">
            <div className="past-question-detail__badge-row">
              <span>{question.exam}</span>
              <span>{question.questionType}</span>
              <span>{question.resourceType}</span>
            </div>
            <h1>{question.title}</h1>
            {question.description ? (
              <p className="past-question-detail__description">{question.description}</p>
            ) : null}

            <div className="past-question-detail__meta-grid">
              <DetailMetaItem icon="fa-graduation-cap" label="Exam" value={question.exam} />
              <DetailMetaItem icon="fa-calendar-days" label="Year" value={question.year} />
              <DetailMetaItem
                icon="fa-cloud-arrow-up"
                label="Uploaded Date"
                value={formatDate(question.uploadedDate || question.createdAt)}
              />
              <DetailMetaItem
                icon="fa-eye"
                label="Total Views"
                value={formatNumber(question.viewsCount)}
              />
              <DetailMetaItem
                icon={question.resourceType === "PDF" ? "fa-file-pdf" : "fa-images"}
                label="Resource"
                value={pageCountLabel}
              />
            </div>
          </div>
        </section>

        <section className="past-question-detail__resource">
          <div className="past-questions-page__section-head past-questions-page__section-head--split">
            <h2>
              <i className="fa-solid fa-file-lines" aria-hidden="true"></i>
              Resource Preview
            </h2>
            <span>{question.allowDownload ? "Download Enabled" : "Preview Only"}</span>
          </div>

          {question.resourceType === "PDF" ? (
            <PdfPreview question={question} />
          ) : (
            <ImagePreview question={question} />
          )}
        </section>

        {relatedQuestions.length ? (
          <section className="past-question-detail__related">
            <div className="past-questions-page__section-head">
              <h2>
                <i className="fa-solid fa-link" aria-hidden="true"></i>
                Related Questions
              </h2>
            </div>
            <div className="past-questions-page__rail">
              {relatedQuestions.map((relatedQuestion) => (
                <QuestionCard
                  key={relatedQuestion.id || relatedQuestion.slug}
                  question={relatedQuestion}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
};

export default PastQuestionDetail;
