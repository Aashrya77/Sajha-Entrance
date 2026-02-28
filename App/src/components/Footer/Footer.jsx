import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { homeAPI } from '../../api/services';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    try {
      const response = await homeAPI.subscribe(email);
      if (response.data.success) {
        alert(response.data.message);
        setEmail('');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Subscription failed');
    }
  };

  return (
    <>
      <div className="newsletter-wrapper mt-5">
        <div className="container-fluid">
          <div className="newsletter p-4 p-md-5">
            <span className="newsletter-heading text-uppercase">Subscribe to our newsletter</span>
            <span className="newsletter-subheading mt-2 text-md-center px-0 px-md-5" style={{lineHeight: '1.85rem'}}>We send you promotional mails, test notifications and news update to our students, clients for discounts offers, university updates and other mock test as well as university results.</span>
            <div className="mt-4 newsletter-input-section">
              <form onSubmit={handleSubscribe} className="d-flex align-items-center justify-content-center">
                <input 
                  className="newsletter-input" 
                  placeholder="Your Email Address" 
                  name="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button className="newsletter-button" type="submit">submit</button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-wrapper">
        <footer className="footer mt-5">
          <div className="container-fluid">
            <div className="row pb-5 align-items-start justify-content-center">
              <div className="col-12 col-md-4 d-flex flex-column justify-content-center align-items-center align-items-md-start mt-5">
                <h2 className="text-uppercase mb-0" style={{fontWeight: 900, color: 'var(--primary-orange)'}}>ABOUT <span style={{color: 'var(--primary-black)'}}>US</span></h2>
                <span className="text-center text-md-start mt-3" style={{fontSize: '15px', fontWeight: 500, lineHeight: '1.75rem'}}>
                  <b style={{fontWeight: 900}}>Sajha Entrance</b> is an educational institute for the preparation of BSc.CSIT, BIT, CMAT, BCA, BE, Bcs Hons(4yrs), Ielts, and many more programs. We aim to promote the education of students by providing diverse and challenging education through qualified and innovative teaching and learning.
                </span>
              </div>
              <div className="col-12 col-md-4 d-flex flex-column mt-5 justify-content-start">
                <h5 className="text-uppercase mb-0 text-center" style={{fontWeight: 900, color: 'var(--primary-orange)'}}>QUICK <span style={{color: 'var(--primary-black)'}}>LINKS</span></h5>
                <div className="d-flex align-items-start justify-content-evenly mt-2">
                  <div className="footer-links d-flex flex-column">
                    <Link to="/">Home</Link>
                    <Link to="/services">Services</Link>
                    <Link to="/colleges">Colleges</Link>
                  </div>
                  <div className="footer-links d-flex flex-column">
                    <Link to="/courses">Course</Link>
                    <Link to="/entrance">Entrance</Link>
                    <Link to="/about">About</Link>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4 d-flex flex-column mt-5">
                <h5 className="text-uppercase mb-0 text-center" style={{fontWeight: 900, color: 'var(--primary-orange)'}}>OUR <span style={{color: 'var(--primary-black)'}}>SOCIALS</span></h5>
                <div className="d-flex align-items-start justify-content-evenly mt-2">
                  <div className="footer-links d-flex flex-column">
                    <button className="footer-social-btn" style={{backgroundColor: 'blue'}} onClick={() => window.open('https://www.facebook.com/profile.php?id=100089786396817', '_blank')}><i className="fa-brands fa-facebook-f"></i></button>
                  </div>
                  <div className="footer-links d-flex flex-column">
                    <button className="footer-social-btn" style={{backgroundColor: 'rgb(0, 181, 0)'}} onClick={() => window.location.href='tel:+977 9860688212'}><i className="fa-solid fa-phone"></i></button>
                  </div>
                  <div className="footer-links d-flex flex-column">
                    <button className="footer-social-btn" style={{backgroundColor: 'rgb(0, 132, 255)'}} onClick={() => window.open('https://www.instagram.com/sajha_entrance?igsh=MW5hb2Y2a3luNXdwcQ==', '_blank')}> <i className="fa-brands fa-instagram"></i></button>
                  </div>
                  <div className="footer-links d-flex flex-column">
                    <button className="footer-social-btn" style={{backgroundColor: 'rgb(234, 17, 17)'}} onClick={() => window.location.href='mailto:sajhaentrance01@gmail.com'}><i className="fa-solid fa-envelope"></i></button>
                  </div>
                </div>

                <span className="text-center mt-4" style={{fontSize: '15px', fontWeight: 500}}>
                  For any further queries do visit our office, or give us a call at +977 9860688212, 9705688212.
                </span>
              </div>
            </div>
          </div>
          <hr className="mb-0 mt-0"/>
          <div className="d-flex flex-column align-items-center justify-content-center mb-3 mt-3">
            <span style={{fontSize: '14.5px', color: 'var(--primary-orange)', fontWeight: 500}}>Hand Crafted with ☕ and ❤️ by <a href="https://www.linkedin.com/in/mukesh-bhat/" target="_blank" rel="noopener noreferrer">Mukesh Bhat</a></span>
            <span style={{fontSize: '14.5px'}} className="mt-1">Copyright 2026 | All Rights Reserved</span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Footer;
