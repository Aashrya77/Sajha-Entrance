import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { questionBankAPI } from "../../api/services";
import { resolveBackendPath } from "../../api/config";
import "./PastQuestions.css";

const resolveFileUrl = (value = "") => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return /^(?:https?:)?\/\//i.test(normalized)
    ? normalized
    : resolveBackendPath(normalized);
};

const PastQuestionDetail = () => {
  const { slug } = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    questionBankAPI
      .getQuestionBySlug(slug)
      .then((response) => {
        if (active) setQuestion(response.data?.data?.question || null);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.error || "Unable to load this resource.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="past-question-detail">
        <div className="container past-question-detail__loading">Loading PDF…</div>
      </main>
    );
  }

  if (error || !question) {
    return (
      <main className="past-question-detail">
        <div className="container">
          <div className="past-questions-page__state past-questions-page__state--error">
            <h1>Resource not found</h1>
            <p>{error || "This past question is not available."}</p>
            <Link to="/past-questions" className="past-question-detail__back">
              Back to Past Questions
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const previewUrl = resolveFileUrl(question.pdfUrl);
  const downloadUrl = resolveFileUrl(question.downloadUrl);
  const imageUrls = (question.imageUrls || []).map(resolveFileUrl).filter(Boolean);
  const imageDownloadUrls = (question.downloadUrls || [])
    .map(resolveFileUrl)
    .filter(Boolean);
  const isPdf = question.resourceType === "PDF";

  return (
    <main className="past-question-detail">
      <div className="container">
        <Link to="/past-questions" className="past-question-detail__back">
          <ArrowLeft size={17} aria-hidden="true" />
          Back to Past Questions
        </Link>

        <section className="past-question-detail__summary">
          <div className="past-question-detail__badge-row">
            <span>{question.exam}</span>
            <span>{question.year}</span>
            <span>{question.questionType}</span>
          </div>
          <h1>{question.title}</h1>
          {question.description ? <p>{question.description}</p> : null}
          {question.allowDownload && downloadUrl ? (
            <a className="resource-preview__download" href={downloadUrl}>
              <Download size={17} aria-hidden="true" />
              Download {isPdf ? "PDF" : "Images"}
            </a>
          ) : null}
        </section>

        <section className="past-question-detail__resource">
          <div className="past-questions-page__section-head past-questions-page__section-head--split">
            <h2>{isPdf ? "PDF Preview" : "Image Preview"}</h2>
            {isPdf && previewUrl ? (
              <a href={previewUrl} target="_blank" rel="noreferrer">
                Open in new tab
              </a>
            ) : null}
          </div>
          {isPdf && previewUrl ? (
            <iframe
              className="past-question-detail__pdf-frame"
              src={previewUrl}
              title={`${question.title} PDF preview`}
            />
          ) : !isPdf && imageUrls.length ? (
            <div className="resource-preview__image-stack">
              {imageUrls.map((imageUrl, index) => (
                <figure className="resource-preview__image-page" key={imageUrl}>
                  <img
                    src={imageUrl}
                    alt={`${question.title}, page ${index + 1}`}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  <figcaption>
                    <span>Page {index + 1}</span>
                    {question.allowDownload && imageDownloadUrls[index] ? (
                      <a href={imageDownloadUrls[index]}>
                        <Download size={15} aria-hidden="true" />
                        Download
                      </a>
                    ) : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="past-questions-page__state">Resource is unavailable.</div>
          )}
        </section>
      </div>
    </main>
  );
};

export default PastQuestionDetail;
