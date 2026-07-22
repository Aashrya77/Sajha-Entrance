import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  BadgeCheck,
  Building2,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { collegeAPI } from '../../api/services';
import { getImageFieldUrl } from '../../utils/imageHelper';
import Loader from '../../components/Loader/Loader';
import PageAdvertisements from '../../components/PageAdvertisements/PageAdvertisements';

const Colleges = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [noResult, setNoResult] = useState(false);
  const [isLocationFilterOpen, setIsLocationFilterOpen] = useState(false);
  const filterPanelRef = useRef(null);

  useEffect(() => {
    fetchData({ page: 1, append: false });
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLocationFilterOpen) {
      return undefined;
    }

    const handleDocumentClick = (event) => {
      if (!filterPanelRef.current?.contains(event.target)) {
        setIsLocationFilterOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsLocationFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isLocationFilterOpen]);

  const fetchData = async ({
    page = 1,
    append = false,
    search = searchTerm,
    location = locationFilter,
  } = {}) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const collegesRes = await collegeAPI.getAllColleges(page, search, location);
      
      if (collegesRes.data.success) {
        const nextColleges = collegesRes.data.data.colleges || [];
        setColleges((current) => (append ? [...current, ...nextColleges] : nextColleges));
        setNextPage(collegesRes.data.data.nextPage || 0);
        setNoResult(collegesRes.data.data.noResult || false);
      }
      
      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      // The page already renders its request failure state.
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData({ page: 1, append: false });
  };

  const handleLocationChange = (location) => {
    setLocationFilter(location);
    setIsLocationFilterOpen(false);
    fetchData({ page: 1, append: false, location });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setIsLocationFilterOpen(false);
    fetchData({ page: 1, append: false, search: '', location: '' });
  };

  const handleLoadMore = () => {
    if (!nextPage || loadingMore) {
      return;
    }

    fetchData({ page: nextPage, append: true });
  };

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  return (
    <div className="colleges">
      <section className="colleges-hero" aria-labelledby="colleges-page-title">
        <div className="container">
          <div className="colleges-hero-content">
            <h1 id="colleges-page-title" className="colleges-hero-title">
              Find Your Perfect <span>College</span>
            </h1>
            <p className="colleges-hero-subtitle">
              Explore our partnered colleges and discover the right institution for your future.
            </p>

            <div className="colleges-search-panel-wrap">
              <form
                onSubmit={handleSearch}
                className="colleges-search-panel"
                ref={filterPanelRef}
                role="search"
                aria-label="Search partnered colleges"
              >
                <div className="colleges-search-field">
                  <Search className="colleges-search-icon" size={18} aria-hidden="true" />
                  <input
                    type="search"
                    name="collegeName"
                    placeholder="Search colleges, universities, or programs..."
                    className="searchInput"
                    aria-label="Search colleges, universities, or programs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    type="button"
                    className={`colleges-search-filter-icon ${isLocationFilterOpen ? 'is-open' : ''}`}
                    aria-label="Filter colleges by location"
                    aria-expanded={isLocationFilterOpen}
                    aria-controls="college-location-options"
                    onClick={() => setIsLocationFilterOpen((current) => !current)}
                  >
                    <SlidersHorizontal size={18} aria-hidden="true" />
                  </button>
                  <button type="submit" className="colleges-search-submit-sr">
                    Search colleges
                  </button>
                </div>

                <div
                  id="college-location-options"
                  className={`colleges-location-filter ${isLocationFilterOpen ? 'is-open' : ''}`}
                >
                  <div className="colleges-location-options">
                    <div className="locationFilter">
                      <input
                        type="radio"
                        id="all"
                        name="location"
                        checked={!locationFilter}
                        onChange={() => handleLocationChange('')}
                      />
                      <label htmlFor="all">All Locations</label>
                    </div>
                    <div className="locationFilter">
                      <input
                        type="radio"
                        id="lalitpur"
                        name="location"
                        checked={locationFilter === 'lalitpur'}
                        onChange={() => handleLocationChange('lalitpur')}
                      />
                      <label htmlFor="lalitpur">Lalitpur</label>
                    </div>
                    <div className="locationFilter">
                      <input
                        type="radio"
                        id="bhaktapur"
                        name="location"
                        checked={locationFilter === 'bhaktapur'}
                        onChange={() => handleLocationChange('bhaktapur')}
                      />
                      <label htmlFor="bhaktapur">Bhaktapur</label>
                    </div>
                    <div className="locationFilter">
                      <input
                        type="radio"
                        id="kathmandu"
                        name="location"
                        checked={locationFilter === 'kathmandu'}
                        onChange={() => handleLocationChange('kathmandu')}
                      />
                      <label htmlFor="kathmandu">Kathmandu</label>
                    </div>
                  </div>
                </div>

                {/* Active Filters Display */}
                {(searchTerm || locationFilter) && (
                  <div className="active-filters">
                    <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
                      {searchTerm && (
                        <span className="filter-tag">
                          <Search size={14} aria-hidden="true" /> "{searchTerm}"
                        </span>
                      )}
                      {locationFilter && (
                        <span className="filter-tag">
                          <MapPin size={14} aria-hidden="true" /> {locationFilter.charAt(0).toUpperCase() + locationFilter.slice(1)}
                        </span>
                      )}
                      <button type="button" onClick={clearFilters} className="btn-remove-filter">
                        <X size={14} aria-hidden="true" /> Clear All
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Right Content - Colleges Grid */}
      <section className="colleges-listing-section" aria-label="Partnered college listings">
        <div className="container-fluid">
          <div className="px-2 px-lg-0">
            <div className="row d-flex justify-content-center">
              {noResult && (
                <h3 className="text-uppercase mb-0 mt-3 text-center" style={{fontWeight: 900, color: 'var(--primary-orange)', fontSize: '16px'}}>
                  No Result <span style={{color: 'var(--primary-black)'}}>Found</span>
                </h3>
              )}

              <div className="row g-4 mt-4" >
                {colleges.map((college) => (
                  <div key={college._id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                    <Link to={`/college/${college._id}`} className="college-card-link">
                      <div className="college-card-modern">
                        {/* College Banner */}
                        <div className="college-banner">
                          {college.collegeLogo ? (
                            <img
                              src={getImageFieldUrl(college, 'collegeLogo', 'colleges')}
                              alt="college-banner"
                              className="college-banner-image"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="college-banner-placeholder">
                              <Building2 className="college-banner-placeholder-icon" aria-hidden="true" />
                            </div>
                          )}
                        </div>

                        {/* College Content */}
                        <div className="college-content">
                          <div className="college-name-section">
                            <h3 className="college-name">{college.collegeName}</h3>
                            <BadgeCheck className="verified-icon" size={17} aria-hidden="true" />
                          </div>

                          <div className="college-university-section">
                            <Building2 className="university-icon" size={16} aria-hidden="true" />
                            <span className="university-name">
                              {college.universityName || 'University Affiliation'}
                            </span>
                          </div>

                          <div className="college-location-section">
                            <MapPin className="location-icon" size={16} aria-hidden="true" />
                            <span className="college-location-text">{college.collegeAddress}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {nextPage !== 0 && (
              <div className="college-load-more-wrap">
                <button
                  type="button"
                  className="college-load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="spin" size={17} aria-hidden="true" />
                      Loading...
                    </>
                  ) : (
                    <>
                      More Colleges
                      <ArrowDown size={17} aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container">
        <PageAdvertisements page="colleges" />
      </div>

    </div>
  );
};

export default Colleges;
