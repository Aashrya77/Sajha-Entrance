import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookMarked,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  Edit3,
  FileText,
  GraduationCap,
  Home,
  Info,
  Landmark,
  LogIn,
  Menu,
  Newspaper,
  PhoneCall,
  Trophy,
  UserPlus,
  X,
} from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';

const Navbar = ({ notice, studentData, isAuthenticated, onLogout }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef(null);
  const studentDisplayName = String(studentData?.name || '').trim() || 'Profile';

  useEffect(() => {
    setIsMenuOpen(false);
    setIsMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setIsMenuOpen(false);
      }

      if (window.innerWidth < 992) {
        setIsMoreOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isMoreOpen) {
      return undefined;
    }

    const handleDocumentClick = (event) => {
      if (!moreMenuRef.current?.contains(event.target)) {
        setIsMoreOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMoreOpen]);
  
  const getParentGroup = () => {
    const path = location.pathname;
    if (path === '/') return 'Home';
    if (path.includes('/mocktest')) return 'MockTest';
    if (path.includes('/past-questions')) return 'PastQuestions';
    if (path.includes('/university')) return 'University';
    if (path.includes('/college')) return 'College';
    if (path.includes('/course')) return 'Course';
    if (path.includes('/about')) return 'About';
    if (path.includes('/blog')) return 'Blogs';
    if (path.includes('/service')) return 'Services';
    if (path.includes('/book') || path.includes('/cart')) return 'Books';
    if (path.includes('/result')) return 'Results';
    if (path.includes('/contact')) return 'Contact';
    if (path.includes('/admission')) return 'Admission';
    if (path.includes('/news')) return 'News';
    if (path.includes('/event')) return 'Event';
    if (path.includes('/scholarship')) return 'Scholarship';
    return '';
  };

  const parentGroup = getParentGroup();
  const isStudentDashboard = location.pathname === '/student/profile'
    || location.pathname.startsWith('/student/profile/');
  const hideNoticeBar = location.pathname.startsWith('/mocktest/');
  const primaryLinks = [
    { to: '/', label: 'HOME', group: 'Home', icon: Home },
    
    { to: '/mocktests', label: 'MOCK TEST', group: 'MockTest', icon: ClipboardList },
    { to: '/past-questions', label: 'PAST QUESTIONS', group: 'PastQuestions', icon: FileText },
    { to: '/results', label: 'RESULTS', group: 'Results', icon: Trophy },
    { to: '/colleges', label: 'COLLEGES', group: 'College', icon: Building2 },
    { to: '/courses', label: 'COURSES', group: 'Course', icon: BookOpen },
  ];
  const moreLinks = [
    { to: '/admission', label: 'ADMISSION', group: 'Admission', icon: UserPlus },
    { to: '/news', label: 'NEWS', group: 'News', icon: Newspaper },
    { to: '/events', label: 'EVENTS', group: 'Event', icon: CalendarDays },
    { to: '/scholarships', label: 'SCHOLARSHIPS', group: 'Scholarship', icon: GraduationCap },
    { to: '/about', label: 'ABOUT', group: 'About', icon: Info },
    { to: '/blogs', label: 'BLOGS', group: 'Blogs', icon: Edit3 },
    { to: '/services', label: 'SERVICES', group: 'Services', icon: Briefcase },
    { to: '/books', label: 'BOOKS', group: 'Books', icon: BookMarked },
    { to: '/universities', label: 'UNIVERSITIES', group: 'University', icon: Landmark },
    { to: '/contact', label: 'CONTACT', group: 'Contact', icon: PhoneCall },
  ];
  const isGroupActive = (group) => parentGroup === group;
  const isMoreActive = moreLinks.some((link) => link.group === parentGroup);
  const getPrimaryNavClass = (group) =>
    `nav-link navbar-nav-link${isGroupActive(group) ? ' navbar-nav-link--active' : ''}`;
  const moreButtonClass = `nav-link dropdown-toggle navbar-more-button${
    isMoreActive ? ' navbar-more-button--active' : ''
  }`;
  const getDropdownItemClass = (group) =>
    `dropdown-item navbar-dropdown-item${
      isGroupActive(group) ? ' navbar-dropdown-item--active' : ''
    }`;
  const getPrimaryNavStyle = (group) => ({
    color: isGroupActive(group) ? '#ff6b35' : '#333',
    fontWeight: isGroupActive(group) ? 700 : 600,
    fontSize: '14px',
    padding: '8px 12px',
    transition: 'color 0.2s ease',
  });
  const moreButtonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: isMoreActive ? '#ff6b35' : '#333',
    fontWeight: isMoreActive ? 700 : 600,
    fontSize: '14px',
    padding: '8px 12px',
    transition: 'color 0.2s ease',
  };
  const getDropdownItemStyle = (group) => ({
    color: isGroupActive(group) ? '#ff6b35' : '#333',
    fontWeight: isGroupActive(group) ? 700 : 500,
  });

  const handleMobileNavClose = () => {
    setIsMenuOpen(false);
  };

  const handleMoreToggle = () => {
    setIsMoreOpen((prev) => !prev);
  };

  const handleMoreClose = () => {
    setIsMoreOpen(false);
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg fixed-top" id="navbar" style={{backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', padding: '19px 0', zIndex: isMenuOpen ? 1300 : 1030}}>
        <div className="container-fluid">
          <div className="navbar-mobile-layout d-lg-none">
            <div className="navbar-mobile-start">
              <button 
                className="navbar-toggler mobile-nav-toggle" 
                type="button" 
                aria-controls="navbarContent" 
                aria-expanded={isMenuOpen} 
                aria-label="Toggle navigation"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
              >
                {isMenuOpen ? (
                  <X size={20} strokeWidth={2.2} aria-hidden="true" />
                ) : (
                  <Menu size={20} strokeWidth={2.2} aria-hidden="true" />
                )}
              </button>

              <Link to="/" className="navbar-mobile-brand text-decoration-none">
                <img src="/img/adminlogo.png" className="navbar-logo navbar-logo--mobile" alt="Sajha Entrance" />
              </Link>
            </div>

            <div className="navbar-mobile-actions">
              {/* Cart hidden while book purchases are handled through WhatsApp inquiries. */}

              {isAuthenticated && studentData ? (
                <ProfileDropdown
                  username={studentDisplayName}
                  onLogout={onLogout}
                  variant="mobile"
                  isDashboardActive={isStudentDashboard}
                />
              ) : (
                <Link
                  to="/student/login"
                  className="navbar-mobile-quick-link navbar-mobile-quick-link--primary navbar-mobile-quick-link--login text-decoration-none"
                >
                  <LogIn size={18} strokeWidth={2.2} aria-hidden="true" />
                  <span className="navbar-mobile-quick-link__label">Login</span>
                </Link>
              )}
            </div>
          </div>

          <Link to="/" className="d-none d-lg-flex align-items-center text-decoration-none">
            <img src="/img/adminlogo.png" className="navbar-logo" alt="Sajha Entrance" style={{height: '80px', width: '140px'}} />
          </Link>
          <div
            className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}
            id="navbarContent"
          >
            <div className="mobile-nav-drawer-header d-lg-none">
              <Link to="/" className="mobile-nav-drawer-brand text-decoration-none" onClick={handleMobileNavClose}>
                <img src="/img/adminlogo.png" className="mobile-nav-drawer-logo" alt="Sajha Entrance" />
              </Link>
              <button
                type="button"
                className="mobile-nav-drawer-close"
                aria-label="Close navigation menu"
                onClick={handleMobileNavClose}
              >
                <X size={20} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
              {primaryLinks.map((link) => (
                <li key={link.to} className="nav-item">
                  <Link
                    to={link.to}
                    className={getPrimaryNavClass(link.group)}
                    onClick={handleMobileNavClose}
                    aria-current={isGroupActive(link.group) ? 'page' : undefined}
                    style={getPrimaryNavStyle(link.group)}
                  >
                    <link.icon className="navbar-nav-link__icon" size={19} strokeWidth={2.1} aria-hidden="true" />
                    <span className="navbar-nav-link__text">{link.label}</span>
                  </Link>
                </li>
              ))}
              <li
                ref={moreMenuRef}
                className={`nav-item dropdown d-none d-lg-block${isMoreOpen ? ' show' : ''}`}
              >
                <button
                  type="button"
                  className={moreButtonClass}
                  aria-expanded={isMoreOpen}
                  onClick={handleMoreToggle}
                  style={moreButtonStyle}
                >
                  MORE
                </button>
                <ul className={`dropdown-menu navbar-more-menu${isMoreOpen ? ' show' : ''}`}>
                  {moreLinks.map((link) => (
                    <li key={link.to}>
                      <Link
                        className={getDropdownItemClass(link.group)}
                        to={link.to}
                        onClick={() => {
                          handleMobileNavClose();
                          handleMoreClose();
                        }}
                        aria-current={isGroupActive(link.group) ? 'page' : undefined}
                        style={getDropdownItemStyle(link.group)}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              {moreLinks.map((link) => (
                <li key={`mobile-${link.to}`} className="nav-item d-lg-none">
                  <Link
                    to={link.to}
                    className={getPrimaryNavClass(link.group)}
                    onClick={handleMobileNavClose}
                    aria-current={isGroupActive(link.group) ? 'page' : undefined}
                    style={getPrimaryNavStyle(link.group)}
                  >
                    <link.icon className="navbar-nav-link__icon" size={19} strokeWidth={2.1} aria-hidden="true" />
                    <span className="navbar-nav-link__text">{link.label}</span>
                  </Link>
                </li>
              ))}
              {!isAuthenticated && !studentData && (
                <li className="nav-item d-lg-none">
                  <div className="d-flex flex-column gap-2 p-2">
                    <Link to="/student/register" onClick={handleMobileNavClose} className="btn btn-primary btn-sm">REGISTER</Link>
                  </div>
                </li>
              )}
            </ul>
            <div className="d-flex align-items-center d-none d-lg-flex" style={{gap: '8px'}}>
              {/* Cart hidden while book purchases are handled through WhatsApp inquiries. */}
              {isAuthenticated && studentData ? (
                <ProfileDropdown
                  username={studentDisplayName}
                  onLogout={onLogout}
                  isDashboardActive={isStudentDashboard}
                />
              ) : (
                <>
                  <Link to="/student/login" className="btn" style={{border: '1.5px solid #ff6b35', color: '#ff6b35', backgroundColor: 'transparent', fontWeight: 600, fontSize: '13px', padding: '6px 16px', borderRadius: '5px', textDecoration: 'none', transition: 'all 0.2s ease'}}>
                    <LogIn size={15} strokeWidth={2.2} aria-hidden="true" style={{ marginRight: '6px', verticalAlign: '-2px' }} />
                    Login
                  </Link>
                  <Link to="/student/register" className="btn btn-register" style={{backgroundColor: '#ff6b35', color: '#fff', fontWeight: 600, fontSize: '13px', padding: '6px 16px', borderRadius: '5px', border: 'none', textDecoration: 'none', transition: 'all 0.2s ease'}}>
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>

          <div
            className={`mobile-nav-backdrop ${isMenuOpen ? 'is-visible' : ''}`}
            onClick={handleMobileNavClose}
            aria-hidden="true"
          />
        </div>
      </nav>
      
      {!hideNoticeBar && (
        <div className="notice-bar" style={{backgroundColor: '#ff6b35', color: '#fff', padding: '8px 0', position: 'fixed', top: '76px', left: 0, right: 0, zIndex: 1029}}>
          <div className="container d-flex align-items-center justify-content-center">
            <span className="notice-bar__badge">NOTICE</span>
            <div className="notice-text notice-bar__message" style={{fontSize: '14px', fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>
              {notice?.url ? (
                <a
                  href={notice.url}
                  className="notice-bar__message-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {notice.title || 'Hello this is Sajha Entrance'}
                </a>
              ) : (
                <span className="notice-bar__message-text">{notice?.title || 'Hello this is Sajha Entrance'}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
