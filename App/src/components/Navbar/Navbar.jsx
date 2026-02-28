import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ notice, studentData, isAuthenticated, cartCount = 0 }) => {
  const location = useLocation();
  
  const getParentGroup = () => {
    const path = location.pathname;
    if (path === '/') return 'Home';
    if (path.includes('/college')) return 'College';
    if (path.includes('/course')) return 'Course';
    if (path.includes('/about')) return 'About';
    if (path.includes('/blog')) return 'Blogs';
    if (path.includes('/service')) return 'Services';
    if (path.includes('/book') || path.includes('/cart')) return 'Books';
    if (path.includes('/result')) return 'Results';
    return '';
  };

  const parentGroup = getParentGroup();

  return (
    <>
      <nav className="navbar navbar-expand-lg fixed-top" id="navbar" style={{backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', padding: '19px 0', zIndex: 1030}}>
        <div className="container-fluid">
          <Link to="/" className="d-flex align-items-center text-decoration-none">
            <img src="/img/logo-main.png" className="navbar-logo" alt="Sajha Entrance" style={{height: '80px'}} />
            {/* <div style={{lineHeight: '1.2'}}>
              <div style={{fontSize: '11px', color: '#666', fontWeight: 500}}>सबैको विश्वास यहीं</div>
              <div style={{fontSize: '11px', color: '#666', fontWeight: 500}}>सबै <span style={{color: '#ff6b35', fontWeight: 700}}>ENTRANCE</span> !</div>
            </div> */}
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link to="/" className="nav-link" style={{color: parentGroup === 'Home' ? '#ff6b35' : '#333', fontWeight: parentGroup === 'Home' ? 700 : 600, fontSize: '14px', padding: '8px 12px', transition: 'color 0.2s ease'}}>HOME</Link>
              </li>
              <li className="nav-item">
                <Link to="/colleges" className="nav-link" style={{color: parentGroup === 'College' ? '#ff6b35' : '#333', fontWeight: parentGroup === 'College' ? 700 : 600, fontSize: '14px', padding: '8px 12px', transition: 'color 0.2s ease'}}>COLLEGES</Link>
              </li>
              <li className="nav-item">
                <Link to="/courses" className="nav-link" style={{color: parentGroup === 'Course' ? '#ff6b35' : '#333', fontWeight: parentGroup === 'Course' ? 700 : 600, fontSize: '14px', padding: '8px 12px', transition: 'color 0.2s ease'}}>COURSES</Link>
              </li>
              <li className="nav-item">
                <Link to="/books" className="nav-link" style={{color: parentGroup === 'Books' ? '#ff6b35' : '#333', fontWeight: parentGroup === 'Books' ? 700 : 600, fontSize: '14px', padding: '8px 12px', transition: 'color 0.2s ease'}}>BOOKS</Link>
              </li>
              <li className="nav-item dropdown">
                <button className="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" style={{background: 'none', border: 'none', cursor: 'pointer', color: '#333', fontWeight: 600, fontSize: '14px', padding: '8px 12px', transition: 'color 0.2s ease'}}>
                  MORE
                </button>
                <ul className="dropdown-menu">
                  <li><Link className="dropdown-item" to="/about" style={parentGroup === 'About' ? {color: '#ff6b35', fontWeight: 600} : {color: '#333'}}>ABOUT</Link></li>
                  <li><Link className="dropdown-item" to="/blogs" style={parentGroup === 'Blogs' ? {color: '#ff6b35', fontWeight: 600} : {color: '#333'}}>BLOGS</Link></li>
                  <li><Link className="dropdown-item" to="/services" style={parentGroup === 'Services' ? {color: '#ff6b35', fontWeight: 600} : {color: '#333'}}>SERVICES</Link></li>
                  <li><Link className="dropdown-item" to="/results" style={parentGroup === 'Results' ? {color: '#ff6b35', fontWeight: 600} : {color: '#333'}}>RESULTS</Link></li>
                </ul>
              </li>
            </ul>
            <div className="d-flex align-items-center" style={{gap: '8px'}}>
              <Link to="/cart" className="btn btn-link text-decoration-none position-relative" style={{color: '#333', fontSize: '18px', padding: '4px 8px'}}>
                <i className="fa-solid fa-cart-shopping"></i>
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize: '9px'}}>
                    {cartCount}
                  </span>
                )}
              </Link>
              {isAuthenticated && studentData ? (
                <>
                  <Link to="/student/profile" className="btn btn-link text-decoration-none" style={{color: '#555', fontSize: '13px', fontWeight: 500, padding: '4px 8px', transition: 'color 0.2s ease'}}>
                    For Students <i className="fa-solid fa-chevron-right" style={{fontSize: '10px', marginLeft: '4px'}}></i>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/student/login" className="btn" style={{border: '1.5px solid #ff6b35', color: '#ff6b35', backgroundColor: 'transparent', fontWeight: 600, fontSize: '13px', padding: '6px 16px', borderRadius: '5px', textDecoration: 'none', transition: 'all 0.2s ease'}}>
                    Login
                  </Link>
                  <Link to="/student/register" className="btn" style={{backgroundColor: '#ff6b35', color: '#fff', fontWeight: 600, fontSize: '13px', padding: '6px 16px', borderRadius: '5px', border: 'none', textDecoration: 'none', transition: 'all 0.2s ease'}}>
                    Register
                  </Link>
                  <Link to="/student/profile" className="btn btn-link text-decoration-none d-none d-lg-block" style={{color: '#555', fontSize: '13px', fontWeight: 500, padding: '4px 8px', transition: 'color 0.2s ease'}}>
                    For Students <i className="fa-solid fa-chevron-right" style={{fontSize: '10px', marginLeft: '4px'}}></i>
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
      
      <MobileNav />
    </>
  );
};

const MobileNav = () => {
  const location = useLocation();
  const pageName = location.pathname === '/' ? 'Home' : 
                   location.pathname.includes('college') ? 'Colleges' :
                   location.pathname.includes('service') ? 'Our Services' :
                   location.pathname.includes('blog') ? 'Blogs' :
                   location.pathname.includes('course') ? 'Courses' : '';

  return (
    <div className="d-flex d-lg-none d-block fixed-bottom btm-nav">
      <table className="container btm-nav-btn">
        <tbody>
          <tr>
            <td>
              <button 
                type="button" 
                onClick={() => window.location.href='/colleges'} 
                className={pageName === 'Colleges' ? 'active-btm-nav' : ''}
              >
                <i className="fa-solid fa-graduation-cap mb-1"></i>COLLEGES
              </button>
            </td>
            <td>
              <button 
                type="button" 
                onClick={() => window.location.href='/services'} 
                className={pageName === 'Our Services' ? 'active-btm-nav' : ''}
              >
                <i className="fa-solid fa-gear mb-1"></i>SERVICES
              </button>
            </td>
            <td className="center-btn-home-outer" style={{height: '78px !important', width: '78px !important'}}>
              <button className="center-btn-home-inner" type="button" onClick={() => window.location.href='/'}>
                <i className="fa-solid fa-house mb-1"></i>
              </button>
            </td>
            <td>
              <button 
                type="button" 
                onClick={() => window.location.href='/blogs'} 
                className={pageName === 'Blogs' ? 'active-btm-nav' : ''}
              >
                <i className="fa-solid fa-newspaper mb-1"></i>BLOGS
              </button>
            </td>
            <td>
              <button 
                type="button" 
                onClick={() => window.location.href='/courses'} 
                className={pageName === 'Courses' ? 'active-btm-nav' : ''}
              >
                <i className="fa-solid fa-book mb-1"></i>COURSES
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Navbar;
