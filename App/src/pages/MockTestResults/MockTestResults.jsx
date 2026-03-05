import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockTestAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';

const MockTestResults = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const response = await mockTestAPI.getMyAttempts();
      if (response.data.success) {
        setAttempts(response.data.data.attempts || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attempts:', error);
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

  return (
    <div style={{ paddingTop: '130px', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontWeight: 700, color: '#1a365d', margin: 0 }}>
            <i className="fa-solid fa-chart-bar me-2"></i>My Test Results
          </h2>
          <Link to="/mocktests" style={{
            padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
            background: '#ff6b35', color: '#fff', textDecoration: 'none'
          }}>
            <i className="fa-solid fa-plus me-2"></i>Take New Test
          </Link>
        </div>

        {attempts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <i className="fa-solid fa-clipboard-list" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
            <h4 style={{ color: '#555', fontWeight: 600 }}>No attempts yet</h4>
            <p style={{ color: '#888' }}>Take a mock test to see your results here.</p>
            <Link to="/mocktests" style={{
              padding: '10px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              background: '#ff6b35', color: '#fff', textDecoration: 'none', display: 'inline-block', marginTop: '12px'
            }}>
              Browse Mock Tests
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {attempts.map((attempt) => {
              const isPassed = attempt.percentage >= 40;
              return (
                <Link
                  key={attempt._id}
                  to={`/mocktest-result/${attempt._id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: '#fff', borderRadius: '12px', padding: '20px 24px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex',
                    alignItems: 'center', gap: '20px', transition: 'box-shadow 0.2s',
                    borderLeft: `4px solid ${isPassed ? '#16a34a' : '#ef4444'}`
                  }}
                  onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)'}
                  onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}
                  >
                    {/* Score Circle */}
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
                      border: `3px solid ${isPassed ? '#16a34a' : '#ef4444'}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: isPassed ? '#16a34a' : '#ef4444', lineHeight: 1 }}>
                        {attempt.percentage}%
                      </span>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <h5 style={{ fontWeight: 600, color: '#1a365d', margin: '0 0 4px 0', fontSize: '15px' }}>
                        {attempt.mockTest?.title || 'Mock Test'}
                      </h5>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#888', flexWrap: 'wrap' }}>
                        <span><i className="fa-solid fa-check-circle me-1" style={{ color: '#16a34a' }}></i>{attempt.totalCorrect} correct</span>
                        <span><i className="fa-solid fa-xmark me-1" style={{ color: '#ef4444' }}></i>{attempt.totalWrong} wrong</span>
                        <span><i className="fa-solid fa-clock me-1"></i>{formatTime(attempt.timeTaken)}</span>
                        <span><i className="fa-solid fa-calendar me-1"></i>{new Date(attempt.completedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Score */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#1a365d' }}>
                        {attempt.totalScore}/{attempt.mockTest?.totalMarks || 0}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888' }}>marks</div>
                    </div>

                    <i className="fa-solid fa-chevron-right" style={{ color: '#ccc', fontSize: '14px' }}></i>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MockTestResults;
