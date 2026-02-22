import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Form.css';
import adsImage from './ads.jpg';
import logoImage from './sajha-entrance.png';

const ForgotPasswordForm = () => {
  const images = [
    adsImage,
    adsImage
  ];
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="page-wrapper">
      <div className="main-card">
        <div className="image-container">
          {images.map((img, index) => (
            <img key={index} src={img} alt="Slide" className={`bg-image ${index === currentImage ? 'active' : ''}`} />
          ))}
          <div className="image-overlay-text">
            <h2>Reset Password</h2>
            <p>Get back to your account securely.</p>
          </div>
        </div>

        <div className="form-container">
          <form className="form">
            <img src={logoImage} alt="Logo" className="form-logo" />
            <h1 className="form-title">Forgot Password?</h1>
            <p className="message" style={{fontWeight: '350' , marginTop: '-19px'}}>Enter your email to reset your password.</p>

            <label>
              <input required placeholder="" type="email" className="input" />
              <span>Email or Contact No.</span>
            </label>

            <button className="submit">Send Reset Link</button>
            <p className="signin">Remember your password? <Link to="/student/login">Sign In</Link></p>
            <p className="signin">Don't have an account? <Link to="/student/register">Register</Link></p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
