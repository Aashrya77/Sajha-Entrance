import React, { useEffect, useState } from 'react';
import { homeAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';

const About = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      await homeAPI.getAboutData();
      setLoading(false);
    } catch (error) {
      console.error('Error fetching about data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  return (
    <div className="about-page mt-5 pt-5">
      <div className="container">
        <h1 className="text-uppercase mb-4 text-center" style={{fontWeight: 900, color: 'var(--primary-orange)'}}>
          ABOUT <span style={{color: 'var(--primary-black)'}}>US</span>
        </h1>
        
        <div className="row mt-5">
          <div className="col-lg-6">
            <h3>Welcome to Sajha Entrance</h3>
            <p className="mt-3" style={{lineHeight: '1.8'}}>
              Sajha Entrance is an educational institute for the preparation of BSc.CSIT, BIT, CMAT, BCA, BE, 
              Bcs Hons(4yrs), IELTS, and many more programs. We aim to promote the education of students by 
              providing diverse and challenging education through qualified and innovative teaching and learning.
            </p>
            <p style={{lineHeight: '1.8'}}>
              Our institute has been helping students achieve their academic goals and secure admissions to 
              top colleges and universities. With experienced faculty, comprehensive study materials, and 
              personalized attention, we ensure that every student gets the best preparation possible.
            </p>
          </div>
          <div className="col-lg-6">
            <img src="/img/about-us.jpg" alt="About Us" className="img-fluid rounded" />
          </div>
        </div>

        <div className="row mt-5">
          <div className="col-lg-4">
            <div className="feature-box text-center">
              <i className="fa-solid fa-award fa-3x mb-3" style={{color: 'var(--primary-orange)'}}></i>
              <h4>Excellence in Education</h4>
              <p>Committed to providing quality education and guidance to students.</p>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="feature-box text-center">
              <i className="fa-solid fa-users fa-3x mb-3" style={{color: 'var(--primary-orange)'}}></i>
              <h4>Expert Faculty</h4>
              <p>Learn from experienced and dedicated teachers who care about your success.</p>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="feature-box text-center">
              <i className="fa-solid fa-chart-line fa-3x mb-3" style={{color: 'var(--primary-orange)'}}></i>
              <h4>Proven Results</h4>
              <p>Track record of successful students getting into top institutions.</p>
            </div>
          </div>
        </div>

        <div className="row mt-5">
          <div className="col-12">
            <h3 className="text-center mb-4">Our Mission</h3>
            <p className="text-center" style={{fontSize: '1.1rem', lineHeight: '1.8'}}>
              To empower students with knowledge, skills, and confidence to excel in their entrance examinations 
              and pursue their dream careers. We believe in nurturing talent and providing equal opportunities 
              for all students to succeed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
