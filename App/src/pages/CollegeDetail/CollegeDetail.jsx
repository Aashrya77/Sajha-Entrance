import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collegeAPI } from '../../api/services';
import { getImageFieldUrl, getImageList } from '../../utils/imageHelper';
import './CollegeDetail.css';
import Loader from '../../components/Loader/Loader';
import InquiryButton from '../../components/InquiryForm/InquiryButton';

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
      const sections = document.querySelectorAll('[data-nav-section]');
      if (!sections.length) {
        return;
      }

      let currentSection = sections[0].getAttribute('id') || 'admission';
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        if (window.scrollY >= sectionTop) {
          currentSection = section.getAttribute('id');
        }
      });
      
      setActiveSection(currentSection);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [collegeData]);

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
  const galleryImages = getImageList(college, 'gallery', 'colleges');
  const coverImageUrl = getImageFieldUrl(college, 'collegeCover', 'colleges');
  const logoImageUrl = getImageFieldUrl(college, 'collegeLogo', 'colleges');
  const chairmanImageUrl = getImageFieldUrl(college, 'chairmanImage', 'colleges');
  const hasChairmanSection = Boolean(college.chairmanName || college.chairmanMessage || chairmanImageUrl);
  const navSections = [
    college.admissionNotice && { id: 'admission', icon: 'fa-graduation-cap', label: 'Admission' },
    college.overview && { id: 'about', icon: 'fa-circle-info', label: 'About' },
    courses && courses.length > 0 && {
      id: 'programs',
      icon: 'fa-book',
      label: 'Programs',
      badge: courses.length,
    },
    { id: 'features', icon: 'fa-star', label: 'Features' },
    college.admissionGuidelines && { id: 'guidelines', icon: 'fa-file-alt', label: 'Guidelines' },
    college.scholarshipInfo && { id: 'scholarship', icon: 'fa-money-bill', label: 'Scholarship' },
    galleryImages.length > 0 && { id: 'gallery', icon: 'fa-images', label: 'Gallery' },
    hasChairmanSection && { id: 'chairman', icon: 'fa-user-tie', label: 'Chairman' },
  ].filter(Boolean);

  return (
    <div className="college-profile college-detail-page">
      <div className="college-detail-breadcrumb">
        <Link to="/colleges" className="cd-breadcrumb-link college-detail-breadcrumb-link">
          <i className="fa-solid fa-arrow-left me-2"></i>All Colleges
        </Link>
      </div>
      {/* Cover Image Section */}
      <div 
        className="college-cover-section"
        style={coverImageUrl ? {
          backgroundImage: `url(${coverImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        <div className="college-cover-placeholder" style={coverImageUrl ? {background: 'rgba(0,0,0,0.3)'} : {}}>
          <div className="college-logo-circle">
            {logoImageUrl ? (
              <img
                src={logoImageUrl}
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

      {navSections.length > 0 && (
        <div className="college-mobile-nav d-lg-none">
          <div className="container-fluid">
            <div className="college-mobile-nav-scroll">
              {navSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`college-mobile-nav-link ${activeSection === section.id ? 'active' : ''}`}
                  onClick={(e) => scrollToSection(e, section.id)}
                >
                  <i className={`fa-solid ${section.icon}`}></i>
                  <span>{section.label}</span>
                  {section.badge ? <span className="nav-badge">{section.badge}</span> : null}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3-Column Layout Section */}
      <div className="college-details-wrapper">
        <div className="container-fluid">
          <div className="row g-4">
            {/* Left Sidebar Navigation */}
            <div className="col-lg-2 d-none d-lg-block">
              <nav className="college-sidebar-nav sticky-top">
                <ul className="college-nav-list">
                  {navSections.map((section) => (
                    <li key={section.id} className="college-nav-item">
                      <a 
                        href={`#${section.id}`}
                        className={`college-nav-link ${activeSection === section.id ? 'active' : ''}`}
                        onClick={(e) => scrollToSection(e, section.id)}
                      >
                        <i className={`fa-solid ${section.icon}`}></i> {section.label}
                        {section.badge ? (
                          <span className="nav-badge">{section.badge}</span>
                        ) : null}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Main Content */}
            <div className="col-12 col-lg-7">
              <div className="college-main-content">
                {/* Admission Notice Bar */}
                {college.admissionNotice && (
                  <div className="college-admission-notice" id="admission" data-nav-section>
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
                  <div className="college-section" id="about" data-nav-section>
                    <div className="college-section-header">
                      <h2 className="college-section-title">About</h2>
                    </div>
                    <div className="college-overview-content" dangerouslySetInnerHTML={{ __html: college.overview }} />
                  </div>
                )}

                {/* Offered Programs Section */}
                {courses && courses.length > 0 && (
                  <div className="college-section" id="programs" data-nav-section>
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
                <div className="college-section" id="features" data-nav-section>
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
                  <div className="college-section" id="guidelines" data-nav-section>
                    <div className="college-section-header">
                      <h2 className="college-section-title">Admission Guidelines</h2>
                    </div>
                    <div className="college-overview-content" dangerouslySetInnerHTML={{ __html: college.admissionGuidelines }} />
                  </div>
                )}

                {/* Scholarship Information Section */}
                {college.scholarshipInfo && (
                  <div className="college-section" id="scholarship" data-nav-section>
                    <div className="college-section-header">
                      <h2 className="college-section-title">Scholarship Information</h2>
                    </div>
                    <div className="college-overview-content" dangerouslySetInnerHTML={{ __html: college.scholarshipInfo }} />
                  </div>
                )}

                {/* Gallery Section */}
                {galleryImages.length > 0 && (
                  <div className="college-section" id="gallery" data-nav-section>
                    <div className="college-section-header">
                      <h2 className="college-section-title">Gallery</h2>
                    </div>
                    <div className="college-gallery-grid">
                      {galleryImages.map((image, index) => (
                        <div key={index} className="college-gallery-item">
                          <img src={image} alt="College Gallery" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Contact Info */}
            <div className="col-12 col-lg-3">
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
              {hasChairmanSection && (
                <div className="college-chairman-preview" id="chairman" data-nav-section>
                  <div className="college-chairman-preview-title">Chairman</div>
                  {chairmanImageUrl && (
                    <div className="college-chairman-image-container">
                      <img 
                        src={chairmanImageUrl} 
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

        {/* Floating Inquiry Button */}
        <InquiryButton 
          collegeName={college.collegeName} 
          collegeId={college._id}
          position="bottom-right" 
          courses={courses || []} 
        />
      </div>
    </div>
  );
};

export default CollegeDetail;
