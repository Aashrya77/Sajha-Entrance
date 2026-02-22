import React from 'react';

const Services = () => {
  return (
    <div className="services-page mt-5 pt-5">
      <div className="container">
        <h1 className="text-uppercase mb-4 text-center" style={{fontWeight: 900, color: 'var(--primary-orange)'}}>
          OUR <span style={{color: 'var(--primary-black)'}}>SERVICES</span>
        </h1>
        
        <div className="row mt-5">
          <div className="col-lg-4 col-md-6 mb-4">
            <div className="service-card">
              <div className="service-icon">
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <h4>Entrance Preparation</h4>
              <p>Comprehensive preparation for various entrance examinations including BSc.CSIT, BIT, BCA, BE, and more.</p>
            </div>
          </div>
          
          <div className="col-lg-4 col-md-6 mb-4">
            <div className="service-card">
              <div className="service-icon">
                <i className="fa-solid fa-chalkboard-teacher"></i>
              </div>
              <h4>Online Classes</h4>
              <p>Live interactive online classes with experienced instructors and flexible scheduling options.</p>
            </div>
          </div>
          
          <div className="col-lg-4 col-md-6 mb-4">
            <div className="service-card">
              <div className="service-icon">
                <i className="fa-solid fa-book"></i>
              </div>
              <h4>Study Materials</h4>
              <p>Access to comprehensive study materials, practice tests, and previous year question papers.</p>
            </div>
          </div>
          
          <div className="col-lg-4 col-md-6 mb-4">
            <div className="service-card">
              <div className="service-icon">
                <i className="fa-solid fa-users"></i>
              </div>
              <h4>Career Counselling</h4>
              <p>Expert guidance and counselling to help you choose the right career path and educational opportunities.</p>
            </div>
          </div>
          
          <div className="col-lg-4 col-md-6 mb-4">
            <div className="service-card">
              <div className="service-icon">
                <i className="fa-solid fa-trophy"></i>
              </div>
              <h4>Scholarship Programs</h4>
              <p>Scholarship opportunities for deserving and talented students based on merit and need.</p>
            </div>
          </div>
          
          <div className="col-lg-4 col-md-6 mb-4">
            <div className="service-card">
              <div className="service-icon">
                <i className="fa-solid fa-certificate"></i>
              </div>
              <h4>Mock Tests</h4>
              <p>Regular mock tests and assessments to track your progress and improve performance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
