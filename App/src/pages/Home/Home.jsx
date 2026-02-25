import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { homeAPI } from '../../api/services';
import { getImageUrl } from '../../utils/imageHelper';
import Loader from '../../components/Loader/Loader';
import LandingPage from '../../components/LandingPage/Landingpage';
import './Home.css';

const Home = () => {
  const [courses, setCourses] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);

  useEffect(() => {
    fetchHomeData();
  }, []);

  useEffect(() => {
    // Show popup based on backend data
    if (popupData && popupData.isActive) {
      const hasSeenPopup = sessionStorage.getItem('hasSeenPopup');
      if (!hasSeenPopup || !popupData.showOncePerSession) {
        setTimeout(() => {
          setShowPopup(true);
        }, popupData.displayDelay || 2000);
      }
    }
  }, [popupData]);

  const closePopup = () => {
    setShowPopup(false);
    if (popupData?.showOncePerSession) {
      sessionStorage.setItem('hasSeenPopup', 'true');
    }
  };

  const fetchHomeData = async () => {
    try {
      const response = await homeAPI.getHomeData();
      if (response.data.success) {
        setCourses(response.data.data.courses || []);
        setColleges(response.data.data.colleges || []);
        setPopupData(response.data.data.popup || null);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching home data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  return (
    <>
      <LandingPage />

      <div className="courses mt-5" id="courses">
        <div className="container">
          <h1
            className="text-uppercase mb-4 text-center"
            style={{fontWeight: 900, color: 'var(--primary-orange)'}}
          >
            OUR <span style={{color: 'var(--primary-black)'}}>COURSES</span>
          </h1>
          <div className="row g-4 mt-4">
            {courses.map((course) => (
              <div key={course._id} className="col-12 col-sm-6 col-lg-3">
                <Link to={`/course/${course._id}`} className="course-card-link">
                  <div className="course-card-modern course-card-compact">
                    <div className="course-card-content">
                      <div className="course-title-section">
                        <h5 className="course-title">{course.fullForm ? course.fullForm : course.title}</h5>
                      </div>

                      <div className="course-university-section">
                        <i className="fa-solid fa-building-columns university-icon"></i>
                        <span className="university-name">{course.universityName || 'University Affiliation'}</span>
                      </div>

                      <div className="course-duration-section">
                        <i className="fa-solid fa-clock duration-icon"></i>
                        <span className="duration-text">{course.duration || 'Duration'}</span>
                      </div>
                    </div>

                    <div className="course-card-footer">
                      <div className="course-action">
                        <span className="action-text">Learn More</span>
                        <i className="fa-solid fa-arrow-right action-arrow"></i>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-3">
            <Link to="/courses" className="btn-primary btn-lg">
              <i className="fa-solid fa-plus me-2"></i>More Courses
            </Link>
          </div>
        </div>
      </div>

      <div className="courses mt-5" id="colleges">
        <div className="container">
          <h1
            className="text-uppercase mb-4 text-center"
            style={{fontWeight: 900, color: 'var(--primary-orange)'}}
          >
            TOP <span style={{color: 'var(--primary-black)'}}>COLLEGES</span>
          </h1>
          <div className="row g-4 mt-4">
            {colleges.map((college) => (
              <div key={college._id} className="col-6 col-sm-6 col-lg-3">
                <Link to={`/college/${college._id}`} className="college-card-link">
                  <div className="college-card-modern">
                    {/* College Banner */}
                    <div className="college-banner">
                      {college.collegeLogo ? (
                        <img
                          src={getImageUrl(college.collegeLogo, 'colleges')}
                          alt="college-banner"
                          className="college-banner-image"
                        />
                      ) : (
                        <div className="college-banner-placeholder">
                          <i className="fa-solid fa-building-columns college-banner-placeholder-icon"></i>
                        </div>
                      )}
                    </div>

                    {/* College Content */}
                    <div className="college-content">
                      <div className="college-name-section">
                        <h3 className="college-name">{college.collegeName}</h3>
                        <i className="fa-solid fa-circle-check verified-icon"></i>
                      </div>

                      <div className="college-university-section">
                        <i className="fa-solid fa-building-columns university-icon"></i>
                        <span className="university-name">
                          {college.universityName || 'University Affiliation'}
                        </span>
                      </div>

                      <div className="college-location-section">
                        <i className="fa-solid fa-location-dot location-icon"></i>
                        <span className="location-text">{college.collegeAddress}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-3">
            <Link to="/colleges" className="btn-primary btn-lg">
              <i className="fa-solid fa-plus me-2"></i>More Colleges
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Counter Section */}
      <div className="stats-section">
        <div className="container">
          <div className="row text-center">
            <div className="col-6 col-md-3">
              <div className="stat-item">
                <span className="stat-number">16 +</span>
                <span className="stat-label">STAFF TEAM</span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-item">
                <span className="stat-number">24 +</span>
                <span className="stat-label">TEACHERS</span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-item">
                <span className="stat-number">6000 +</span>
                <span className="stat-label">STUDENTS</span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-item">
                <span className="stat-number">35 +</span>
                <span className="stat-label">COLLEGES</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="why-choose-section">
        <div className="container">
          <h2 className="section-title text-center">
            <span className="text-orange">WHY CHOOSE</span> <span className="text-dark">US ?</span>
          </h2>
          <div className="row g-4 mt-4">
            <div className="col-12 col-md-6 col-lg-3">
              <div className="feature-card text-center">
                <div className="feature-icon">
                  <i className="fa-solid fa-circle-question"></i>
                </div>
                <h4 className="feature-title">Authentic Questions</h4>
                <p className="feature-description">
                  We seek to provide real and repeated and also latest reliable questions for all of the course in mocktest as well as in the tasks of the book.
                </p>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div className="feature-card text-center">
                <div className="feature-icon feature-icon-yellow">
                  <i className="fa-solid fa-lightbulb"></i>
                </div>
                <h4 className="feature-title">Hints & Solutions</h4>
                <p className="feature-description">
                  We include many useful hints for solving the problems including the solution that really helps the students to crack the entrance exam.
                </p>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div className="feature-card text-center">
                <div className="feature-icon feature-icon-blue">
                  <i className="fa-solid fa-book-open"></i>
                </div>
                <h4 className="feature-title">Chapterwise Practice Set</h4>
                <p className="feature-description">
                  There are chapter wise practice set which are repeatedly asked, suggested by expertise and seems to be important for entrance exam.
                </p>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div className="feature-card text-center">
                <div className="feature-icon feature-icon-green">
                  <i className="fa-solid fa-file-pen"></i>
                </div>
                <h4 className="feature-title">Regular Mock Tests</h4>
                <p className="feature-description">
                  Every Saturday, we conduct free mock test that can boost the hard effort and prepare the students to crack the entrance exam with ease.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Section */}
      <div className="quote-section">
        <div className="container text-center">
          <p className="quote-text">
            "education is the passport to the future, for tomorrow belongs to those who prepare for it today"
          </p>
          <p className="quote-author">MalcolmX -</p>
        </div>
      </div>

      {/* Learn from the Best Section */}
      <div className="learn-best-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2 className="section-heading">
                Learn from the <span className="text-orange">best</span>
              </h2>
              <p className="section-text">
                We have a range of expert teachers of each faculty for different courses. Students who wants to join are free to interact with any teachers and TU professionals and highly experienced teachers faculty are maintained to solve students query during teaching period.
              </p>
            </div>
            <div className="col-lg-6">
              <img src="/img/learn.png" alt="Learn from the best" className="section-image" />
            </div>
          </div>
        </div>
      </div>

      {/* Class Preference Section */}
      <div className="class-preference-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 order-lg-1 order-2">
              <img src="/img/online.png" alt="Class as per your preference" className="section-image" />
            </div>
            <div className="col-lg-6 order-lg-2 order-1">
              <h2 className="section-heading">
                Class as per your <span className="text-orange">preference</span>
              </h2>
              <p className="section-text">
                Both Morning, Day, Evening shift are available for enrollment. We serve Morning & Day shift for physical classes whereas Evening shift is for those students who prefer online classes for any program. With the help of Digital Board, students can be able to study as like a physical ones.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scholarship Section */}
      <div className="scholarship-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2 className="section-heading">
                Chance to get huge <span className="text-orange">scholarships</span>
              </h2>
              <p className="section-text">
                Deserving students & merit based students have a high chance for scholarship. Every year, we aim to provide scholarships to more than 150 students on enrollment for IT and various other programs. This has been a great opportunity for students to pursue their dreams.
              </p>
            </div>
            <div className="col-lg-6">
              <img src="/img/scholar.png" alt="Scholarships" className="section-image" />
            </div>
          </div>
        </div>
      </div>

      {/* Mock Tests Section */}
      <div className="mock-tests-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 order-lg-1 order-2">
              <img src="/img/exam.png" alt="Mock Tests" className="section-image" />
            </div>
            <div className="col-lg-6 order-lg-2 order-1">
              <h2 className="section-heading">
                Test your limits with our <span className="text-orange">mock tests</span>
              </h2>
              <p className="section-text">
                We understand the importance of practice and preparation when it comes to competitive exams. To assist our students we offer authentic and TU based mock tests every Saturday where students can experience similar structure, format and time constrains of the actual exam.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      {showPopup && popupData && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-modal popup-image-modal" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={closePopup}>
              <i className="fa-solid fa-times"></i>
            </button>
            {popupData.popupType === 'image' && popupData.popupImage ? (
              <a 
                href={popupData.redirectUrl || '#'} 
                target={popupData.redirectUrl ? '_blank' : '_self'}
                rel="noopener noreferrer"
                onClick={(e) => !popupData.redirectUrl && e.preventDefault()}
              >
                <img 
                  src={getImageUrl(popupData.popupImage, 'popups')} 
                  alt={popupData.popupTitle || 'Popup'} 
                  className="popup-image"
                />
              </a>
            ) : (
              <div className="popup-text-content">
                {popupData.popupHeading && (
                  <h2 className="popup-heading">{popupData.popupHeading}</h2>
                )}
                {popupData.popupDescription && (
                  <p className="popup-description">{popupData.popupDescription}</p>
                )}
                {popupData.redirectUrl && (
                  <a href={popupData.redirectUrl} className="popup-button">
                    {popupData.buttonText || 'Learn More'}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
