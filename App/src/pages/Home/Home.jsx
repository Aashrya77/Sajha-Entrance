import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { homeAPI } from '../../api/services';
import { getImageFieldUrl } from '../../utils/imageHelper';
import Loader from '../../components/Loader/Loader';
import LandingPage from '../../components/LandingPage/Landingpage';
import PageAdvertisements from '../../components/PageAdvertisements/PageAdvertisements';
import AnimatedCounter from '../../components/AnimatedCounter/AnimatedCounter';
import './Home.css';

const Home = () => {
  const [courses, setCourses] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const [landingAds, setLandingAds] = useState([]);
  const [topCollegeSection, setTopCollegeSection] = useState(undefined);

  useEffect(() => {
    fetchHomeData();
  }, []);

  useEffect(() => {
    // Show popup based on backend data
    if (popupData && popupData.isActive) {
      const hasSeenPopup = sessionStorage.getItem('hasSeenPopup');
      if (!hasSeenPopup || !popupData.showOncePerSession) {
        const timer = setTimeout(() => {
          setShowPopup(true);
        }, popupData.displayDelay || 2000);
        return () => clearTimeout(timer);
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
        setLandingAds(response.data.data.landingAds || []);
        setTopCollegeSection(response.data.data.topCollegeSection || null);
      }
      setLoading(false);
    } catch (error) {
      // The page already renders its request failure state.
      setLoading(false);
    }
  };

  return (
    <main className="home-page">
      <LandingPage landingAds={landingAds} topCollegeSection={topCollegeSection} />
      <div className="container-fluid home-advertisements"><PageAdvertisements page="home" /></div>

      {loading && <div className="home-content-loader" aria-label="Loading homepage content"><Loader /></div>}

      <section className="courses home-section home-listing-section" id="courses">
        <div className="container-fluid">
          <h1
            className="home-section-title text-uppercase text-center"
          >
            OUR <span style={{color: 'var(--primary-black)'}}>COURSES</span>
          </h1>
          <div className="row g-4 home-section-grid">
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

          <div className="home-section-action text-center">
            <Link to="/courses" className="btn-primary btn-lg">
              <i className="fa-solid fa-plus me-2"></i>More Courses
            </Link>
          </div>
        </div>
      </section>

      <section className="courses home-section home-listing-section" id="colleges">
        <div className="container-fluid">
          <h1
            className="home-section-title text-uppercase text-center"
          >
            TOP <span style={{color: 'var(--primary-black)'}}>COLLEGES</span>
          </h1>
          <div className="row g-4 home-section-grid">
            {colleges.map((college) => (
              <div key={college._id} className="col-12 col-sm-6 col-lg-3">
                <Link to={`/college/${college._id}`} className="college-card-link">
                  <div className="college-card-modern">
                    {/* College Banner */}
                    <div className="college-banner">
                      {college.collegeLogo ? (
                        <img
                          src={getImageFieldUrl(college, 'collegeLogo', 'colleges')}
                          alt="college-banner"
                          className="college-banner-image"
                          loading="lazy"
                          decoding="async"
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
                        <span className="college-location-text">{college.collegeAddress}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <div className="home-section-action text-center">
            <Link to="/colleges" className="btn-primary btn-lg">
              <i className="fa-solid fa-plus me-2"></i>More Colleges
            </Link>
          </div>
        </div>
      </section>

      

      {/* Why Choose Us Section */}
      <section className="why-choose-section home-section">
        <div className="container-fluid">
          <h2 className="section-title home-section-title text-center">
            <span className="text-orange">WHY CHOOSE</span> <span className="text-dark">US ?</span>
          </h2>
          <div className="row g-4 home-section-grid">
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
      </section>
              {/* Stats Counter Section */}
        <section className="stats-section home-section">
          <div className="container-fluid">
            <div className="row text-center">
              <div className="col-6 col-md-3">
                <div className="stat-item">
                  <span className="stat-number"><AnimatedCounter end={16} /> +</span>
                  <span className="stat-label">STAFF TEAM</span>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="stat-item">
                  <span className="stat-number"><AnimatedCounter end={24} /> +</span>
                  <span className="stat-label">TEACHERS</span>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="stat-item">
                  <span className="stat-number"><AnimatedCounter end={6000} /> +</span>
                  <span className="stat-label">STUDENTS</span>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="stat-item">
                  <span className="stat-number"><AnimatedCounter end={35} /> +</span>
                  <span className="stat-label">COLLEGES</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* Quote Section */}
      <section className="quote-section home-section">
        <div className="container-fluid text-center">
          <p className="quote-text">
            "education is the passport to the future, for tomorrow belongs to those who prepare for it today"
          </p>
          <p className="quote-author">MalcolmX -</p>
        </div>
      </section>

      {/* Learn from the Best Section */}
      <section className="learn-best-section home-section home-info-section">
        <div className="container-fluid">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <h2 className="section-heading">
                Learn from the <span className="text-orange">best</span>
              </h2>
              <p className="section-text">
                We have a range of expert teachers from each faculty for different courses. Students who wish to join are free to interact with any teacher and TU professionals. Our highly experienced faculty members are always available to solve students' queries during the teaching period and provide proper academic guidance. <br /> <br />

                <span  style={{fontWeight: 500, color: 'var(--primary-orange)'}} >In 2082, we successfully produced the Nepal Top Rank 1 in CSIT.</span> Many of our students secured positions within the Top 100, and                 several students were selected for government scholarships. We are truly grateful for the trust of our students, the dedication of our                teachers, and the continuous effort of our management team that made these achievements possible.
                <span  style={{fontWeight: 500, color: 'var(--primary-orange)'}} >We warmly invite you to visit us once after your +2 for future academic guidance and professional IT training.</span>
              </p>
            </div>
            <div className="col-lg-6">
              <img src="/sajhaphoto/sajhastudents.jpg" alt="Learn from the best" className="section-image section-image--photo img-fluid" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </section>

      {/* Class Preference Section */}
      <section className="class-preference-section home-section home-info-section">
        <div className="container-fluid">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6 order-lg-1 order-2">
              <img src="/img/online.png" alt="Class as per your preference" className="section-image section-image--illustration" loading="lazy" decoding="async" />
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
      </section>

      {/* Scholarship Section */}
      <section className="scholarship-section home-section home-info-section">
        <div className="container-fluid">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <h2 className="section-heading">
                Chance to get huge <span className="text-orange">scholarships</span>
              </h2>
              <p className="section-text">
                Deserving students & merit based students have a high chance for scholarship. Every year, we aim to provide scholarships to more than 150 students on enrollment for IT and various other programs. This has been a great opportunity for students to pursue their dreams.
              </p>
            </div>
            <div className="col-lg-6">
              <img src="/img/scholar.png" alt="Scholarships" className="section-image section-image--illustration" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </section>

      {/* Mock Tests Section */}
      <section className="mock-tests-section home-section home-info-section">
        <div className="container-fluid">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6 order-lg-1 order-2">
              <img src="/img/exam.png" alt="Mock Tests" className="section-image section-image--illustration" loading="lazy" decoding="async" />
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
      </section>

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
                  src={getImageFieldUrl(popupData, 'popupImage', 'popups')} 
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
    </main>
  );
};

export default Home;
