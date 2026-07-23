import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, BookOpen, Building2, Clock, Headphones, School, Search, Trophy, Users, X } from 'lucide-react';
import { courseAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';
import PageAdvertisements from '../../components/PageAdvertisements/PageAdvertisements';

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
      // The page already renders its request failure state.
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
            <h1 className="courses-hero-title">
              Find Your Perfect <span>Course</span>
            </h1>
            <p className="courses-hero-subtitle">
              Explore our wide range of courses and find the one that fits your career goals
            </p>
            <div className="courses-search-wrapper">
              <div className="courses-search-box">
                <Search className="courses-search-icon" size={19} aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search courses, programs, or fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="courses-search-input"
                />
                {searchTerm && (
                  <button className="courses-search-clear" onClick={() => setSearchTerm('')}>
                    <X size={18} aria-hidden="true" />
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
              <BookOpen aria-hidden="true" />
              <div>
                <strong>{courses.length}</strong>
                <span>Courses</span>
              </div>
            </div>
            <div className="courses-stat-item">
              <Building2 aria-hidden="true" />
              <div>
                <strong>{[...new Set(courses.map(c => c.universityName).filter(Boolean))].length}</strong>
                <span>Universities</span>
              </div>
            </div>
            <div className="courses-stat-item">
              <Users aria-hidden="true" />
              <div>
                <strong>1000+</strong>
                <span>Students</span>
              </div>
            </div>
            <div className="courses-stat-item">
              <Trophy aria-hidden="true" />
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
        <div className="container-fluid">
          {filteredCourses.length === 0 ? (
            <div className="courses-empty">
              <Search size={42} aria-hidden="true" />
              <h3>No courses found</h3>
              <p>Try adjusting your search term</p>
            </div>
          ) : (
            <div className="row g-4">
              {filteredCourses.map((course, index) => {
                const gradient = COURSE_GRADIENTS[index % Object.keys(COURSE_GRADIENTS).length];
                return (
                  <div key={course._id} className="col-12 col-sm-6 col-lg-4">
                    <Link to={`/course/${course.slug || course._id}`} className="cp-card-link">
                      <div className="cp-card">
                      
                        <div className="cp-card-body">
                        
                          <div className="cp-card-title-wrap">
                            <h3 className="cp-card-title">{course.title}</h3>
                            <p className="cp-card-fullform">{course.fullForm || ''}</p>
                          </div>
                          <div className="cp-card-meta">
                            <div className="cp-card-meta-item">
                              <Building2 size={16} aria-hidden="true" />
                              <span>{course.universityName || 'University'}</span>
                            </div>
                            <div className="cp-card-meta-item">
                              <Clock size={16} aria-hidden="true" />
                              <span>{course.duration || 'Duration N/A'}</span>
                            </div>
                            {course.scholarshipAvailable && (
                              <div className="cp-card-meta-item cp-scholarship">
                                <Award size={16} aria-hidden="true" />
                                <span>Scholarship Available</span>
                              </div>
                            )}
                          </div>
                          {course.colleges && course.colleges.length > 0 && (
                            <div className="cp-card-colleges">
                              <School size={16} aria-hidden="true" />
                              <span>{course.colleges.length} College{course.colleges.length > 1 ? 's' : ''} Offering</span>
                            </div>
                          )}
                        </div>
                        <div className="cp-card-footer">
                          <span className="cp-card-cta">
                            View Details & Enroll
                            <ArrowRight size={16} aria-hidden="true" />
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

      <div className="container-fluid">
        <PageAdvertisements page="courses" />
      </div>

      {/* CTA Section */}
      <div className="courses-cta-section ">
        <div className="container-fluid text-center">
          <h2 className="courses-cta-title">Not sure which course to choose?</h2>
          <p className="courses-cta-text">
            Our counselors can help you pick the right program based on your interests and career goals.
          </p>
          <Link to="/contact" className="courses-cta-btn">
            <Headphones className="me-2" size={18} aria-hidden="true" />
            Get Free Counseling
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Courses;
