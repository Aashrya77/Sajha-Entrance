import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Plus,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { mockTestAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';
import './MockTestResults.css';

const PASS_PERCENTAGE = 40;

const formatTime = (value) => {
  const seconds = Math.max(0, Number(value) || 0);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const formatPercentage = (value) => {
  const percentage = Number(value) || 0;
  return `${Number.isInteger(percentage) ? percentage : percentage.toFixed(1)}%`;
};

const MockTestResults = ({ embedded = false, onBrowseTests }) => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const response = await mockTestAPI.getMyAttempts();
        if (response.data.success) {
          setAttempts(response.data.data.attempts || []);
        }
      } catch (error) {
        // The empty state remains useful when the request cannot be completed.
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, []);

  const summary = useMemo(() => {
    if (!attempts.length) {
      return { best: 0, average: 0, passed: 0 };
    }

    const percentages = attempts.map((attempt) => Number(attempt.percentage) || 0);
    return {
      best: Math.max(...percentages),
      average: percentages.reduce((total, value) => total + value, 0) / percentages.length,
      passed: percentages.filter((value) => value >= PASS_PERCENTAGE).length,
    };
  }, [attempts]);

  if (loading) {
    return (
      <div className={embedded ? 'test-results-page__embedded-loader' : 'container mt-5 pt-5 d-flex justify-content-center'}>
        <Loader />
      </div>
    );
  }

  const browseTestsAction = (label, showArrow = false) =>
    embedded ? (
      <button type="button" className="test-results-primary-action" onClick={onBrowseTests}>
        {label} {showArrow ? <ArrowRight size={17} /> : <Plus size={18} aria-hidden="true" />}
      </button>
    ) : (
      <Link to="/mocktests" className="test-results-primary-action">
        {showArrow ? null : <Plus size={18} aria-hidden="true" />}
        {label} {showArrow ? <ArrowRight size={17} /> : null}
      </Link>
    );

  return (
    <main className={`test-results-page${embedded ? ' test-results-page--embedded' : ''}`}>
      <div className="test-results-page__glow" aria-hidden="true" />
      <div className="container test-results-page__container">
        <header className="test-results-header">
          <div>
            <span className="test-results-header__eyebrow">Performance dashboard</span>
            <h1 className="test-results-header__title">
              <BarChart3 aria-hidden="true" />
              My Test Results
            </h1>
            <p className="test-results-header__subtitle">
              Review your recent attempts and track your preparation progress.
            </p>
          </div>
          {browseTestsAction('Take New Test')}
        </header>

        {attempts.length === 0 ? (
          <section className="test-results-empty">
            <span className="test-results-empty__icon"><ClipboardList size={34} /></span>
            <h2>No test results yet</h2>
            <p>Complete your first mock test to start tracking your performance.</p>
            {browseTestsAction('Browse Mock Tests', true)}
          </section>
        ) : (
          <>
            <section className="test-results-summary" aria-label="Results summary">
              <article className="test-results-summary__card">
                <span className="test-results-summary__icon"><ClipboardList size={20} /></span>
                <div><strong>{attempts.length}</strong><span>Recent attempts</span></div>
              </article>
              <article className="test-results-summary__card">
                <span className="test-results-summary__icon"><Trophy size={20} /></span>
                <div><strong>{formatPercentage(summary.best)}</strong><span>Best score</span></div>
              </article>
              <article className="test-results-summary__card">
                <span className="test-results-summary__icon"><Target size={20} /></span>
                <div><strong>{formatPercentage(summary.average)}</strong><span>Average score</span></div>
              </article>
              <article className="test-results-summary__card">
                <span className="test-results-summary__icon"><CheckCircle2 size={20} /></span>
                <div><strong>{summary.passed}</strong><span>Tests passed</span></div>
              </article>
            </section>

            <section className="test-results-list" aria-label="Recent test attempts">
              <div className="test-results-list__heading">
                <div><h2>Recent attempts</h2><p>Results are retained for seven days.</p></div>
                <span>{attempts.length} result{attempts.length === 1 ? '' : 's'}</span>
              </div>

              <div className="test-results-list__items">
                {attempts.map((attempt) => {
                  const isPassed = Number(attempt.percentage) >= PASS_PERCENTAGE;
                  return (
                    <Link
                      key={attempt._id}
                      to={`/mocktest-result/${attempt._id}`}
                      className={`test-result-card ${isPassed ? 'is-passed' : 'is-failed'}`}
                    >
                      <div className="test-result-card__score">
                        <strong>{formatPercentage(attempt.percentage)}</strong>
                        <span>{isPassed ? 'Passed' : 'Keep going'}</span>
                      </div>

                      <div className="test-result-card__content">
                        <div className="test-result-card__title-row">
                          <div>
                            <h3>{attempt.mockTest?.title || 'Mock Test'}</h3>
                            <span className="test-result-card__attempt">Attempt {attempt.attemptNumber || 1}</span>
                          </div>
                          <div className="test-result-card__marks">
                            <strong>{attempt.totalScore}<span>/{attempt.mockTest?.totalMarks || 0}</span></strong>
                            <small>marks</small>
                          </div>
                        </div>

                        <div className="test-result-card__metrics">
                          <span className="is-correct"><CheckCircle2 size={16} />{attempt.totalCorrect} correct</span>
                          <span className="is-wrong"><XCircle size={16} />{attempt.totalWrong} wrong</span>
                          <span><Clock3 size={16} />{formatTime(attempt.timeTaken)}</span>
                          <span><CalendarDays size={16} />{new Date(attempt.completedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <span className="test-result-card__view" aria-label="View result">
                        <ArrowRight size={19} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default MockTestResults;
