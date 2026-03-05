import React, { useState } from 'react';
import './LandingPage.css';
import { Search, Building2, MapPin, GraduationCap, BookOpen } from 'lucide-react';

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

const LandingPage = ({ landingAds = [] }) => {
  const [location, setLocation] = useState('All Locations');
  const [showDropdown, setShowDropdown] = useState(false);

  const locations = ['All Locations','Kathmandu', 'Lalitpur', 'Bhaktapur'];

  // ... अरु state को तल यो थप्नुहोस्
  const [category, setCategory] = useState('College');
  const [showCatDropdown, setShowCatDropdown] = useState(false);


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

  // Logo Array (Yo list lai update garna sajilo huncha)
  const logos = [
    "/CollegeImage/Techspire.jpg", "/CollegeImage/lbef.jpg", "/CollegeImage/pcps.jpg",
    "/CollegeImage/maharshi.jpg", "/CollegeImage/iims.jpg", "/CollegeImage/kathfoard.jpg",
    "/CollegeImage/kcc.jpg", "/CollegeImage/nagarjuna.jpg", "/CollegeImage/samriddhi.jpg",
    "/CollegeImage/texas.jpg", "/CollegeImage/sagarmatha.jpg", "/CollegeImage/shikshyalaya.jpg",
  ];

  return (
    <div className="landing-container container-fluid px-lg-5">
      <main className="main-content">
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
                    <span>{category}</span>
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
              
              <input type="text" placeholder="Search colleges, courses..." className="main-search-input" />
              
              <div className="location-wrapper">
                <div className="location-selector" onClick={() => setShowDropdown(!showDropdown)}>
                  <MapPin size={18} className="icon" />
                  <span> {location}</span>
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

              <button className="search-btn-small">
                <Search size={18} className="icon" />
                <span>Search</span>
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
          </div>
        </div>

        {/* Right Section: Ads */}
        <aside className="ads-column">
          {landingAds.length > 0 ? (
            landingAds.map((ad, index) => (
              <div className="ad-box" key={ad._id || index}>
                {ad.adLink ? (
                  <a href={ad.adLink} target="_blank" rel="noopener noreferrer">
                    <img src={ad.adImage && (ad.adImage.startsWith('http') ? ad.adImage : `http://localhost:5000/landingads/${ad.adImage}`)} alt={ad.title || `Ad ${index + 1}`} />
                  </a>
                ) : (
                  <img src={ad.adImage && (ad.adImage.startsWith('http') ? ad.adImage : `http://localhost:5000/landingads/${ad.adImage}`)} alt={ad.title || `Ad ${index + 1}`} />
                )}
              </div>
            ))
          ) : (
            <>
              <div className="ad-box"><img src="/RightAds/entrance1.gif" alt="Ad 1" /></div>
              <div className="ad-box"><img src="/RightAds/entrance2.jpg" alt="Ad 2" /></div>
              <div className="ad-box"><img src="/RightAds/entrance3.gif" alt="Ad 3" /></div>
              <div className="ad-box"><img src="/RightAds/entrance4.gif" alt="Ad 4" /></div>
            </>
          )}
        </aside>
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