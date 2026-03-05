import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockTestAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';

const MockTestExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    fetchTest();
  }, [id]);

  const fetchTest = async () => {
    try {
      const response = await mockTestAPI.getMockTestForExam(id);
      if (response.data.success) {
        const data = response.data.data;
        setTestData(data);
        setTimeLeft(data.duration * 60);
        setAnswers(data.questions.map((_, i) => ({ questionIndex: i, selectedOption: -1 })));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching test:', error);
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const elapsed = testData.duration * 60 - timeLeft;
      const response = await mockTestAPI.submitMockTest(id, {
        answers,
        timeTaken: elapsed,
      });
      if (response.data.success) {
        navigate(`/mocktest-result/${response.data.data.attemptId}`, {
          state: { result: response.data.data },
        });
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Error submitting test. Please try again.');
      setSubmitting(false);
    }
  }, [submitting, testData, timeLeft, id, answers, navigate]);

  // Timer
  useEffect(() => {
    if (!started || !testData || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, testData, timeLeft, handleSubmit]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const selectOption = (optionIndex) => {
    setAnswers((prev) =>
      prev.map((a) =>
        a.questionIndex === currentQuestion
          ? { ...a, selectedOption: a.selectedOption === optionIndex ? -1 : optionIndex }
          : a
      )
    );
  };

  const answeredCount = answers.filter((a) => a.selectedOption !== -1).length;
  const unansweredCount = answers.length - answeredCount;

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  if (!testData) {
    return <div className="container mt-5 pt-5 text-center"><h3>Test not found</h3></div>;
  }

  // Start screen
  if (!started) {
    return (
      <div style={{ paddingTop: '125px', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <div className="container" style={{ maxWidth: '700px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontWeight: 700, color: '#1a365d', marginBottom: '20px' }}>{testData.title}</h2>
            {testData.description && <p style={{ color: '#555', marginBottom: '20px' }}>{testData.description}</p>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
              <div style={{ background: '#f0f4ff', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a365d' }}>{testData.totalQuestions}</div>
                <div style={{ fontSize: '13px', color: '#888' }}>Questions</div>
              </div>
              <div style={{ background: '#fff5f0', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#ff6b35' }}>{testData.totalMarks}</div>
                <div style={{ fontSize: '13px', color: '#888' }}>Total Marks</div>
              </div>
              <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>{testData.duration} min</div>
                <div style={{ fontSize: '13px', color: '#888' }}>Duration</div>
              </div>
              <div style={{ background: '#fef9ef', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#d97706' }}>MCQ</div>
                <div style={{ fontSize: '13px', color: '#888' }}>Type</div>
              </div>
            </div>

            <div style={{ background: '#fffbf0', border: '1px solid #fde68a', borderRadius: '10px', padding: '16px', marginBottom: '28px', fontSize: '14px', color: '#92400e' }}>
              <strong><i className="fa-solid fa-triangle-exclamation me-2"></i>Instructions:</strong>
              <ul style={{ margin: '8px 0 0 16px', lineHeight: 2 }}>
                <li>Each question has 4 options. Select one answer per question.</li>
                <li>You can navigate between questions using the question panel.</li>
                <li>Click on a selected option again to deselect it.</li>
                <li>The test will auto-submit when time runs out.</li>
                <li>You will get instant results after submission.</li>
              </ul>
            </div>

            <button
              onClick={() => setStarted(true)}
              style={{
                width: '100%', padding: '14px', borderRadius: '10px', fontSize: '16px',
                fontWeight: 700, backgroundColor: '#ff6b35', color: '#fff', border: 'none',
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e55a2b'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff6b35'}
            >
              <i className="fa-solid fa-play me-2"></i>Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = testData.questions[currentQuestion];
  const currentAnswer = answers[currentQuestion];

  return (
    <div style={{ paddingTop: '105px', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      {/* Top Bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1040,
        background: '#1a365d', color: '#fff', padding: '25px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{ fontWeight: 600, fontSize: '15px' }}>{testData.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '13px', opacity: 0.8 }}>
            <i className="fa-solid fa-check-circle me-1" style={{ color: '#4ade80' }}></i>
            {answeredCount}/{testData.totalQuestions}
          </span>
          <span style={{
            padding: '6px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '15px',
            background: timeLeft < 300 ? '#ef4444' : timeLeft < 600 ? '#f59e0b' : 'rgba(255,255,255,0.15)',
            animation: timeLeft < 60 ? 'pulse 1s infinite' : 'none'
          }}>
            <i className="fa-solid fa-clock me-1"></i>{formatTime(timeLeft)}
          </span>
          <button
            onClick={() => setShowConfirm(true)}
            style={{
              padding: '6px 20px', borderRadius: '6px', fontSize: '13px',
              fontWeight: 600, backgroundColor: '#ff6b35', color: '#fff',
              border: 'none', cursor: 'pointer'
            }}
          >
            Submit
          </button>
        </div>
      </div>

      <div className="container-fluid" style={{ maxWidth: '1200px', padding: '20px' }}>
        <div className="row g-3">
          {/* Question Area */}
          <div className="col-lg-9">
            <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', minHeight: '400px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {/* Question Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#ff6b35', background: '#fff5f0', padding: '4px 12px', borderRadius: '6px' }}>
                  Question {currentQuestion + 1} of {testData.totalQuestions}
                </span>
                <span style={{ fontSize: '13px', color: '#888' }}>
                  Marks: {question.marks}{question.negativeMarks > 0 ? ` | -${question.negativeMarks}` : ''}
                </span>
              </div>

              {/* Question Text */}
              <h4 style={{ fontSize: '17px', fontWeight: 600, color: '#333', lineHeight: 1.7, marginBottom: '24px' }}>
                {question.questionText}
              </h4>

              {question.questionImage && (
                <img src={question.questionImage} alt="Question" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', marginBottom: '20px' }} />
              )}

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {question.options.map((option, idx) => {
                  const isSelected = currentAnswer.selectedOption === idx;
                  const labels = ['A', 'B', 'C', 'D'];
                  return (
                    <button
                      key={idx}
                      onClick={() => selectOption(idx)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '14px 18px', borderRadius: '10px', cursor: 'pointer',
                        border: isSelected ? '2px solid #ff6b35' : '1.5px solid #e0e0e0',
                        background: isSelected ? '#fff8f5' : '#fff',
                        transition: 'all 0.15s ease', textAlign: 'left',
                        fontSize: '15px', color: '#333'
                      }}
                    >
                      <span style={{
                        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '13px',
                        background: isSelected ? '#ff6b35' : '#f0f0f0',
                        color: isSelected ? '#fff' : '#555'
                      }}>
                        {labels[idx]}
                      </span>
                      <span>{option.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
                <button
                  onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))}
                  disabled={currentQuestion === 0}
                  style={{
                    padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                    background: currentQuestion === 0 ? '#e0e0e0' : '#f0f0f0', color: currentQuestion === 0 ? '#aaa' : '#333',
                    border: 'none', cursor: currentQuestion === 0 ? 'default' : 'pointer'
                  }}
                >
                  <i className="fa-solid fa-arrow-left me-2"></i>Previous
                </button>
                <button
                  onClick={() => setCurrentQuestion((p) => Math.min(testData.totalQuestions - 1, p + 1))}
                  disabled={currentQuestion === testData.totalQuestions - 1}
                  style={{
                    padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                    background: currentQuestion === testData.totalQuestions - 1 ? '#e0e0e0' : '#1a365d',
                    color: currentQuestion === testData.totalQuestions - 1 ? '#aaa' : '#fff',
                    border: 'none', cursor: currentQuestion === testData.totalQuestions - 1 ? 'default' : 'pointer'
                  }}
                >
                  Next<i className="fa-solid fa-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Question Panel Sidebar */}
          <div className="col-lg-3">
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', position: 'sticky', top: '80px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <h6 style={{ fontWeight: 700, color: '#1a365d', marginBottom: '14px', fontSize: '14px' }}>Question Panel</h6>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {answers.map((a, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestion(idx)}
                    style={{
                      width: '36px', height: '36px', borderRadius: '8px', fontSize: '13px',
                      fontWeight: 600, border: idx === currentQuestion ? '2px solid #1a365d' : '1px solid #e0e0e0',
                      background: a.selectedOption !== -1 ? '#4ade80' : idx === currentQuestion ? '#e8f0fe' : '#fff',
                      color: a.selectedOption !== -1 ? '#fff' : '#333',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#888' }}>
                <div><span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '4px', background: '#4ade80', marginRight: '6px', verticalAlign: 'middle' }}></span>Answered ({answeredCount})</div>
                <div><span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '4px', background: '#fff', border: '1px solid #e0e0e0', marginRight: '6px', verticalAlign: 'middle' }}></span>Unanswered ({unansweredCount})</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1050,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowConfirm(false)}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '90%'
          }} onClick={(e) => e.stopPropagation()}>
            <h4 style={{ fontWeight: 700, color: '#1a365d', marginBottom: '12px' }}>Submit Test?</h4>
            <p style={{ color: '#555', fontSize: '14px', marginBottom: '8px' }}>
              You have answered <strong>{answeredCount}</strong> out of <strong>{testData.totalQuestions}</strong> questions.
            </p>
            {unansweredCount > 0 && (
              <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>
                <i className="fa-solid fa-triangle-exclamation me-1"></i>
                {unansweredCount} question{unansweredCount > 1 ? 's are' : ' is'} unanswered.
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowConfirm(false)} style={{
                padding: '10px 24px', borderRadius: '8px', border: '1px solid #e0e0e0',
                background: '#fff', color: '#555', cursor: 'pointer', fontWeight: 600
              }}>Cancel</button>
              <button onClick={() => { setShowConfirm(false); handleSubmit(); }} disabled={submitting} style={{
                padding: '10px 24px', borderRadius: '8px', border: 'none',
                background: '#ff6b35', color: '#fff', cursor: 'pointer', fontWeight: 600
              }}>
                {submitting ? 'Submitting...' : 'Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockTestExam;
