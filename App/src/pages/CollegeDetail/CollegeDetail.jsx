import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collegeAPI } from '../../api/services';
import { getImageUrl } from '../../utils/imageHelper';
import './CollegeDetail.css';
import Loader from '../../components/Loader/Loader';

const CollegeDetail = () => {
  const { id } = useParams();
  const [collegeData, setCollegeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('admission');

  useEffect(() => {
    fetchCollegeDetail();
  }, [id]); // eslint-disable-next-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.college-section');
      let currentSection = 'admission';
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        if (window.scrollY >= sectionTop) {
          currentSection = section.getAttribute('id');
        }
      });
      
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchCollegeDetail = async () => {
    try {
      const response = await collegeAPI.getCollegeById(id);
      if (response.data.success) {
        setCollegeData(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching college details:', error);
      setLoading(false);
    }
  };

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    setActiveSection(sectionId);
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  if (!collegeData || !collegeData.collegeData) {
    return <div className="container mt-5 pt-5 text-center">College not found</div>;
  }

  const { collegeData: college, courses } = collegeData;

  return (
    <div className="college-profile">
      {/* Cover Image Section */}
      <div 
        className="college-cover-section"
        style={college.collegeCover ? {
          backgroundImage: `url(${getImageUrl(college.collegeCover, 'colleges')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        <div className="college-cover-placeholder" style={college.collegeCover ? {background: 'rgba(0,0,0,0.3)'} : {}}>
          <div className="college-logo-circle">
            {college.collegeLogo ? (
              <img
                src={getImageUrl(college.collegeLogo, 'colleges')}
                alt={`${college.collegeName} logo`}
                className="college-logo-image"
              />
            ) : (
              <div className="college-logo-placeholder">
                <i className="fa-solid fa-building-columns college-placeholder-icon"></i>
              </div>
            )}
          </div>
          <div className="college-info-header">
            <div className="college-name-row">
              <h1 className="college-profile-name">{college.collegeName}</h1>
              <i className="fa-solid fa-circle-check verified-badge"></i>
            </div>
            <div className="college-details-row">
              <div className="detail-item">
                <i className="fa-solid fa-map-marker-alt detail-icon"></i>
                <span className="detail-text">{college.collegeAddress}</span>
              </div>
              <div className="detail-item">
                <i className="fa-solid fa-building-columns detail-icon"></i>
                <span className="detail-text">{college.universityName || 'Affiliated University'}</span>
              </div>
              {college.establishedYear && (
                <div className="detail-item">
                  <i className="fa-solid fa-calendar detail-icon"></i>
                  <span className="detail-text">Established {college.establishedYear}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Layout Section */}
      <div className="college-details-wrapper">
        <div className="container-fluid">
          <div className="row g-4">
            {/* Left Sidebar Navigation */}
            <div className="col-md-2 d-none d-md-block">
              <nav className="college-sidebar-nav sticky-top">
                <ul className="college-nav-list">
                  <li className="college-nav-item">
                    <a 
                      href="#admission" 
                      className={`college-nav-link ${activeSection === 'admission' ? 'active' : ''}`}
                      onClick={(e) => scrollToSection(e, 'admission')}
                    >
                      <i className="fa-solid fa-graduation-cap"></i> Admission
                    </a>
                  </li>
                  <li className="college-nav-item">
                    <a 
                      href="#about" 
                      className={`college-nav-link ${activeSection === 'about' ? 'active' : ''}`}
                      onClick={(e) => scrollToSection(e, 'about')}
                    >
                      <i className="fa-solid fa-circle-info"></i> About
                    </a>
                  </li>
                  <li className="college-nav-item">
                    <a 
                      href="#programs" 
                      className={`college-nav-link ${activeSection === 'programs' ? 'active' : ''}`}
                      onClick={(e) => scrollToSection(e, 'programs')}
                    >
                      <i className="fa-solid fa-book"></i> Programs 
                      {courses && courses.length > 0 && (
                        <span className="nav-badge">{courses.length}</span>
                      )}
                    </a>
                  </li>
                  <li className="college-nav-item">
                    <a 
                      href="#features" 
                      className={`college-nav-link ${activeSection === 'features' ? 'active' : ''}`}
                      onClick={(e) => scrollToSection(e, 'features')}
                    >
                      <i className="fa-solid fa-star"></i> Features
                    </a>
                  </li>
                  <li className="college-nav-item">
                    <a 
                      href="#guidelines" 
                      className={`college-nav-link ${activeSection === 'guidelines' ? 'active' : ''}`}
                      onClick={(e) => scrollToSection(e, 'guidelines')}
                    >
                      <i className="fa-solid fa-file-alt"></i> Guidelines
                    </a>
                  </li>
                  <li className="college-nav-item">
                    <a 
                      href="#scholarship" 
                      className={`college-nav-link ${activeSection === 'scholarship' ? 'active' : ''}`}
                      onClick={(e) => scrollToSection(e, 'scholarship')}
                    >
                      <i className="fa-solid fa-money-bill"></i> Scholarship
                    </a>
                  </li>
                  <li className="college-nav-item">
                    <a 
                      href="#gallery" 
                      className={`college-nav-link ${activeSection === 'gallery' ? 'active' : ''}`}
                      onClick={(e) => scrollToSection(e, 'gallery')}
                    >
                      <i className="fa-solid fa-images"></i> Gallery
                    </a>
                  </li>
                  <li className="college-nav-item">
                    <a 
                      href="#chairman" 
                      className={`college-nav-link ${activeSection === 'chairman' ? 'active' : ''}`}
                      onClick={(e) => scrollToSection(e, 'chairman')}
                    >
                      <i className="fa-solid fa-user-tie"></i> Chairman
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Main Content */}
            <div className="col-md-7">
              <div className="college-main-content">
                {/* Admission Notice Bar */}
                {college.admissionNotice && (
                  <div className="college-admission-notice" id="admission">
                    <div className="college-admission-text-section">
                      <span className="college-admission-text">{college.admissionNotice}</span>
                    </div>
                    <div className="college-admission-action-row">
                      <Link to="/contact" className="college-btn-apply">Apply Now</Link>
                      {college.admissionCloseDate && (
                        <span className="college-admission-deadline">
                          <i className="fa-solid fa-clock"></i>
                          Closes: {formatDate(college.admissionCloseDate)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* About Section */}
                {college.overview && (
                  <div className="college-section" id="about">
                    <div className="college-section-header">
                      <h2 className="college-section-title">About</h2>
                    </div>
                    <div className="college-overview-content" dangerouslySetInnerHTML={{ __html: college.overview }} />
                  </div>
                )}

                {/* Offered Programs Section */}
                {courses && courses.length > 0 && (
                  <div className="college-section" id="programs">
                    <div className="college-section-header">
                      <h2 className="college-section-title">Offered Programs</h2>
                    </div>
                    <div className="college-courses-grid">
                      {courses.map(course => (
                        <Link key={course._id} to={`/course/${course._id}`} className="college-course-card">
                          <div className="college-course-card-content">
                            <h3 className="college-course-title">{course.fullForm || course.title}</h3>
                            <div className="college-course-detail">
                              <i className="fa-solid fa-building-columns"></i>
                              <span>{course.universityName || 'University Affiliation'}</span>
                            </div>
                            <div className="college-course-detail">
                              <i className="fa-solid fa-clock"></i>
                              <span>{course.duration || 'Duration'}</span>
                            </div>
                          </div>
                          <div className="college-course-card-footer">
                            <div className="college-course-action">
                              <span>Learn More</span>
                              <i className="fa-solid fa-arrow-right"></i>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Salient Features Section */}
                <div className="college-section" id="features">
                  <div className="college-section-header">
                    <h2 className="college-section-title">Salient Features</h2>
                  </div>
                  <div style={{color: '#555', lineHeight: 1.8, fontSize: '15px'}}>
                    {college.keyFeatures && college.keyFeatures.length > 0 ? (
                      <ul style={{paddingLeft: '20px'}}>
                        {college.keyFeatures.map((feature, index) => (
                          <li key={index} style={{marginBottom: '12px'}}>
                            <i className="fa-solid fa-check" style={{color: '#ff9800', marginRight: '8px'}}></i>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Information about salient features will be updated soon.</p>
                    )}
                  </div>
                </div>

                {/* Admission Guidelines Section */}
                {college.admissionGuidelines && (
                  <div className="college-section" id="guidelines">
                    <div className="college-section-header">
                      <h2 className="college-section-title">Admission Guidelines</h2>
                    </div>
                    <div className="college-overview-content" dangerouslySetInnerHTML={{ __html: college.admissionGuidelines }} />
                  </div>
                )}

                {/* Scholarship Information Section */}
                {college.scholarshipInfo && (
                  <div className="college-section" id="scholarship">
                    <div className="college-section-header">
                      <h2 className="college-section-title">Scholarship Information</h2>
                    </div>
                    <div className="college-overview-content" dangerouslySetInnerHTML={{ __html: college.scholarshipInfo }} />
                  </div>
                )}

                {/* Gallery Section */}
                {college.gallery && college.gallery.length > 0 && (
                  <div className="college-section" id="gallery">
                    <div className="college-section-header">
                      <h2 className="college-section-title">Gallery</h2>
                    </div>
                    <div className="college-gallery-grid">
                      {college.gallery.map((image, index) => (
                        <div key={index} className="college-gallery-item">
                          <img src={getImageUrl(image, 'colleges')} alt="College Gallery" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Contact Info */}
            <div className="col-md-3">
              {/* Contact Info Card */}
              <div className="college-contact-sidebar">
                <h3 className="college-contact-title">Contact Info</h3>
                
                {college.universityName && (
                  <div className="college-contact-item">
                    <div className="college-contact-icon">
                      <i className="fa-solid fa-building-columns"></i>
                    </div>
                    <div className="college-contact-content">
                      <div className="college-contact-label">University</div>
                      <div className="college-contact-value">{college.universityName}</div>
                    </div>
                  </div>
                )}

                {college.collegeAddress && (
                  <div className="college-contact-item">
                    <div className="college-contact-icon">
                      <i className="fa-solid fa-map-marker-alt"></i>
                    </div>
                    <div className="college-contact-content">
                      <div className="college-contact-label">Address</div>
                      <div className="college-contact-value">{college.collegeAddress}</div>
                    </div>
                  </div>
                )}

                {college.collegePhone && (
                  <div className="college-contact-item">
                    <div className="college-contact-icon">
                      <i className="fa-solid fa-phone"></i>
                    </div>
                    <div className="college-contact-content">
                      <div className="college-contact-label">Phone</div>
                      <div className="college-contact-value">
                        <a href={`tel:${college.collegePhone}`}>{college.collegePhone}</a>
                      </div>
                    </div>
                  </div>
                )}

                {college.collegeEmail && (
                  <div className="college-contact-item">
                    <div className="college-contact-icon">
                      <i className="fa-solid fa-envelope"></i>
                    </div>
                    <div className="college-contact-content">
                      <div className="college-contact-label">Email</div>
                      <div className="college-contact-value">
                        <a href={`mailto:${college.collegeEmail}`}>{college.collegeEmail}</a>
                      </div>
                    </div>
                  </div>
                )}

                {college.website && (
                  <div className="college-contact-item">
                    <div className="college-contact-icon">
                      <i className="fa-solid fa-globe"></i>
                    </div>
                    <div className="college-contact-content">
                      <div className="college-contact-label">Website</div>
                      <div className="college-contact-value">
                        <a href={college.website} target="_blank" rel="noopener noreferrer">{college.website}</a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chairman Preview Card */}
              {(college.chairmanName || college.chairmanMessage || college.chairmanImage) && (
                <div className="college-chairman-preview" id="chairman">
                  <div className="college-chairman-preview-title">Chairman</div>
                  {college.chairmanImage && (
                    <div className="college-chairman-image-container">
                      <img 
                        src={getImageUrl(college.chairmanImage, 'colleges')} 
                        alt={college.chairmanName} 
                        className="college-chairman-image" 
                        loading="lazy" 
                      />
                    </div>
                  )}
                  {college.chairmanName && (
                    <div className="college-chairman-preview-name">{college.chairmanName}</div>
                  )}
                  {college.chairmanMessage && (
                    <div className="college-chairman-preview-message" dangerouslySetInnerHTML={{ __html: college.chairmanMessage }} />
                  )}
                </div>
              )}

              {/* Location Map */}
              {college.googleMapUrl && (
                <div className="college-location-map" style={{marginTop: '20px'}}>
                  <iframe 
                    src={college.googleMapUrl} 
                    allowFullScreen="" 
                    loading="lazy"
                    title="College Location"
                  ></iframe>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeDetail;
