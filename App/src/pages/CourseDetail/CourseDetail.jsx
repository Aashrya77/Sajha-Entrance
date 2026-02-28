import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';
import EsewaPayment from '../../components/Payment/EsewaPayment';

const TABS = [
  { key: 'about', label: 'About', icon: 'fa-info-circle' },
  { key: 'eligibility', label: 'Eligibility', icon: 'fa-clipboard-check' },
  { key: 'curriculum', label: 'Curriculum', icon: 'fa-book-open' },
  { key: 'careers', label: 'Job Prospects', icon: 'fa-briefcase' },
];

const CourseDetail = () => {
  const { id } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    fetchCourseDetail();
  }, [id]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const fetchCourseDetail = async () => {
    try {
      const response = await courseAPI.getCourseById(id);
      if (response.data.success) {
        setCourseData(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching course details:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  if (!courseData || !courseData.courseData) {
    return (
      <div className="cd-not-found">
        <div className="container-fluid text-center">
          <i className="fa-solid fa-circle-exclamation"></i>
          <h2>Course Not Found</h2>
          <p>The course you're looking for doesn't exist or has been removed.</p>
          <Link to="/courses" className="cd-back-btn">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const { courseData: course, colleges } = courseData;

  const tabContent = {
    about: course.aboutTab || course.descriptionFormatted || '<p>Information will be updated soon.</p>',
    eligibility: course.eligibilityTab || '<p>Information will be updated soon.</p>',
    curriculum: course.curricularStructureTab || '<p>Information will be updated soon.</p>',
    careers: course.jobProspectsTab || '<p>Information will be updated soon.</p>',
  };

  return (
    <div className="cd-page">
      {/* Hero Header */}
      <div className="cd-hero">
        <div className="cd-hero-overlay"></div>
        <div className="container position-relative">
          <div className="cd-hero-content">
            <Link to="/courses" className="cd-breadcrumb-link">
              <i className="fa-solid fa-arrow-left me-2"></i>All Courses
            </Link>
            <div className="cd-hero-title-row">
              <div className="cd-hero-icon">
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <div>
                <h1 className="cd-hero-title">{course.title}</h1>
                {course.fullForm && <p className="cd-hero-fullform">{course.fullForm}</p>}
              </div>
            </div>
            <div className="cd-hero-badges">
              {course.universityName && (
                <span className="cd-badge">
                  <i className="fa-solid fa-building-columns me-1"></i>{course.universityName}
                </span>
              )}
              {course.duration && (
                <span className="cd-badge">
                  <i className="fa-solid fa-clock me-1"></i>{course.duration}
                </span>
              )}
              {course.scholarshipAvailable && (
                <span className="cd-badge cd-badge-highlight">
                  <i className="fa-solid fa-award me-1"></i>Scholarship Available
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="cd-main">
        <div className="container">
          <div className="row">
            {/* Left: Tabs + Content */}
            <div className="col-lg-8">
              {/* Tab Navigation */}
              <div className="cd-tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    className={`cd-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <i className={`fa-solid ${tab.icon} me-2`}></i>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="cd-tab-content">
                <div
                  className="tab-content-inner"
                  dangerouslySetInnerHTML={{ __html: tabContent[activeTab] }}
                />
              </div>

              {/* Colleges Section */}
              {colleges && colleges.length > 0 && (
                <div className="cd-colleges-section">
                  <h3 className="cd-section-title">
                    <i className="fa-solid fa-school me-2"></i>
                    Colleges Offering This Course
                  </h3>
                  <div className="cd-colleges-grid">
                    {colleges.map((college) => (
                      <Link
                        key={college.collegeDetails?._id}
                        to={`/college/${college.collegeDetails?._id}`}
                        className="cd-college-card"
                      >
                        <div className="cd-college-icon">
                          <i className="fa-solid fa-building"></i>
                        </div>
                        <div className="cd-college-info">
                          <h4>{college.collegeDetails?.collegeName || 'College Name'}</h4>
                          <div className="cd-college-meta">
                            {college.fee && <span><i className="fa-solid fa-money-bill me-1"></i>{college.fee}</span>}
                            {college.seatsAvailable && <span><i className="fa-solid fa-chair me-1"></i>{college.seatsAvailable} Seats</span>}
                            {college.scholarshipAvailable && <span className="cd-college-scholarship"><i className="fa-solid fa-award me-1"></i>Scholarship</span>}
                          </div>
                        </div>
                        <i className="fa-solid fa-chevron-right cd-college-arrow"></i>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Sidebar */}
            <div className="col-lg-4">
              <div className="cd-sidebar">
                {/* Quick Info Card */}
                <div className="cd-sidebar-card">
                  <h4 className="cd-sidebar-title">
                    <i className="fa-solid fa-circle-info me-2"></i>Quick Information
                  </h4>
                  <div className="cd-info-list">
                    <div className="cd-info-item">
                      <div className="cd-info-icon"><i className="fa-solid fa-clock"></i></div>
                      <div>
                        <span className="cd-info-label">Duration</span>
                        <span className="cd-info-value">{course.duration || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="cd-info-item">
                      <div className="cd-info-icon"><i className="fa-solid fa-building-columns"></i></div>
                      <div>
                        <span className="cd-info-label">University</span>
                        <span className="cd-info-value">{course.universityName || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="cd-info-item">
                      <div className="cd-info-icon"><i className="fa-solid fa-layer-group"></i></div>
                      <div>
                        <span className="cd-info-label">Level</span>
                        <span className="cd-info-value">Bachelor</span>
                      </div>
                    </div>
                    <div className="cd-info-item">
                      <div className="cd-info-icon"><i className="fa-solid fa-school"></i></div>
                      <div>
                        <span className="cd-info-label">Colleges</span>
                        <span className="cd-info-value">{colleges ? colleges.length : 0} Available</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enrollment / Payment Card */}
                <div className="cd-sidebar-card cd-enroll-card">
                  <h4 className="cd-sidebar-title">
                    <i className="fa-solid fa-user-plus me-2"></i>Enroll in This Course
                  </h4>
                  <p className="cd-enroll-desc">
                    Secure your seat for the {course.title} entrance preparation class. Pay securely via eSewa.
                  </p>
                  <div className="cd-price-row">
                    <span className="cd-price-label">Course Fee</span>
                    <span className="cd-price-value">Rs. 5,000</span>
                  </div>
                  {!showPayment ? (
                    <button className="cd-enroll-btn" onClick={() => setShowPayment(true)}>
                      <i className="fa-solid fa-credit-card me-2"></i>
                      Pay with eSewa
                    </button>
                  ) : (
                    <EsewaPayment
                      courseId={id}
                      courseTitle={course.title}
                      amount={5000}
                      onCancel={() => setShowPayment(false)}
                    />
                  )}
                  <div className="cd-secure-note">
                    <i className="fa-solid fa-shield-halved me-1"></i>
                    Secure payment powered by eSewa
                  </div>
                </div>

                {/* Scholarship Info */}
                {course.scholarshipAvailable && course.scholarshipDescription && (
                  <div className="cd-sidebar-card cd-scholarship-card">
                    <h4 className="cd-sidebar-title">
                      <i className="fa-solid fa-award me-2"></i>Scholarship Info
                    </h4>
                    <div
                      className="cd-scholarship-content"
                      dangerouslySetInnerHTML={{ __html: course.scholarshipDescription }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
