import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { mockTestAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';

const MockTestResult = () => {
  const { attemptId } = useParams();
  const location = useLocation();
  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (!result && attemptId) {
      fetchResult();
    }
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      const response = await mockTestAPI.getAttemptResult(attemptId);
      if (response.data.success) {
        setResult(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching result:', error);
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  if (!result) {
    return <div className="container mt-5 pt-5 text-center"><h3>Result not found</h3></div>;
  }

  const isPassed = result.percentage >= 40;

  return (
    <div style={{ paddingTop: '125px', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        {/* Result Card */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '36px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px', textAlign: 'center'
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isPassed ? '#f0fdf4' : '#fef2f2', fontSize: '36px'
          }}>
            {isPassed
              ? <i className="fa-solid fa-circle-check" style={{ color: '#16a34a' }}></i>
              : <i className="fa-solid fa-circle-xmark" style={{ color: '#ef4444' }}></i>
            }
          </div>
          <h2 style={{ fontWeight: 700, color: '#1a365d', marginBottom: '4px' }}>{result.testTitle}</h2>
          <p style={{ color: isPassed ? '#16a34a' : '#ef4444', fontWeight: 600, fontSize: '16px', marginBottom: '24px' }}>
            {isPassed ? 'Congratulations! You Passed!' : 'Keep Practicing!'}
          </p>

          {/* Score Circle */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{
              width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto',
              border: `6px solid ${isPassed ? '#16a34a' : '#ef4444'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: isPassed ? '#16a34a' : '#ef4444' }}>{result.percentage}%</span>
              <span style={{ fontSize: '11px', color: '#888' }}>Score</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '16px', marginBottom: '20px'
          }}>
            <div style={{ background: '#f0f4ff', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#1a365d' }}>{result.totalScore}/{result.totalMarks}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>Marks Obtained</div>
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#16a34a' }}>{result.totalCorrect}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>Correct</div>
            </div>
            <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#ef4444' }}>{result.totalWrong}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>Wrong</div>
            </div>
            <div style={{ background: '#fef9ef', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#d97706' }}>{result.totalUnanswered}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>Unanswered</div>
            </div>
            <div style={{ background: '#f5f3ff', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#7c3aed' }}>{formatTime(result.timeTaken)}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>Time Taken</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              style={{
                padding: '10px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                background: '#1a365d', color: '#fff', border: 'none', cursor: 'pointer'
              }}
            >
              <i className={`fa-solid ${showAnswers ? 'fa-eye-slash' : 'fa-eye'} me-2`}></i>
              {showAnswers ? 'Hide Answers' : 'View Answers'}
            </button>
            <Link to="/mocktests" style={{
              padding: '10px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              background: '#ff6b35', color: '#fff', textDecoration: 'none', border: 'none'
            }}>
              <i className="fa-solid fa-list me-2"></i>All Tests
            </Link>
          </div>
        </div>

        {/* Answer Review */}
        {showAnswers && result.questions && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' }}>
            {result.questions.map((q, idx) => {
              const labels = ['A', 'B', 'C', 'D'];
              return (
                <div key={idx} style={{
                  background: '#fff', borderRadius: '12px', padding: '24px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  borderLeft: `4px solid ${q.isCorrect ? '#16a34a' : q.selectedOption === -1 ? '#d97706' : '#ef4444'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#ff6b35' }}>
                      Q{idx + 1}
                    </span>
                    <span style={{
                      fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '12px',
                      background: q.isCorrect ? '#f0fdf4' : q.selectedOption === -1 ? '#fef9ef' : '#fef2f2',
                      color: q.isCorrect ? '#16a34a' : q.selectedOption === -1 ? '#d97706' : '#ef4444'
                    }}>
                      {q.isCorrect ? 'Correct' : q.selectedOption === -1 ? 'Skipped' : 'Wrong'}
                      {' '}({q.marksObtained > 0 ? '+' : ''}{q.marksObtained})
                    </span>
                  </div>
                  <p style={{ fontWeight: 600, color: '#333', marginBottom: '14px', lineHeight: 1.6 }}>{q.questionText}</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {q.options.map((opt, optIdx) => {
                      const isCorrectOpt = optIdx === q.correctOption;
                      const isSelected = optIdx === q.selectedOption;
                      let bg = '#fff';
                      let border = '1px solid #e0e0e0';
                      let labelBg = '#f0f0f0';
                      let labelColor = '#555';

                      if (isCorrectOpt) {
                        bg = '#f0fdf4'; border = '1.5px solid #16a34a';
                        labelBg = '#16a34a'; labelColor = '#fff';
                      } else if (isSelected && !q.isCorrect) {
                        bg = '#fef2f2'; border = '1.5px solid #ef4444';
                        labelBg = '#ef4444'; labelColor = '#fff';
                      }

                      return (
                        <div key={optIdx} style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '10px 14px', borderRadius: '8px', background: bg, border
                        }}>
                          <span style={{
                            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '12px', background: labelBg, color: labelColor
                          }}>
                            {labels[optIdx]}
                          </span>
                          <span style={{ fontSize: '14px', color: '#333' }}>{opt.text}</span>
                          {isCorrectOpt && <i className="fa-solid fa-check ms-auto" style={{ color: '#16a34a' }}></i>}
                          {isSelected && !q.isCorrect && <i className="fa-solid fa-xmark ms-auto" style={{ color: '#ef4444' }}></i>}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div style={{
                      background: '#f8f9fa', borderRadius: '8px', padding: '12px 14px',
                      fontSize: '13px', color: '#555', lineHeight: 1.6
                    }}>
                      <strong><i className="fa-solid fa-lightbulb me-1" style={{ color: '#d97706' }}></i>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MockTestResult;
