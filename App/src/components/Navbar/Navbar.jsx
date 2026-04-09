import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ notice, studentData, isAuthenticated, cartCount = 0 }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);

    const navbarContent = document.getElementById('navbarContent');
    if (navbarContent) {
      navbarContent.classList.remove('show');
    }
  }, [location.pathname]);
  
  const getParentGroup = () => {
    const path = location.pathname;
    if (path === '/') return 'Home';
    if (path.includes('/mocktest')) return 'MockTest';
    if (path.includes('/university')) return 'University';
    if (path.includes('/college')) return 'College';
    if (path.includes('/course')) return 'Course';
    if (path.includes('/about')) return 'About';
    if (path.includes('/blog')) return 'Blogs';
    if (path.includes('/service')) return 'Services';
    if (path.includes('/book') || path.includes('/cart')) return 'Books';
    if (path.includes('/result')) return 'Results';
    if (path.includes('/contact')) return 'Contact';
    return '';
  };

  const parentGroup = getParentGroup();
  const moreLinks = [
    { to: '/about', label: 'ABOUT', group: 'About' },
    { to: '/blogs', label: 'BLOGS', group: 'Blogs' },
    { to: '/services', label: 'SERVICES', group: 'Services' },
    { to: '/results', label: 'RESULTS', group: 'Results' },
    {to: '/universities', label: 'UNIVERSITIES', group: 'University' },
    { to: '/contact', label: 'CONTACT', group: 'Contact' },
  ];

  const handleMobileNavClose = () => {
    setIsMenuOpen(false);

    const navbarContent = document.getElementById('navbarContent');
    if (navbarContent) {
      navbarContent.classList.remove('show');
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg fixed-top" id="navbar" style={{backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', padding: '19px 0', zIndex: 1030}}>
        <div className="container-fluid">
          <div className="navbar-mobile-layout d-lg-none">
            <div className="navbar-mobile-start">
              <button 
                className="navbar-toggler mobile-nav-toggle" 
                type="button" 
                data-bs-toggle="collapse" 
                data-bs-target="#navbarContent" 
                aria-controls="navbarContent" 
                aria-expanded={isMenuOpen} 
                aria-label="Toggle navigation"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
              >
                {isMenuOpen ? (
                  <i className="fa-solid fa-xmark" style={{ fontSize: '20px' }}></i>
                ) : (
                  <i className="fa-solid fa-bars" style={{ fontSize: '18px' }}></i>
                )}
              </button>

              <Link to="/" className="navbar-mobile-brand text-decoration-none">
                <img src="/img/adminlogo.png" className="navbar-logo navbar-logo--mobile" alt="Sajha Entrance" />
              </Link>
            </div>

            <div className="navbar-mobile-actions">
              <Link to="/cart" className="navbar-mobile-quick-link navbar-mobile-quick-link--cart text-decoration-none">
                <span className="navbar-mobile-quick-link__icon">
                  <i className="fa-solid fa-cart-shopping"></i>
                  {cartCount > 0 && (
                    <span className="navbar-mobile-cart-count">{cartCount}</span>
                  )}
                </span>
                <span className="navbar-mobile-quick-link__label">Cart</span>
              </Link>

              {isAuthenticated && studentData ? (
                <Link
                  to="/student/profile"
                  className="navbar-mobile-quick-link navbar-mobile-quick-link--primary navbar-mobile-quick-link--profile text-decoration-none"
                  aria-label="Profile"
                  title="Profile"
                >
                  <i className="fa-solid fa-user"></i>
                </Link>
              ) : (
                <Link
                  to="/student/login"
                  className="navbar-mobile-quick-link navbar-mobile-quick-link--primary navbar-mobile-quick-link--login text-decoration-none"
                >
                  <i className="fa-solid fa-right-to-bracket"></i>
                  <span className="navbar-mobile-quick-link__label">Login</span>
                </Link>
              )}
            </div>
          </div>

          <Link to="/" className="d-none d-lg-flex align-items-center text-decoration-none">
            <img src="/img/adminlogo.png" className="navbar-logo" alt="Sajha Entrance" style={{height: '80px', width: '140px'}} />
          </Link>
          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link to="/" className="nav-link" onClick={handleMobileNavClose} style={{color: parentGroup === 'Home' ? '#ff6b35' : '#333', fontWeight: parentGroup === 'Home' ? 700 : 600, fontSize: '14px', padding: '8px 12px', transition: 'color 0.2s ease'}}>HOME</Link>
              </li>
              <li className="nav-item">
                <Link to="/colleges" className="nav-link" onClick={handleMobileNavClose} style={{color: parentGroup === 'College' ? '#ff6b35' : '#333', fontWeight: parentGroup === 'College' ? 700 : 600, fontSize: '14px', padding: '8px 12px', transition: 'color 0.2s ease'}}>COLLEGES</Link>
              </li>
              <li className="nav-item">
                <Link to="/mocktests" className="nav-link" onClick={handleMobileNavClose} style={{color: parentGroup === 'MockTest' ? '#ff6b35' : '#333', fontWeight: parentGroup === 'MockTest' ? 700 : 600, fontSize: '14px', padding: '8px 12px', transition: 'color 0.2s ease'}}>MOCK TEST</Link>
              </li>
              <li className="nav-item">
                <Link to="/courses" className="nav-link" onClick={handleMobileNavClose} style={{color: parentGroup === 'Course' ? '#ff6b35' : '#333', fontWeight: parentGroup === 'Course' ? 700 : 600, fontSize: '14px', padding: '8px 12px', transition: 'color 0.2s ease'}}>COURSES</Link>
              </li>
              <li className='nav-item'>
                <Link to="/books" className="nav-link" onClick={handleMobileNavClose} style={{color: parentGroup === 'BOOKS' ? '#ff6b35' : '#333', fontWeight: parentGroup === 'BOOKS' ? 700 : 600, fontSize: '14px', padding: '8px 12px', transition: 'color 0.2s ease'}}>BOOKS</Link>
              </li>
              <li className="nav-item dropdown d-none d-lg-block">
                <button className="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" style={{background: 'none', border: 'none', cursor: 'pointer', color: '#333', fontWeight: 600, fontSize: '14px', padding: '8px 12px', transition: 'color 0.2s ease'}}>
                  MORE
                </button>
                <ul className="dropdown-menu">
                  {moreLinks.map((link) => (
                    <li key={link.to}>
                      <Link
                        className="dropdown-item"
                        to={link.to}
                        onClick={handleMobileNavClose}
                        style={parentGroup === link.group ? {color: '#ff6b35', fontWeight: 600} : {color: '#333'}}
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
                    className="nav-link"
                    onClick={handleMobileNavClose}
                    style={{color: parentGroup === link.group ? '#ff6b35' : '#333', fontWeight: parentGroup === link.group ? 700 : 600, fontSize: '14px', padding: '8px 12px', transition: 'color 0.2s ease'}}
                  >
                    {link.label}
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
              <Link to="/cart" className="btn btn-link text-decoration-none position-relative" style={{color: '#333', fontSize: '18px', padding: '4px 8px'}}>
                <i className="fa-solid fa-cart-shopping"></i>
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize: '9px'}}>
                    {cartCount}
                  </span>
                )}
              </Link>
              {isAuthenticated && studentData ? (
                <Link
                  to="/student/profile"
                  className="navbar-profile-icon-link text-decoration-none"
                  aria-label="Profile"
                  title="Profile"
                >
                  <i className="fa-solid fa-user"></i>
                </Link>
              ) : (
                <>
                  <Link to="/student/login" className="btn" style={{border: '1.5px solid #ff6b35', color: '#ff6b35', backgroundColor: 'transparent', fontWeight: 600, fontSize: '13px', padding: '6px 16px', borderRadius: '5px', textDecoration: 'none', transition: 'all 0.2s ease'}}>
                    Login
                  </Link>
                  <Link to="/student/register" className="btn btn-register" style={{backgroundColor: '#ff6b35', color: '#fff', fontWeight: 600, fontSize: '13px', padding: '6px 16px', borderRadius: '5px', border: 'none', textDecoration: 'none', transition: 'all 0.2s ease'}}>
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <div className="notice-bar" style={{backgroundColor: '#ff6b35', color: '#fff', padding: '8px 0', position: 'fixed', top: '76px', left: 0, right: 0, zIndex: 1029}}>
        <div className="container d-flex align-items-center justify-content-center">
          <span className="badge" style={{backgroundColor: '#333', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '4px 10px', marginRight: '12px', borderRadius: '4px'}}>NOTICE</span>
          <div className="notice-text" style={{fontSize: '14px', fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>
            {notice?.url ? (
              <a href={notice.url} style={{color: '#fff', textDecoration: 'none'}}>
                {notice.title || 'Hello this is Sajha Entrance'}
              </a>
            ) : (
              <span>{notice?.title || 'Hello this is Sajha Entrance'}</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
