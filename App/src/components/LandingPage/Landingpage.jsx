import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPageResponsive.css';
import { Search, Building2, MapPin, GraduationCap, BookOpen, X, Loader2 } from 'lucide-react';
import { collegeAPI, universityAPI, courseAPI } from '../../api/services';
import { getImageFieldUrl } from '../../utils/imageHelper';

const Counter = ({ end, duration = 2000 }) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const increment = end / (duration / 10);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 10);

    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{count}</span>;
};

const normalizeAdHref = (href = '') => {
  if (typeof href !== 'string') {
    return null;
  }

  const trimmedHref = href.trim();
  if (!trimmedHref) {
    return null;
  }

  if (
    trimmedHref.startsWith('/') ||
    trimmedHref.startsWith('#') ||
    trimmedHref.startsWith('?')
  ) {
    return trimmedHref;
  }

  if (/^(?:https?:)?\/\//i.test(trimmedHref) || /^(mailto|tel):/i.test(trimmedHref)) {
    return trimmedHref;
  }

  return `https://${trimmedHref.replace(/^\/+/, '')}`;
};

const isExternalAdHref = (href = '') =>
  /^(?:https?:)?\/\//i.test(href) || /^(mailto|tel):/i.test(href);

const LandingPage = ({ landingAds = [] }) => {
  const [location, setLocation] = useState('All Locations');
  const [showDropdown, setShowDropdown] = useState(false);

  const locations = ['All Locations','Kathmandu', 'Lalitpur', 'Bhaktapur'];

  // Category state
  const [category, setCategory] = useState('College');
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [failedAdKeys, setFailedAdKeys] = useState({});

  const getCategoryIcon = () => {
    switch (category) {
      case 'College':
        return <Building2 size={18} className="icon" />;
      case 'University':
        return <GraduationCap size={18} className="icon" />;
      case 'Course':
        return <BookOpen size={18} className="icon" />;
      default:
        return <Building2 size={18} className="icon" />;
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchError('Please enter a search term');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setSearchPerformed(true);
    setSearchResults([]);

    const locationParam = location === 'All Locations' ? '' : location;

    try {
      let response;
      switch (category) {
        case 'College':
          response = await collegeAPI.getAllColleges(1, searchTerm, locationParam);
          break;
        case 'University':
          response = await universityAPI.getAllUniversities(1, searchTerm, locationParam);
          break;
        case 'Course':
          response = await courseAPI.getAllCourses();
          // Client-side filter for courses
          if (response.data.success) {
            const allCourses = response.data.data.courses || [];
            const term = searchTerm.toLowerCase();
            const filtered = allCourses.filter(course =>
              (course.title || '').toLowerCase().includes(term) ||
              (course.fullForm || '').toLowerCase().includes(term) ||
              (course.universityName || '').toLowerCase().includes(term)
            );
            setSearchResults(filtered);
            setSearchLoading(false);
            return;
          }
          break;
      }

      if (response?.data?.success) {
        const dataKey = category === 'College' ? 'colleges' : 'universities';
        setSearchResults(response.data.data[dataKey] || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search. Please try again.');
    }

    setSearchLoading(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSearchPerformed(false);
    setSearchError('');
  };

  // Logo Array (Yo list lai update garna sajilo huncha)
  const logos = [
    "/CollegeImage/Techspire.jpg", "/CollegeImage/lbef.jpg", "/CollegeImage/pcps.jpg",
    "/CollegeImage/maharshi.jpg", "/CollegeImage/iims.jpg", "/CollegeImage/kathfoard.jpg",
    "/CollegeImage/kcc.jpg", "/CollegeImage/nagarjuna.jpg", "/CollegeImage/samriddhi.jpg",
    "/CollegeImage/texas.jpg", "/CollegeImage/sagarmatha.jpg", "/CollegeImage/shikshyalaya.jpg",
  ];

  const resolvedLandingAds = landingAds
    .map((ad, index) => {
      const imageUrl = getImageFieldUrl(ad, 'adImage', 'landing');
      if (!imageUrl) {
        return null;
      }

      const parsedPosition = Number(ad.position);

      return {
        ...ad,
        href: normalizeAdHref(ad.adLink),
        imageUrl,
        key: ad._id || `landing-ad-${parsedPosition || index + 1}`,
        position:
          Number.isFinite(parsedPosition) && parsedPosition > 0
            ? parsedPosition
            : Number.MAX_SAFE_INTEGER,
        title: ad.title?.trim() || 'Sajha Entrance advertisement',
      };
    })
    .filter(Boolean)
    .sort((firstAd, secondAd) => {
      if (firstAd.position !== secondAd.position) {
        return firstAd.position - secondAd.position;
      }

      return new Date(firstAd.createdAt || 0) - new Date(secondAd.createdAt || 0);
    });

  const visibleLandingAds = resolvedLandingAds.filter((ad) => !failedAdKeys[ad.key]);

  const handleAdImageError = (adKey) => {
    setFailedAdKeys((current) => {
      if (current[adKey]) {
        return current;
      }

      return {
        ...current,
        [adKey]: true,
      };
    });
  };

  return (
    <div className="landing-container container-fluid px-lg-5">
      <main className={`main-content ${visibleLandingAds.length ? 'main-content--with-ads' : 'main-content--full'}`}>
        {/* Left Section */}
        <div className="hero-left">
          <div className="hero-text">
            <h2 className="sub-heading">WELCOME TO SAJHA ENTRANCE</h2>
            <h1 className="main-title">Pathway to Educational Excellence</h1>
            <p className="description">Explore Diverse Academic Opportunities: Colleges, Courses, and Examinations</p>
          </div>

          <div className="search-card">
            <div className="search-row">
                              {/* नयाँ Category Dropdown */}
                <div className="category-wrapper" style={{ position: 'relative' }}>
                  <div className="category-selector" onClick={() => setShowCatDropdown(!showCatDropdown)}>
                   {getCategoryIcon()}
                    <span className="category-text">{category}</span>
                  </div>
                  
                  {showCatDropdown && (
                    <ul className="custom-dropdown">
                      {['College', 'University', 'Course'].map((cat) => (
                        <li key={cat} onClick={() => { setCategory(cat); setShowCatDropdown(false); }}>
                          {cat}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              
              <input 
                type="text" 
                placeholder={`Search ${category.toLowerCase()}s...`}
                className="main-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              
              <div className="location-wrapper">
                <div className="location-selector" onClick={() => setShowDropdown(!showDropdown)}>
                  <MapPin size={18} className="icon" />
                  <span className="location-text"> {location}</span>
                </div>
                {showDropdown && (
                  <ul className="location-dropdown custom-dropdown">
                    {locations.map((loc) => (
                      <li key={loc} onClick={() => { setLocation(loc); setShowDropdown(false); }}>
                        {loc}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button className="search-btn-small" onClick={handleSearch} disabled={searchLoading}>
                {searchLoading ? (
                  <Loader2 size={18} className="icon spin" />
                ) : (
                  <Search size={18} className="icon" />
                )}
                <span className="search-btn-text d-none d-md-inline">{searchLoading ? 'Searching...' : 'Search'}</span>
              </button>
            </div>
            
            <div className="stats-bar">
                <div className="stat">
                  <h3><Counter end={500} />+</h3>
                  <p>Colleges</p>
                </div>
                <div className="stat">
                  <h3><Counter end={1000} />+</h3>
                  <p>Programs</p>
                </div>
                <div className="stat">
                  <h3><Counter end={50} />k+</h3>
                  <p>Students Helped</p>
                </div>
            </div>

            {/* Search Results Section */}
            {searchPerformed && (
              <div className="search-results-section">
                <div className="search-results-header">
                  <h4>
                    {searchLoading ? 'Searching...' : 
                    searchError ? 'Error' : 
                    `${searchResults.length} ${category}${searchResults.length !== 1 ? 's' : ''} found`}
                  </h4>
                  <button className="clear-search-btn" onClick={clearSearch}>
                    <X size={16} />
                    <span>Clear</span>
                  </button>
                </div>

                {searchError && (
                  <div className="search-error">
                    <p>{searchError}</p>
                  </div>
                )}

                {!searchLoading && !searchError && searchResults.length > 0 && (
                  <div className="search-results-grid">
                    {category === 'College' && searchResults.map((college) => (
                      <Link 
                        key={college._id} 
                        to={`/college/${college._id}`}
                        className="search-result-card"
                        onClick={clearSearch}
                      >
                        <div className="result-card-image">
                          {college.collegeLogo ? (
                            <img src={getImageFieldUrl(college, 'collegeLogo', 'colleges')} alt={college.collegeName} />
                          ) : (
                            <div className="result-card-placeholder">
                              <Building2 size={24} />
                            </div>
                          )}
                        </div>
                        <div className="result-card-content">
                          <h5>{college.collegeName}</h5>
                          <p className="result-location">
                            <MapPin size={12} /> {college.collegeAddress || 'Nepal'}
                          </p>
                          <span className="result-university">{college.universityName || 'Affiliated College'}</span>
                        </div>
                      </Link>
                    ))}

                    {category === 'University' && searchResults.map((university) => (
                      <Link 
                        key={university._id} 
                        to={`/university/${university._id}`}
                        className="search-result-card"
                        onClick={clearSearch}
                      >
                        <div className="result-card-image">
                          {university.universityLogo ? (
                            <img src={getImageFieldUrl(university, 'universityLogo', 'universities')} alt={university.universityName} />
                          ) : (
                            <div className="result-card-placeholder">
                              <GraduationCap size={24} />
                            </div>
                          )}
                        </div>
                        <div className="result-card-content">
                          <h5>{university.universityName}</h5>
                          <p className="result-location">
                            <MapPin size={12} /> {university.universityAddress || 'Nepal'}
                          </p>
                        </div>
                      </Link>
                    ))}

                    {category === 'Course' && searchResults.map((course) => (
                      <Link 
                        key={course._id} 
                        to={`/course/${course._id}`}
                        className="search-result-card"
                        onClick={clearSearch}
                      >
                        <div className="result-card-image course-image">
                          <div className="result-card-placeholder course-placeholder">
                            <BookOpen size={24} />
                          </div>
                        </div>
                        <div className="result-card-content">
                          <h5>{course.title}</h5>
                          {course.fullForm && <p className="result-fullform">{course.fullForm}</p>}
                          <span className="result-university">{course.universityName || ''}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {!searchLoading && !searchError && searchResults.length === 0 && (
                  <div className="search-no-results">
                    <p>No {category.toLowerCase()}s found for "{searchTerm}"</p>
                    <small>Try a different search term or browse all {category.toLowerCase()}s</small>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Ads */}
        {visibleLandingAds.length > 0 && (
          <aside className="ads-column" aria-label="Landing page advertisements">
            <div className="ads-column__inner">
              {visibleLandingAds.map((ad) => (
                <div className="ad-box" key={ad.key}>
                  {ad.href && ad.href.startsWith('/') ? (
                    <Link to={ad.href} className="ad-box__link">
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        loading="lazy"
                        onError={() => handleAdImageError(ad.key)}
                      />
                    </Link>
                  ) : ad.href ? (
                    <a
                      href={ad.href}
                      target={isExternalAdHref(ad.href) ? '_blank' : undefined}
                      rel={isExternalAdHref(ad.href) ? 'noopener noreferrer' : undefined}
                      className="ad-box__link"
                    >
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        loading="lazy"
                        onError={() => handleAdImageError(ad.key)}
                      />
                    </a>
                  ) : (
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      loading="lazy"
                      onError={() => handleAdImageError(ad.key)}
                    />
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}
      </main>

      {/* Marquee Footer (Updated for Seamless Loop) */}
      <div className="partner-marquee container-fluid px-0 ">
        <h1 className="partner-title" style={{fontWeight: 900, color: 'var(--primary-orange)'}}> TOP COLLEGES <span style={{color: 'var(--primary-black)'}}>IN NEPAL</span></h1>
        <div className="marquee-wrapper">
          <div className="marquee-content">
            {/* Pahilo Set */}
            {logos.map((src, index) => (
              <img key={`orig-${index}`} src={src} alt={`Partner ${index}`} />
            ))}
            {/* Dosro Set (Copy) - Yesle loop lai non-stop banaucha */}
            {logos.map((src, index) => (
              <img key={`copy-${index}`} src={src} alt={`Partner Copy ${index}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
