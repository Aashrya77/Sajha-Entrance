import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Form.css';
import adsImage from './ads.jpg';
import logoImage from './sajha-entrance.png';

const SignInForm = () => {
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
            <h2>Welcome Back!</h2>
            <p>Login to continue your studies.</p>
          </div>
        </div>

        <div className="form-container">
          <form className="form">
            <img src={logoImage} alt="Logo" className="form-logo" />
            <h1 className="form-title">Sign In</h1>
            <p className="message" style={{fontWeight: '350' , marginTop: '-20px'}}>Please enter your details.</p>

            <label>
              <input required placeholder="" type="email" className="input" />
              <span>Email or Contact No.</span>
            </label>

            <label>
              <input required placeholder="" type="password" className="input" />
              <span>Password</span>
            </label>

            <div style={{textAlign: 'right', marginTop: '-5px'}}>
              <Link to="/forgot-password" style={{fontSize: '12px', color: '#ff7422', textDecoration: 'none'}}>Forgot Password?</Link>
            </div>

            <button className="submit">Login</button>
            <p className="signin">Don't have an account? <Link to="/register">Register</Link></p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignInForm;