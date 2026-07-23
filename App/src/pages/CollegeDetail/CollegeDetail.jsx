import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  Clock,
  FileText,
  Globe,
  GraduationCap,
  Image,
  Info,
  Mail,
  MapPin,
  Phone,
  Star,
  User,
} from 'lucide-react';
import { collegeAPI } from '../../api/services';
import { getImageFieldUrl, getImageList } from '../../utils/imageHelper';
import { resolveGoogleMapEmbedUrl } from '../../utils/googleMaps';
import './CollegeDetail.css';
import Loader from '../../components/Loader/Loader';
import InquiryButton from '../../components/InquiryForm/InquiryButton';

const CollegeMetaItem = ({ icon: Icon, children }) => (
  <div className="college-profile-meta-item">
    <Icon size={18} aria-hidden="true" />
    <span>{children}</span>
  </div>
);

const CollegeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collegeData, setCollegeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('programs');

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
        const canonicalSlug = response.data.data?.collegeData?.slug;
        if (canonicalSlug && canonicalSlug !== id) {
          navigate(`/college/${canonicalSlug}`, { replace: true });
        }
      }
      setLoading(false);
    } catch (error) {
      // The page already renders its request failure state.
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
    courses && courses.length > 0 && {
      id: 'programs',
      icon: BookOpen,
      label: 'Programs',
      badge: courses.length,
    },
    college.overview && { id: 'about', icon: Info, label: 'About' },
    college.admissionNotice && { id: 'admission', icon: GraduationCap, label: 'Admission' },
    { id: 'features', icon: Star, label: 'Features' },
    college.admissionGuidelines && { id: 'guidelines', icon: FileText, label: 'Guidelines' },
    college.scholarshipInfo && { id: 'scholarship', icon: Banknote, label: 'Scholarship' },
    galleryImages.length > 0 && { id: 'gallery', icon: Image, label: 'Gallery' },
    hasChairmanSection && { id: 'chairman', icon: User, label: 'Chairman' },
  ].filter(Boolean);

  const heroStyle = coverImageUrl
    ? { '--college-profile-cover': `url("${coverImageUrl}")` }
    : undefined;

  return (
    <div className="college-profile college-detail-page">
      <header className="college-profile-hero" style={heroStyle}>
        <Link to="/colleges" className="college-profile-back-link">
          <ArrowLeft size={18} aria-hidden="true" />
          All Colleges
        </Link>
      </header>

      <section className="college-profile-summary" aria-label="College profile summary">
        <article className="college-profile-info-card">
          <div className="college-profile-logo-card" aria-hidden={!logoImageUrl}>
            {logoImageUrl ? (
              <img
                src={logoImageUrl}
                alt={`${college.collegeName} logo`}
                className="college-profile-logo-image"
              />
            ) : (
              <div className="college-profile-logo-placeholder">
                <Building2 size={52} aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="college-profile-info-body">
            <div className="college-profile-details">
              <h1 className="college-profile-name">{college.collegeName}</h1>

              <div className="college-profile-meta">
                {college.collegeAddress && (
                  <CollegeMetaItem icon={MapPin}>{college.collegeAddress}</CollegeMetaItem>
                )}
                {college.universityName && (
                  <CollegeMetaItem icon={Building2}>{college.universityName}</CollegeMetaItem>
                )}
                {college.establishedYear && (
                  <CollegeMetaItem icon={CalendarDays}>
                    Established {college.establishedYear}
                  </CollegeMetaItem>
                )}
              </div>
            </div>
          </div>
        </article>
      </section>

      {navSections.length > 0 && (
        <div className="college-mobile-nav d-lg-none">
          <div className="container-fluid">
            <div className="college-mobile-nav-scroll">
              {navSections.map((section) => {
                const SectionIcon = section.icon;
                return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`college-mobile-nav-link ${activeSection === section.id ? 'active' : ''}`}
                  onClick={(e) => scrollToSection(e, section.id)}
                >
                  <SectionIcon size={17} strokeWidth={2.1} aria-hidden="true" />
                  <span>{section.label}</span>
                  {section.badge ? <span className="nav-badge">{section.badge}</span> : null}
                </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3-Column Layout Section */}
      <div className="college-details-wrapper">
        <div className="container-fluid">
          <div className="college-detail-grid">
            {/* Left Sidebar Navigation */}
            <div className="college-detail-grid__nav d-none d-lg-block">
              <nav className="college-sidebar-nav sticky-top">
                <ul className="college-nav-list">
                  {navSections.map((section) => {
                    const SectionIcon = section.icon;
                    return (
                    <li key={section.id} className="college-nav-item">
                      <a 
                        href={`#${section.id}`}
                        className={`college-nav-link ${activeSection === section.id ? 'active' : ''}`}
                        onClick={(e) => scrollToSection(e, section.id)}
                      >
                        <SectionIcon size={17} strokeWidth={2.1} aria-hidden="true" /> {section.label}
                        {section.badge ? (
                          <span className="nav-badge">{section.badge}</span>
                        ) : null}
                      </a>
                    </li>
                    );
                  })}
                </ul>
              </nav>
            </div>

            {/* Main Content */}
            <div className="college-detail-grid__main">
              <div className="college-main-content">
                {/* Offered Programs Section */}
                {courses && courses.length > 0 && (
                  <div className="college-section" id="programs" data-nav-section>
                    <div className="college-section-header">
                      <h2 className="college-section-title">Offered Programs</h2>
                    </div>
                    <div className="college-courses-grid">
                      {courses.map(course => (
                        <Link key={course._id} to={`/course/${course.slug || course._id}`} className="college-course-card">
                          <div className="college-course-card-content">
                            <h3 className="college-course-title">{course.fullForm || course.title}</h3>
                            <div className="college-course-detail">
                              <Building2 size={16} aria-hidden="true" />
                              <span>{course.universityName || 'University Affiliation'}</span>
                            </div>
                            <div className="college-course-detail">
                              <Clock size={16} aria-hidden="true" />
                              <span>{course.duration || 'Duration'}</span>
                            </div>
                          </div>
                          <div className="college-course-card-footer">
                            <div className="college-course-action">
                              <span>Learn More</span>
                              <ArrowRight size={16} aria-hidden="true" />
                            </div>
                          </div>
                        </Link>
                      ))}
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
                          <Clock size={16} aria-hidden="true" />
                          Closes: {formatDate(college.admissionCloseDate)}
                        </span>
                      )}
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
                            <Check size={16} style={{color: '#ff9800', marginRight: '8px'}} aria-hidden="true" />
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
            <div className="college-detail-grid__aside">
              {/* Contact Info Card */}
              <div className="college-contact-sidebar">
                <h3 className="college-contact-title">Contact Info</h3>
                
                {college.universityName && (
                  <div className="college-contact-item">
                    <div className="college-contact-icon">
                      <Building2 size={18} aria-hidden="true" />
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
                      <MapPin size={18} aria-hidden="true" />
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
                      <Phone size={18} aria-hidden="true" />
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
                      <Mail size={18} aria-hidden="true" />
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
                      <Globe size={18} aria-hidden="true" />
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
              {resolveGoogleMapEmbedUrl(college.googleMapUrl) && (
                <div className="college-location-map" style={{marginTop: '20px'}}>
                  <iframe 
                    src={resolveGoogleMapEmbedUrl(college.googleMapUrl)}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
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
