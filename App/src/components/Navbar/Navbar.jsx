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
      <nav className="navbar navbar-expand-lg fixed-top navbar-shadow" id="navbar">
        <div className="container align-items-center justify-content-center">
          <Link to="/">
            <img src="/img/logo-main.png" className="navbar-logo" alt="Sajha Entrance" />
          </Link>
          <div className="collapse navbar-collapse ms-5">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link to="/" className={parentGroup === 'Home' ? 'nav-link active' : 'nav-link'}>HOME</Link>
              </li>
              <li className="nav-item">
                <Link to="/colleges" className={parentGroup === 'College' ? 'nav-link active' : 'nav-link'}>COLLEGES</Link>
              </li>
              <li className="nav-item">
                <Link to="/courses" className={parentGroup === 'Course' ? 'nav-link active' : 'nav-link'}>COURSES</Link>
              </li>
              <li className="nav-item">
                <Link to="/books" className={parentGroup === 'Books' ? 'nav-link active' : 'nav-link'}>BOOKS</Link>
              </li>
              <li className="nav-item dropdown">
                <button className="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                  MORE
                </button>
                <ul className="dropdown-menu" aria-labelledby="moreDropdown">
                  <li><Link className="dropdown-item" to="/about" style={parentGroup === 'About' ? {color: 'var(--primary-orange)', fontWeight: 600} : {}}>ABOUT</Link></li>
                  <li><Link className="dropdown-item" to="/blogs" style={parentGroup === 'Blogs' ? {color: 'var(--primary-orange)', fontWeight: 600} : {}}>BLOGS</Link></li>
                  <li><Link className="dropdown-item" to="/services" style={parentGroup === 'Services' ? {color: 'var(--primary-orange)', fontWeight: 600} : {}}>SERVICES</Link></li>
                  <li><Link className="dropdown-item" to="/results" style={parentGroup === 'Results' ? {color: 'var(--primary-orange)', fontWeight: 600} : {}}>RESULTS</Link></li>
                </ul>
              </li>
            </ul>
            <div className="d-flex align-items-center">
              <Link to="/cart" className="btn btn-link text-decoration-none position-relative me-3" style={{color: '#333', fontSize: '20px'}}>
                <i className="fa-solid fa-cart-shopping"></i>
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize: '10px'}}>
                    {cartCount}
                  </span>
                )}
              </Link>
              {isAuthenticated && studentData ? (
                <>
                  {/* <Link to="/student/profile" className="btn-primary me-2" style={{textDecoration:'none'}}>
                    <i className="fa-solid fa-chalkboard-user me-2"></i>DASHBOARD
                  </Link> */}
                  <div className="dropdown profile-dropdown">
                    <button className="btn btn-link text-decoration-none profile-btn" type="button" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                      <i className="fa-solid fa-user-circle me-2"></i>
                      <span className="d-none d-md-inline">{studentData.name}</span>
                      <i className="fa-solid fa-chevron-down ms-2" style={{fontSize: '12px'}}></i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end profile-dropdown-menu" aria-labelledby="profileDropdown">
                      <li><h6 className="dropdown-header">{studentData.name}</h6></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><span className="dropdown-item-text"><strong>Student ID:</strong> {studentData.studentId}</span></li>
                      <li><span className="dropdown-item-text"><strong>Course:</strong> {studentData.course}</span></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><Link className="dropdown-item" to="/student/profile"><i className="fa-solid fa-user me-2"></i>My Profile</Link></li>
                      <li><Link className="dropdown-item" to="/student/profile"><i className="fa-solid fa-sign-out-alt me-2"></i>Dashboard</Link></li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/student/login" className="btn-primary me-2" style={{textDecoration:'none'}}>
                    <i className="fa-solid fa-right-to-bracket me-2"></i>LOGIN
                  </Link>
                  <Link to="/student/register" className="btn-primary" style={{textDecoration:'none', background:'#333'}}>
                    <i className="fa-solid fa-user-plus me-2"></i>REGISTER
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* <div className="notice text-center p-2">
        <div className="container d-flex align-items-center justify-content-center">
          <span className="badge bg-dark me-2">NOTICE</span>
          <div className="notice-text text-truncate">
            {notice?.url ? (
              <a className="notice-link" href={notice.url}>
                {notice.title || 'Hello this is Sajha Entrance'}
              </a>
            ) : (
              <span>{notice?.title || 'Hello this is Sajha Entrance'}</span>
            )}
          </div>
        </div>
      </div> */}
      
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
