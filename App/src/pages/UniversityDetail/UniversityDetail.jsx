import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { universityAPI } from '../../api/services';
import { getImageFieldUrl, getImageList } from '../../utils/imageHelper';
import Loader from '../../components/Loader/Loader';
import InquiryButton from '../../components/InquiryForm/InquiryButton';

const UniversityDetail = () => {
  const { id } = useParams();
  const [universityData, setUniversityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('admission');

  useEffect(() => {
    fetchUniversityDetail();
  }, [id]); // eslint-disable-next-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.university-section');
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

  const fetchUniversityDetail = async () => {
    try {
      const response = await universityAPI.getUniversityById(id);
      if (response.data.success) {
        setUniversityData(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching university details:', error);
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

  if (!universityData || !universityData.universityData) {
    return <div className="container mt-5 pt-5 text-center">University not found</div>;
  }

  const { universityData: university, courses, colleges } = universityData;
  const coverImageUrl = getImageFieldUrl(university, 'universityCover', 'universities');
  const logoImageUrl = getImageFieldUrl(university, 'universityLogo', 'universities');
  const chancellorImageUrl = getImageFieldUrl(university, 'chancellorImage', 'universities');
  const galleryImages = getImageList(university, 'gallery', 'universities');

  return (
    <div className="college-profile">
      <div className="container-fluid pt-3 ps-4 position-absolute" style={{ zIndex: 10, top: '120px' }}>
        <Link to="/universities" className="cd-breadcrumb-link" style={{ background: 'rgba(0,0,0,0.5)', padding: '8px 15px', borderRadius: '20px', backdropFilter: 'blur(5px)' }}>
          <i className="fa-solid fa-arrow-left me-2"></i>All Universities
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
                alt={`${university.universityName} logo`}
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
              <h1 className="college-profile-name">{university.universityName}</h1>
              <i className="fa-solid fa-circle-check verified-badge"></i>
            </div>
            <div className="college-details-row">
              <div className="detail-item">
                <i className="fa-solid fa-map-marker-alt detail-icon"></i>
                <span className="detail-text">{university.universityAddress}</span>
              </div>
              {university.type && (
                <div className="detail-item">
                  <i className="fa-solid fa-tag detail-icon"></i>
                  <span className="detail-text">{university.type} University</span>
                </div>
              )}
              {university.establishedYear && (
                <div className="detail-item">
                  <i className="fa-solid fa-calendar detail-icon"></i>
                  <span className="detail-text">Established {university.establishedYear}</span>
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
                      href="#colleges" 
                      className={`college-nav-link ${activeSection === 'colleges' ? 'active' : ''}`}
                      onClick={(e) => scrollToSection(e, 'colleges')}
                    >
                      <i className="fa-solid fa-school"></i> Colleges
                      {colleges && colleges.length > 0 && (
                        <span className="nav-badge">{colleges.length}</span>
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
                      href="#chancellor" 
                      className={`college-nav-link ${activeSection === 'chancellor' ? 'active' : ''}`}
                      onClick={(e) => scrollToSection(e, 'chancellor')}
                    >
                      <i className="fa-solid fa-user-tie"></i> Chancellor
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Main Content */}
            <div className="col-md-7">
              <div className="college-main-content">
                {/* Admission Notice Bar */}
                {university.admissionNotice && (
                  <div className="college-admission-notice university-section" id="admission">
                    <div className="college-admission-text-section">
                      <span className="college-admission-text">{university.admissionNotice}</span>
                    </div>
                    <div className="college-admission-action-row">
                      <Link to="/contact" className="college-btn-apply">Apply Now</Link>
                      {university.admissionCloseDate && (
                        <span className="college-admission-deadline">
                          <i className="fa-solid fa-clock"></i>
                          Closes: {formatDate(university.admissionCloseDate)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* About Section */}
                {university.overview && (
                  <div className="college-section university-section" id="about">
                    <div className="college-section-header">
                      <h2 className="college-section-title">About</h2>
                    </div>
                    <div className="college-overview-content" dangerouslySetInnerHTML={{ __html: university.overview }} />
                  </div>
                )}

                {/* Offered Programs Section */}
                {courses && courses.length > 0 && (
                  <div className="college-section university-section" id="programs">
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

                {/* Affiliated Colleges Section */}
                {colleges && colleges.length > 0 && (
                  <div className="college-section university-section" id="colleges">
                    <div className="college-section-header">
                      <h2 className="college-section-title">Affiliated Colleges</h2>
                    </div>
                    <div className="row g-3">
                      {colleges.map(college => (
                        <div key={college._id} className="col-12 col-sm-6">
                          <Link to={`/college/${college._id}`} style={{ textDecoration: 'none' }}>
                            <div style={{
                              background: '#fff',
                              borderRadius: '12px',
                              padding: '16px',
                              border: '1px solid #eee',
                              transition: 'all 0.3s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '14px',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                              e.currentTarget.style.borderColor = '#ff6b35';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.borderColor = '#eee';
                            }}
                            >
                              <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '10px',
                                background: '#f8f9fa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                overflow: 'hidden',
                              }}>
                                {college.collegeLogo ? (
                                  <img
                                    src={getImageFieldUrl(college, 'collegeLogo', 'colleges')}
                                    alt={college.collegeName}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <i className="fa-solid fa-school" style={{ color: '#aaa', fontSize: '20px' }}></i>
                                )}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>
                                  {college.collegeName}
                                </div>
                                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                                  <i className="fa-solid fa-location-dot" style={{ marginRight: '4px' }}></i>
                                  {college.collegeAddress || 'Location N/A'}
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Salient Features Section */}
                <div className="college-section university-section" id="features">
                  <div className="college-section-header">
                    <h2 className="college-section-title">Salient Features</h2>
                  </div>
                  <div style={{color: '#555', lineHeight: 1.8, fontSize: '15px'}}>
                    {university.keyFeatures && university.keyFeatures.length > 0 ? (
                      <ul style={{paddingLeft: '20px'}}>
                        {university.keyFeatures.map((feature, index) => (
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
                {university.admissionGuidelines && (
                  <div className="college-section university-section" id="guidelines">
                    <div className="college-section-header">
                      <h2 className="college-section-title">Admission Guidelines</h2>
                    </div>
                    <div className="college-overview-content" dangerouslySetInnerHTML={{ __html: university.admissionGuidelines }} />
                  </div>
                )}

                {/* Scholarship Information Section */}
                {university.scholarshipInfo && (
                  <div className="college-section university-section" id="scholarship">
                    <div className="college-section-header">
                      <h2 className="college-section-title">Scholarship Information</h2>
                    </div>
                    <div className="college-overview-content" dangerouslySetInnerHTML={{ __html: university.scholarshipInfo }} />
                  </div>
                )}

                {/* Gallery Section */}
                {galleryImages.length > 0 && (
                  <div className="college-section university-section" id="gallery">
                    <div className="college-section-header">
                      <h2 className="college-section-title">Gallery</h2>
                    </div>
                    <div className="college-gallery-grid">
                      {galleryImages.map((image, index) => (
                        <div key={index} className="college-gallery-item">
                          <img src={image} alt="University Gallery" loading="lazy" />
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
                
                {university.type && (
                  <div className="college-contact-item">
                    <div className="college-contact-icon">
                      <i className="fa-solid fa-tag"></i>
                    </div>
                    <div className="college-contact-content">
                      <div className="college-contact-label">Type</div>
                      <div className="college-contact-value">{university.type} University</div>
                    </div>
                  </div>
                )}

                {university.universityAddress && (
                  <div className="college-contact-item">
                    <div className="college-contact-icon">
                      <i className="fa-solid fa-map-marker-alt"></i>
                    </div>
                    <div className="college-contact-content">
                      <div className="college-contact-label">Address</div>
                      <div className="college-contact-value">{university.universityAddress}</div>
                    </div>
                  </div>
                )}

                {university.universityPhone && (
                  <div className="college-contact-item">
                    <div className="college-contact-icon">
                      <i className="fa-solid fa-phone"></i>
                    </div>
                    <div className="college-contact-content">
                      <div className="college-contact-label">Phone</div>
                      <div className="college-contact-value">
                        <a href={`tel:${university.universityPhone}`}>{university.universityPhone}</a>
                      </div>
                    </div>
                  </div>
                )}

                {university.universityEmail && (
                  <div className="college-contact-item">
                    <div className="college-contact-icon">
                      <i className="fa-solid fa-envelope"></i>
                    </div>
                    <div className="college-contact-content">
                      <div className="college-contact-label">Email</div>
                      <div className="college-contact-value">
                        <a href={`mailto:${university.universityEmail}`}>{university.universityEmail}</a>
                      </div>
                    </div>
                  </div>
                )}

                {university.website && (
                  <div className="college-contact-item">
                    <div className="college-contact-icon">
                      <i className="fa-solid fa-globe"></i>
                    </div>
                    <div className="college-contact-content">
                      <div className="college-contact-label">Website</div>
                      <div className="college-contact-value">
                        <a href={university.website} target="_blank" rel="noopener noreferrer">{university.website}</a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chancellor Preview Card */}
              {(university.chancellorName || university.chancellorMessage || chancellorImageUrl) && (
                <div className="college-chairman-preview university-section" id="chancellor">
                  <div className="college-chairman-preview-title">Chancellor</div>
                  {chancellorImageUrl && (
                    <div className="college-chairman-image-container">
                      <img 
                        src={chancellorImageUrl} 
                        alt={university.chancellorName} 
                        className="college-chairman-image" 
                        loading="lazy" 
                      />
                    </div>
                  )}
                  {university.chancellorName && (
                    <div className="college-chairman-preview-name">{university.chancellorName}</div>
                  )}
                  {university.chancellorMessage && (
                    <div className="college-chairman-preview-message" dangerouslySetInnerHTML={{ __html: university.chancellorMessage }} />
                  )}
                </div>
              )}

              {/* Location Map */}
              {university.googleMapUrl && (
                <div className="college-location-map" style={{marginTop: '20px'}}>
                  <iframe 
                    src={university.googleMapUrl} 
                    allowFullScreen="" 
                    loading="lazy"
                    title="University Location"
                  ></iframe>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Inquiry Button */}
        <InquiryButton 
          collegeName={university.universityName} 
          universityId={university._id}
          position="bottom-right" 
          courses={courses || []} 
        />
      </div>
    </div>
  );
};

export default UniversityDetail;
