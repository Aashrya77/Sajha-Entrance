import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockTestAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';

const MockTests = ({ isAuthenticated }) => {
  const [mockTests, setMockTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('mocktest');

  useEffect(() => {
    fetchMockTests();
  }, []);

  const fetchMockTests = async () => {
    try {
      const response = await mockTestAPI.getAllMockTests(searchTerm);
      if (response.data.success) {
        setMockTests(response.data.data.mockTests || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching mock tests:', error);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchMockTests();
  };

  const filteredTests = mockTests.filter((test) => {
    const term = searchTerm.toLowerCase();
    return (
      (test.title || '').toLowerCase().includes(term) ||
      (test.admissionTest || '').toLowerCase().includes(term) ||
      (test.course || '').toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  return (
    <div style={{ paddingTop: '125px', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div className="container">
        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '0', borderBottom: '2px solid #e0e0e0', marginBottom: '24px'
        }}>
          {[
            { key: 'online', label: 'Online Exam', icon: 'fa-laptop' },
            { key: 'physical', label: 'Physical Exam', icon: 'fa-building' },
            { key: 'mocktest', label: 'Mock Test', icon: 'fa-file-lines' },
            { key: 'results', label: 'Results', icon: 'fa-chart-bar' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === 'results') {
                  window.location.href = isAuthenticated ? '/mocktest-results' : '/student/login';
                }
              }}
              style={{
                padding: '12px 28px',
                fontSize: '15px',
                fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? '#1a365d' : '#888',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.key ? '3px solid #1a365d' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontStyle: (tab.key === 'online' || tab.key === 'physical') ? 'italic' : 'normal',
              }}
            >
              <i className={`fa-solid ${tab.icon} me-2`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Coming Soon for Online Exam and Physical Exam */}
        {(activeTab === 'online' || activeTab === 'physical') && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#888' }}>
            <i className="fa-solid fa-clock" style={{ fontSize: '48px', marginBottom: '16px', color: '#ccc' }}></i>
            <h3 style={{ fontWeight: 700, color: '#555' }}>Coming Soon</h3>
            <p>This feature will be available soon. Stay tuned!</p>
          </div>
        )}

        {/* Mock Test Tab */}
        {activeTab === 'mocktest' && (
          <>
            {/* Search Bar */}
            <div style={{
              background: '#fff', borderRadius: '10px', padding: '4px',
              border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center',
              marginBottom: '28px', maxWidth: '600px'
            }}>
              <i className="fa-solid fa-magnifying-glass" style={{ padding: '0 12px', color: '#aaa' }}></i>
              <input
                type="text"
                placeholder="Search ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                style={{
                  flex: 1, border: 'none', outline: 'none', padding: '10px 4px',
                  fontSize: '15px', background: 'transparent'
                }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{
                  border: 'none', background: 'none', cursor: 'pointer', padding: '0 12px', color: '#aaa'
                }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            {/* Test Cards */}
            {filteredTests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                <i className="fa-solid fa-file-circle-xmark" style={{ fontSize: '48px', marginBottom: '16px', color: '#ccc' }}></i>
                <h3 style={{ fontWeight: 700, color: '#555' }}>No mock tests found</h3>
                <p>Try adjusting your search or check back later.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filteredTests.map((test) => (
                  <div
                    key={test._id}
                    style={{
                      background: '#fff', borderRadius: '12px', padding: '24px 28px',
                      border: '1px solid #e8e8e8', transition: 'box-shadow 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)'}
                    onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1a365d', margin: 0 }}>
                        {test.title}
                      </h3>
                      <span style={{
                        padding: '4px 14px', borderRadius: '20px', fontSize: '13px',
                        fontWeight: 600, border: '1.5px solid #ff6b35', color: '#ff6b35',
                        whiteSpace: 'nowrap'
                      }}>
                        Total marks: {test.totalMarks}
                      </span>
                    </div>

                    {/* Question Count */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#555', fontSize: '14px' }}>
                      <i className="fa-solid fa-clipboard-list" style={{ color: '#888' }}></i>
                      <span><strong>{test.totalQuestions}</strong> Total Questions</span>
                    </div>

                    {/* Admission Test */}
                    {test.admissionTest && (
                      <div style={{ marginBottom: '6px', fontSize: '14px', color: '#444' }}>
                        <strong>Admission Test:</strong> {test.admissionTest}
                      </div>
                    )}

                    {/* Course */}
                    {test.course && (
                      <div style={{ marginBottom: '14px', fontSize: '14px', color: '#555', lineHeight: 1.6 }}>
                        <strong>Course:</strong> {test.course}
                      </div>
                    )}

                    {/* Duration + Start Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#888' }}>
                        <span><i className="fa-solid fa-clock me-1"></i>{test.duration} mins</span>
                      </div>
                      <Link
                        to={isAuthenticated ? `/mocktest/${test._id}` : '/student/login'}
                        style={{
                          padding: '10px 32px', borderRadius: '25px', fontSize: '14px',
                          fontWeight: 600, backgroundColor: '#ff6b35', color: '#fff',
                          textDecoration: 'none', border: 'none', cursor: 'pointer',
                          transition: 'all 0.2s ease', display: 'inline-block'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e55a2b'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff6b35'}
                      >
                        Start Test
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MockTests;
