import React, { useState } from 'react';
import './LandingPage.css';
import { Search, Building2, MapPin } from 'lucide-react';

const LandingPage = () => {
  const [location, setLocation] = useState('All Locations');
  const [showDropdown, setShowDropdown] = useState(false);

  const locations = ['Kathmandu', 'Lalitpur', 'Bhaktapur'];

  // Logo Array (Yo list lai update garna sajilo huncha)
  const logos = [
    "/CollegeImage/Techspire.jpg", "/CollegeImage/lbef.jpg", "/CollegeImage/pcps.jpg",
    "/CollegeImage/maharshi.jpg", "/CollegeImage/iims.jpg", "/CollegeImage/kathfoard.jpg",
    "/CollegeImage/kcc.jpg", "/CollegeImage/nagarjuna.jpg", "/CollegeImage/samriddhi.jpg",
    "/CollegeImage/texas.jpg", "/CollegeImage/sagarmatha.jpg", "/CollegeImage/shikshyalaya.jpg",
  ];

  return (
    <div className="landing-container">
      <main className="main-content">
        {/* Left Section */}
        <div className="hero-left">
          <div className="hero-text">
            <h4 className="sub-heading">WELCOME TO SAJHA ENTRANCE</h4>
            <h1 className="main-title">Pathway to Educational Excellence</h1>
            <p className="description">Explore Diverse Academic Opportunities: Colleges, Courses, and Examinations</p>
          </div>

          <div className="search-card">
            <div className="search-row">
              <select className="category-select">
                <Building2 size={20} className="icon" />
                <option>College</option>
                <option>University</option>
                <option>Course</option>
              </select>
              
              <input type="text" placeholder="Search colleges, courses..." className="main-search-input" />
              
              <div className="location-wrapper">
                <div className="location-selector" onClick={() => setShowDropdown(!showDropdown)}>
                  <MapPin size={18} className="icon" />
                  <span> {location}</span>
                </div>
                {showDropdown && (
                  <ul className="location-dropdown">
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
              <div className="stat"><h3>500+</h3><p>Colleges</p></div>
              <div className="stat"><h3>1000+</h3><p>Programs</p></div>
              <div className="stat"><h3>50k+</h3><p>Students Helped</p></div>
            </div>
          </div>
        </div>

        {/* Right Section: Ads */}
        <aside className="ads-column">
          <div className="ad-box"><img src="/RightAds/entrance1.gif" alt="Ad 1" /></div>
          <div className="ad-box"><img src="/RightAds/entrance2.jpg" alt="Ad 2" /></div>
          <div className="ad-box"><img src="/RightAds/entrance3.gif" alt="Ad 3" /></div>
          <div className="ad-box"><img src="/RightAds/entrance4.gif" alt="Ad 4" /></div>
        </aside>
      </main>

      {/* Marquee Footer (Updated for Seamless Loop) */}
      <div className="partner-marquee">
        <p className="partner-title"> <span style={{color: '#ff7422'}}>Top Colleges </span>in Nepal</p>
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