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
          setError(requestError.response?.data?.error || "Unable to load this PDF.");
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
            <h1>PDF not found</h1>
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
          <a className="resource-preview__download" href={downloadUrl}>
            <Download size={17} aria-hidden="true" />
            Download PDF
          </a>
        </section>

        <section className="past-question-detail__resource">
          <div className="past-questions-page__section-head past-questions-page__section-head--split">
            <h2>PDF Preview</h2>
            <a href={previewUrl} target="_blank" rel="noreferrer">
              Open in new tab
            </a>
          </div>
          {previewUrl ? (
            <iframe
              className="past-question-detail__pdf-frame"
              src={previewUrl}
              title={`${question.title} PDF preview`}
            />
          ) : (
            <div className="past-questions-page__state">PDF file is unavailable.</div>
          )}
        </section>
      </div>
    </main>
  );
};

export default PastQuestionDetail;
