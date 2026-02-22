import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collegeAPI, courseAPI } from '../../api/services';
import { getImageUrl } from '../../utils/imageHelper';
import Loader from '../../components/Loader/Loader';

const Colleges = () => {
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [previousPage, setPreviousPage] = useState(0);
  const [nextPage, setNextPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [noResult, setNoResult] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentPage, locationFilter]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      setLoading(true);
      const [collegesRes, coursesRes] = await Promise.all([
        collegeAPI.getAllColleges(currentPage, searchTerm, locationFilter),
        courseAPI.getAllCourses()
      ]);
      
      if (collegesRes.data.success) {
        setColleges(collegesRes.data.data.colleges || []);
        setPreviousPage(collegesRes.data.data.previousPage || 0);
        setNextPage(collegesRes.data.data.nextPage || 0);
        setNoResult(collegesRes.data.data.noResult || false);
      }
      
      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data.courses || []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  const handleLocationChange = (location) => {
    setLocationFilter(location);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setCurrentPage(1);
  };

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  return (
    <div className="colleges">
      <div className="container">
        <div className="row" style={{paddingTop: '4.5rem'}}>
          {/* Left Sidebar */}
          <div className="col-12 col-lg-4">
            <div>
              <h3 className="text-uppercase mb-0 text-center" style={{fontWeight: 900, color: 'var(--primary-orange)'}}>
                Search for <span style={{color: 'var(--primary-black)'}}>a college</span>
              </h3>
            </div>
            <div className="d-flex justify-content-center">
              <form onSubmit={handleSearch} className="d-flex flex-column">
                <div>
                  <input
                    name="collegeName"
                    placeholder="SEARCH FOR A COLLEGE"
                    className="searchInput"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button type="submit" className="searchButton">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </button>
                </div>

                {/* Active Filters Display */}
                {(searchTerm || locationFilter) && (
                  <div className="active-filters mt-3 mb-3">
                    <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
                      {searchTerm && (
                        <span className="filter-tag">
                          <i className="fa-solid fa-search"></i> "{searchTerm}"
                        </span>
                      )}
                      {locationFilter && (
                        <span className="filter-tag">
                          <i className="fa-solid fa-map-marker-alt"></i> {locationFilter.charAt(0).toUpperCase() + locationFilter.slice(1)}
                        </span>
                      )}
                      <button type="button" onClick={clearFilters} className="btn-remove-filter">
                        <i className="fa-solid fa-times"></i> Clear All
                      </button>
                    </div>
                  </div>
                )}

                <h3 className="text-uppercase mb-0 mt-3" style={{fontWeight: 900, color: 'var(--primary-orange)', fontSize: '16px'}}>
                  Location <span style={{color: 'var(--primary-black)'}}>Filter</span>
                </h3>
                <div className="locationFilter mt-3">
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
              </form>
            </div>

            {/* Courses Sidebar - Desktop Only */}
            <div className="row d-none d-lg-block">
              <h3 className="text-uppercase mb-4 mt-5 text-center" style={{fontWeight: 900, color: 'var(--primary-orange)'}}>
                SOME OF THE <span style={{color: 'var(--primary-black)'}}>COURSES</span>
              </h3>
              {courses.slice(0, 3).map((course) => (
                <div key={course._id} className="col-12">
                  <Link to={`/course/${course._id}`} className="course-card-link">
                    <div className="course-card-modern">
                      <div className="course-card-content">
                        <div className="course-title-section">
                          <h3 className="course-title">{course.fullForm || course.title}</h3>
                        </div>
                        <div className="course-university-section">
                          <i className="fa-solid fa-building-columns university-icon"></i>
                          <span className="university-name">{course.universityName || 'University Affiliation'}</span>
                        </div>
                        <div className="course-duration-section">
                          <i className="fa-solid fa-clock duration-icon"></i>
                          <span className="duration-text">{course.duration || 'Duration'}</span>
                        </div>
                      </div>
                      <div className="course-card-footer">
                        <div className="course-action">
                          <span className="action-text">Learn More</span>
                          <i className="fa-solid fa-arrow-right action-arrow"></i>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
              <div className="text-center mt-4">
                <Link to="/courses" className="btn-primary">
                  <i className="fa-solid fa-plus me-2"></i>More Courses
                </Link>
              </div>
            </div>
          </div>

          {/* Right Content - Colleges Grid */}
          <div className="col-12 col-lg-8">
            <div className="px-2 px-lg-0">
              <div className="row d-flex justify-content-center">
                <h3 className="text-uppercase mb-4 text-center mt-5 mt-lg-4" style={{fontWeight: 900, color: 'var(--primary-orange)'}}>
                  Partnered <span style={{color: 'var(--primary-black)'}}>Colleges</span>
                </h3>
                
                {noResult && (
                  <h3 className="text-uppercase mb-0 mt-3 text-center" style={{fontWeight: 900, color: 'var(--primary-orange)', fontSize: '16px'}}>
                    No Result <span style={{color: 'var(--primary-black)'}}>Found</span>
                  </h3>
                )}

                <div className="row g-4 mt-3">
                  {colleges.map((college) => (
                    <div key={college._id} className="col-6 col-lg-4">
                      <Link to={`/college/${college._id}`} className="college-card-link">
                        <div className="college-card-modern">
                          {/* College Banner */}
                          <div className="college-banner">
                            {college.collegeLogo ? (
                              <img
                                src={getImageUrl(college.collegeLogo, 'colleges')}
                                alt="college-banner"
                                className="college-banner-image"
                              />
                            ) : (
                              <div className="college-banner-placeholder">
                                <i className="fa-solid fa-building-columns college-banner-placeholder-icon"></i>
                              </div>
                            )}
                          </div>

                          {/* College Content */}
                          <div className="college-content">
                            <div className="college-name-section">
                              <h3 className="college-name">{college.collegeName}</h3>
                              <i className="fa-solid fa-circle-check verified-icon"></i>
                            </div>

                            <div className="college-university-section">
                              <i className="fa-solid fa-building-columns university-icon"></i>
                              <span className="university-name">
                                {college.universityName || 'University Affiliation'}
                              </span>
                            </div>

                            <div className="college-location-section">
                              <i className="fa-solid fa-location-dot location-icon"></i>
                              <span className="location-text">{college.collegeAddress}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              <div className="d-flex justify-content-between mt-4 mx-2">
                <div>
                  {previousPage !== 0 && (
                    <button
                      className="pageButton d-flex align-items-center justify-content-center"
                      onClick={() => setCurrentPage(previousPage)}
                    >
                      <i className="fa-solid fa-angle-left"></i>
                    </button>
                  )}
                </div>
                <div>
                  {nextPage !== 0 && (
                    <button
                      className="pageButton d-flex align-items-center justify-content-center"
                      onClick={() => setCurrentPage(nextPage)}
                    >
                      <i className="fa-solid fa-angle-right"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Colleges;
