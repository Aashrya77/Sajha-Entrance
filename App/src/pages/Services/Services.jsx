import React from 'react';
import '../../styles/services.css';
import InquiryButton from '../../components/InquiryForm/InquiryButton';

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
              <div className="service-image-wrapper">
                  <img src="https://media.philstar.com/photos/2024/06/28/6_2024-06-28_22-06-36.jpg" alt="Entrance Prep" className="service-full-img" />
              </div>
              <div className="service-content">
                <h4>Entrance Preparation</h4>
                <p>Comprehensive preparation for various entrance examinations including BSc.CSIT, BIT, BCA, BE, and more.</p>
              </div>
            </div>
          </div>
           <div className="col-lg-4 col-md-6 mb-4">
            <div className="service-card">
              <div className="service-image-wrapper">
                  <img src="https://alongtheboards.com/wp-content/uploads/2020/07/Online-Classes.jpg" alt="Entrance Prep" className="service-full-img" />
              </div>
              <div className="service-content">
                <h4>Online Classes</h4>
                <p>Live interactive online classes with experienced instructors and flexible scheduling options.</p>
              </div>
            </div>
          </div>
           <div className="col-lg-4 col-md-6 mb-4">
            <div className="service-card">
              <div className="service-image-wrapper">
                  <img src="https://np-live-21.slatic.net/kf/S00ffa6e19bfc46f0bf0808bc2591ccd8q.jpg" alt="Entrance Prep" className="service-full-img" />
              </div>
              <div className="service-content">
                <h4>Study Materials</h4>
                <p>Access to comprehensive study materials, practice tests, and previous year question papers.</p>
              </div>
            </div>
          </div>
           <div className="col-lg-4 col-md-6 mb-4">
            <div className="service-card">
              <div className="service-image-wrapper">
                  <img src="https://www.lpsglobal.org/blogs/wp-content/uploads/2024/07/Career-Counseling-in-Schools-Guiding-Students-Towards-their-Dreams.jpg" alt="Entrance Prep" className="service-full-img" />
              </div>
              <div className="service-content">
                <h4>Career Counselling</h4>
                <p>Expert guidance and counselling to help you choose the right career path and educational opportunities.</p>
              </div>
            </div>
          </div>
           <div className="col-lg-4 col-md-6 mb-4">
            <div className="service-card">
              <div className="service-image-wrapper">
                  <img src="https://images.shiksha.com/mediadata/images/articles/1718012699phpo0SUvQ.jpeg" alt="Entrance Prep" className="service-full-img" />
              </div>
              <div className="service-content">
                <h4>Scholarship Programs</h4>
                <p>Access to exclusive scholarship opportunities and financial aid programs for deserving students.</p>
              </div>
            </div>
          </div>
           <div className="col-lg-4 col-md-6 mb-4">
            <div className="service-card">
              <div className="service-image-wrapper">
                  <img src="https://images.indianexpress.com/2023/09/ch735643.jpg?resize=600,400" alt="Entrance Prep" className="service-full-img" />
              </div>
              <div className="service-content">
                <h4>Mock Tests</h4>
                <p>Practice with a variety of mock tests designed to simulate real exam conditions and improve performance.</p>
              </div>
            </div>
          </div>
          
          
        </div>

        {/* Floating Inquiry Button */}
        <InquiryButton collegeName="Sajha Entrance Services" position="bottom-right" />
      </div>
    </div>
  );
};

export default Services;
