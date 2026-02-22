import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Form.css';
import adsImage from './ads.jpg';
import logoImage from './sajha-entrance.png';

const RegisterForm = () => {
  const images = [adsImage, adsImage];
  const [currentImage, setCurrentImage] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    address: '',
    collegeName: '',
    course: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile Number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.collegeName.trim()) newErrors.collegeName = 'College Name is required';
    if (!formData.course) newErrors.course = 'Please select a course';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email.trim()) setErrors(prev => ({ ...prev, email: 'Email is required' }));
    if (!formData.password) setErrors(prev => ({ ...prev, password: 'Password is required' }));
    if (formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }
    
    // Here you would submit the form
    console.log('Form submitted:', formData);
    // Reset form after successful submission
  };

  return (
    <div className="page-wrapper">
      <div className="main-card">
        <div className="image-container">
          {images.map((img, index) => (
            <img key={index} src={img} alt="Slide" className={`bg-image ${index === currentImage ? 'active' : ''}`} />
          ))}
         
        </div>

        <div className="form-container">
          <img src={logoImage} alt="Logo" className="form-logo" />
          <h1 className="form-title">Sign Up</h1>
          <h4 style={{fontWeight: '350' , marginTop: '-1px'}}>Secure access to manage operations</h4>

          {/* Progress Stepper */}
          <div className="stepper-container">
            <div className={`stepper-circle ${currentStep >= 1 ? 'active' : ''}`}>1</div>
            <div className={`stepper-line ${currentStep >= 2 ? 'active' : ''}`}></div>
            <div className={`stepper-circle ${currentStep >= 2 ? 'active' : ''}`}>2</div>
          </div>
          <div className="stepper-labels">
            <span>Personal Details</span>
            <span>Set Password</span>
          </div>

          <form className="form">
            {/* Step 1: Personal Details */}
            <div className={`form-step ${currentStep === 1 ? 'active' : ''}`}>
              <label>
                <input 
                  required 
                  placeholder="" 
                  type="text" 
                  className="input" 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
                <span>Full Name</span>
                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
              </label>

              <label>
                <input 
                  required 
                  placeholder="" 
                  type="tel" 
                  className="input"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                />
                <span>Contact Number</span>
                {errors.mobileNumber && <span className="error-text">{errors.mobileNumber}</span>}
              </label>

              <label>
                <input 
                  required 
                  placeholder="" 
                  type="text" 
                  className="input"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
                <span>Location (City/District)</span>
                {errors.address && <span className="error-text">{errors.address}</span>}
              </label>

              <label>
                <input 
                  required 
                  placeholder="" 
                  type="text" 
                  className="input"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleInputChange}
                />
                <span>+2 College Name</span>
                {errors.collegeName && <span className="error-text">{errors.collegeName}</span>}
              </label>

              <label>
                <select 
                  required 
                  className="input" 
                  defaultValue=""
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                >
                  <option value="" disabled>Select Course</option>
                  <option value="bsc-csit">BSc.CSIT</option>
                  <option value="bit">BIT</option>
                  <option value="bca">BCA</option>
                  <option value="cmat">CMAT</option>
                  <option value="iot">IOT</option>
                </select>
                <span></span>
                {errors.course && <span className="error-text">{errors.course}</span>}
              </label>

              <button type="button" className="submit next-btn" onClick={handleNext}>Next</button>
            </div>

            {/* Step 2: Account Setup */}
            <div className={`form-step ${currentStep === 2 ? 'active' : ''}`}>
              <label>
                <input 
                  required 
                  placeholder="" 
                  type="email" 
                  className="input"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <span>Email</span>
                {errors.email && <span className="error-text">{errors.email}</span>}
              </label>

              <label>
                <input 
                  required 
                  placeholder="" 
                  type="password" 
                  className="input"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <span>Password</span>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </label>

              <label>
                <input 
                  required 
                  placeholder="" 
                  type="password" 
                  className="input"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <span>Confirm Password</span>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </label>

              <div className="button-group">
                <button type="button" className="submit back-btn" onClick={handleBack}>Back</button>
                <button type="submit" className="submit signup-btn" onClick={handleSubmit}>Sign Up</button>
              </div>
            </div>
          </form>

          <p className="signin">Already have an account? <Link to="/signin">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;