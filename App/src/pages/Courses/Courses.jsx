import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';

const COURSE_ICONS = {
  'BIT': 'fa-laptop-code',
  'BCA': 'fa-desktop',
  'CMAT': 'fa-chart-line',
  'CSIT': 'fa-microchip',
  'BSc.CSIT': 'fa-microchip',
  'BE': 'fa-cogs',
  'IOT': 'fa-wifi',
};

const COURSE_GRADIENTS = {
  0: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  1: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  2: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  3: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  4: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  5: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
};

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCoursesData();
  }, []);

  const fetchCoursesData = async () => {
    try {
      const response = await courseAPI.getAllCourses();
      if (response.data.success) {
        setCourses(response.data.data.courses || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const term = searchTerm.toLowerCase();
    return (
      (course.title || '').toLowerCase().includes(term) ||
      (course.fullForm || '').toLowerCase().includes(term) ||
      (course.universityName || '').toLowerCase().includes(term)
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
              <i className="fa-solid fa-graduation-cap me-2"></i>
              Explore Programs
            </span>
            <h1 className="courses-hero-title">
              Find Your Perfect <span>Course</span>
            </h1>
            <p className="courses-hero-subtitle">
              Choose from our wide range of entrance preparation courses and start your journey towards academic excellence.
            </p>
            <div className="courses-search-wrapper">
              <div className="courses-search-box">
                <i className="fa-solid fa-magnifying-glass courses-search-icon"></i>
                <input
                  type="text"
                  placeholder="Search courses by name, university..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="courses-search-input"
                />
                {searchTerm && (
                  <button className="courses-search-clear" onClick={() => setSearchTerm('')}>
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
              <i className="fa-solid fa-book-open"></i>
              <div>
                <strong>{courses.length}</strong>
                <span>Courses</span>
              </div>
            </div>
            <div className="courses-stat-item">
              <i className="fa-solid fa-building-columns"></i>
              <div>
                <strong>{[...new Set(courses.map(c => c.universityName).filter(Boolean))].length}</strong>
                <span>Universities</span>
              </div>
            </div>
            <div className="courses-stat-item">
              <i className="fa-solid fa-users"></i>
              <div>
                <strong>1000+</strong>
                <span>Students</span>
              </div>
            </div>
            <div className="courses-stat-item">
              <i className="fa-solid fa-trophy"></i>
              <div>
                <strong>95%</strong>
                <span>Success Rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Cards */}
      <div className="courses-listing-section">
        <div className="container">
          {filteredCourses.length === 0 ? (
            <div className="courses-empty">
              <i className="fa-solid fa-face-sad-tear"></i>
              <h3>No courses found</h3>
              <p>Try adjusting your search term</p>
            </div>
          ) : (
            <div className="row g-4">
              {filteredCourses.map((course, index) => {
                const icon = COURSE_ICONS[course.title] || 'fa-book';
                const gradient = COURSE_GRADIENTS[index % Object.keys(COURSE_GRADIENTS).length];
                return (
                  <div key={course._id} className="col-12 col-sm-6 col-lg-4">
                    <Link to={`/course/${course._id}`} className="cp-card-link">
                      <div className="cp-card">
                      
                        <div className="cp-card-body">
                        
                          <div className="cp-card-title-wrap">
                            <h3 className="cp-card-title">{course.title}</h3>
                            <p className="cp-card-fullform">{course.fullForm || ''}</p>
                          </div>
                          <div className="cp-card-meta">
                            <div className="cp-card-meta-item">
                              <i className="fa-solid fa-building-columns"></i>
                              <span>{course.universityName || 'University'}</span>
                            </div>
                            <div className="cp-card-meta-item">
                              <i className="fa-solid fa-clock"></i>
                              <span>{course.duration || 'Duration N/A'}</span>
                            </div>
                            {course.scholarshipAvailable && (
                              <div className="cp-card-meta-item cp-scholarship">
                                <i className="fa-solid fa-award"></i>
                                <span>Scholarship Available</span>
                              </div>
                            )}
                          </div>
                          {course.colleges && course.colleges.length > 0 && (
                            <div className="cp-card-colleges">
                              <i className="fa-solid fa-school"></i>
                              <span>{course.colleges.length} College{course.colleges.length > 1 ? 's' : ''} Offering</span>
                            </div>
                          )}
                        </div>
                        <div className="cp-card-footer">
                          <span className="cp-card-cta">
                            View Details & Enroll
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
        </div>
      </div>

      {/* CTA Section */}
      <div className="courses-cta-section">
        <div className="container text-center">
          <h2 className="courses-cta-title">Not sure which course to choose?</h2>
          <p className="courses-cta-text">
            Our counselors can help you pick the right program based on your interests and career goals.
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

export default Courses;
