import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { universityAPI } from '../../api/services';
import { getImageUrl } from '../../utils/imageHelper';
import Loader from '../../components/Loader/Loader';

const UNI_GRADIENTS = {
  0: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  1: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  2: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  3: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  4: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  5: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
};

const Universities = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [previousPage, setPreviousPage] = useState(0);
  const [nextPage, setNextPage] = useState(0);
  const [noResult, setNoResult] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await universityAPI.getAllUniversities(currentPage, searchTerm);
      if (response.data.success) {
        setUniversities(response.data.data.universities || []);
        setPreviousPage(response.data.data.previousPage || 0);
        setNextPage(response.data.data.nextPage || 0);
        setNoResult(response.data.data.noResult || false);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching universities:', error);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  const filteredUniversities = universities.filter((uni) => {
    const term = searchTerm.toLowerCase();
    return (
      (uni.universityName || '').toLowerCase().includes(term) ||
      (uni.universityAddress || '').toLowerCase().includes(term) ||
      (uni.type || '').toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  return (
    <div className="courses-page">
      {/* Hero Banner */}
      <div className="courses-hero">
        <div className="courses-hero-overlay"></div>
        <div className="container position-relative">
          <div className="courses-hero-content text-center">
            <span className="courses-hero-badge">
              <i className="fa-solid fa-building-columns me-2"></i>
              Explore Universities
            </span>
            <h1 className="courses-hero-title">
              Find Your Ideal <span>University</span>
            </h1>
            <p className="courses-hero-subtitle">
              Discover top universities in Nepal with detailed information about programs, admissions, and campus life.
            </p>
            <div className="courses-search-wrapper">
              <div className="courses-search-box">
                <i className="fa-solid fa-magnifying-glass courses-search-icon"></i>
                <input
                  type="text"
                  placeholder="Search universities by name, location, type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                  className="courses-search-input"
                />
                {searchTerm && (
                  <button className="courses-search-clear" onClick={() => { setSearchTerm(''); setCurrentPage(1); fetchData(); }}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="courses-stats-strip">
        <div className="container">
          <div className="courses-stats-row">
            <div className="courses-stat-item">
              <i className="fa-solid fa-building-columns"></i>
              <div>
                <strong>{universities.length}</strong>
                <span>Universities</span>
              </div>
            </div>
            <div className="courses-stat-item">
              <i className="fa-solid fa-book-open"></i>
              <div>
                <strong>{[...new Set(universities.flatMap(u => (u.coursesOffered || []).map(c => c._id || c)))].length}</strong>
                <span>Programs</span>
              </div>
            </div>
            <div className="courses-stat-item">
              <i className="fa-solid fa-school"></i>
              <div>
                <strong>{[...new Set(universities.flatMap(u => (u.affiliatedColleges || []).map(c => c._id || c)))].length}</strong>
                <span>Affiliated Colleges</span>
              </div>
            </div>
            <div className="courses-stat-item">
              <i className="fa-solid fa-trophy"></i>
              <div>
                <strong>100%</strong>
                <span>Recognized</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* University Cards */}
      <div className="courses-listing-section">
        <div className="container-fluid">
          {noResult || filteredUniversities.length === 0 ? (
            <div className="courses-empty">
              <i className="fa-solid fa-face-sad-tear"></i>
              <h3>No universities found</h3>
              <p>Try adjusting your search term</p>
            </div>
          ) : (
            <div className="row g-4">
              {filteredUniversities.map((uni, index) => {
                const gradient = UNI_GRADIENTS[index % Object.keys(UNI_GRADIENTS).length];
                return (
                  <div key={uni._id} className="col-12 col-sm-6 col-lg-4">
                    <Link to={`/university/${uni._id}`} className="cp-card-link">
                      <div className="cp-card">
                        {/* University Logo Banner */}
                        {uni.universityLogo && (
                          <div style={{
                            height: '140px',
                            overflow: 'hidden',
                            borderRadius: '12px 12px 0 0',
                            background: '#f8f9fa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <img
                              src={getImageUrl(uni.universityLogo, 'universities')}
                              alt={uni.universityName}
                              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', padding: '16px' }}
                            />
                          </div>
                        )}

                        <div className="cp-card-body">
                          <div className="cp-card-title-wrap">
                            <h3 className="cp-card-title">{uni.universityName}</h3>
                            {uni.type && (
                              <p className="cp-card-fullform">
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 10px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  backgroundColor: uni.type === 'Public' ? '#e8f5e9' : uni.type === 'Private' ? '#fff3e0' : '#e3f2fd',
                                  color: uni.type === 'Public' ? '#2e7d32' : uni.type === 'Private' ? '#e65100' : '#1565c0',
                                }}>
                                  {uni.type}
                                </span>
                              </p>
                            )}
                          </div>
                          <div className="cp-card-meta">
                            <div className="cp-card-meta-item">
                              <i className="fa-solid fa-location-dot"></i>
                              <span>{uni.universityAddress || 'Location N/A'}</span>
                            </div>
                            {uni.establishedYear && (
                              <div className="cp-card-meta-item">
                                <i className="fa-solid fa-calendar"></i>
                                <span>Established {uni.establishedYear}</span>
                              </div>
                            )}
                            {uni.coursesOffered && uni.coursesOffered.length > 0 && (
                              <div className="cp-card-meta-item cp-scholarship">
                                <i className="fa-solid fa-book-open"></i>
                                <span>{uni.coursesOffered.length} Program{uni.coursesOffered.length > 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                          {uni.affiliatedColleges && uni.affiliatedColleges.length > 0 && (
                            <div className="cp-card-colleges">
                              <i className="fa-solid fa-school"></i>
                              <span>{uni.affiliatedColleges.length} Affiliated College{uni.affiliatedColleges.length > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                        <div className="cp-card-footer">
                          <span className="cp-card-cta">
                            View Details
                            <i className="fa-solid fa-arrow-right"></i>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {(previousPage !== 0 || nextPage !== 0) && (
            <div className="d-flex justify-content-between mt-4 mx-2">
              <div>
                {previousPage !== 0 && (
                  <button
                    className="pageButton d-flex align-items-center justify-content-center"
                    onClick={() => setCurrentPage(previousPage)}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      border: '2px solid #ff6b35', background: 'transparent',
                      color: '#ff6b35', cursor: 'pointer', fontSize: '16px'
                    }}
                  >
                    <i className="fa-solid fa-angle-left"></i>
                  </button>
                )}
              </div>
              <div>
                {nextPage !== 0 && (
                  <button
                    className="pageButton d-flex align-items-center justify-content-center"
                    onClick={() => setCurrentPage(nextPage)}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      border: '2px solid #ff6b35', background: 'transparent',
                      color: '#ff6b35', cursor: 'pointer', fontSize: '16px'
                    }}
                  >
                    <i className="fa-solid fa-angle-right"></i>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="courses-cta-section">
        <div className="container-fluid text-center">
          <h2 className="courses-cta-title">Not sure which university to choose?</h2>
          <p className="courses-cta-text">
            Our counselors can help you pick the right university based on your interests and career goals.
          </p>
          <Link to="/contact" className="courses-cta-btn">
            <i className="fa-solid fa-headset me-2"></i>
            Get Free Counseling
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Universities;
