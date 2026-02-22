import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../api/services';
import '../../components/FormDesign/Form.css';
import adsImage from '../../components/FormDesign/ads.jpg';
import logoImage from '../../components/FormDesign/sajha-entrance.png';

const StudentRegister = () => {
  const navigate = useNavigate();
  const images = [adsImage, adsImage];
  const [currentImage, setCurrentImage] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    collegeName: '',
    course: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Mobile Number is required';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    setApiError('');

    try {
      const response = await authAPI.register(formData);
      if (response.data.success) {
        alert('Registration successful! Please login.');
        navigate('/student/login');
      }
    } catch (error) {
      setApiError(error.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
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
          <h4 style={{fontWeight: '350', marginTop: '-1px'}}>Secure access to manage operations</h4>

          {apiError && (
            <div style={{background: '#fff0f0', color: '#d32f2f', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', border: '1px solid #ffcdd2'}}>
              {apiError}
            </div>
          )}

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
                <input required placeholder="" type="text" className="input" name="name" value={formData.name} onChange={handleInputChange} />
                <span>Full Name</span>
                {errors.name && <span className="error-text">{errors.name}</span>}
              </label>

              <label>
                <input required placeholder="" type="tel" className="input" name="phone" value={formData.phone} onChange={handleInputChange} />
                <span>Contact Number</span>
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </label>

              <label>
                <input required placeholder="" type="text" className="input" name="address" value={formData.address} onChange={handleInputChange} />
                <span>Location (City/District)</span>
                {errors.address && <span className="error-text">{errors.address}</span>}
              </label>

              <label>
                <input required placeholder="" type="text" className="input" name="collegeName" value={formData.collegeName} onChange={handleInputChange} />
                <span>+2 College Name</span>
                {errors.collegeName && <span className="error-text">{errors.collegeName}</span>}
              </label>

              <label>
                <select required className="input" name="course" value={formData.course} onChange={handleInputChange}>
                  <option value="" disabled>Select Course</option>
                  <option value="BSc.CSIT">BSc.CSIT</option>
                  <option value="BIT">BIT</option>
                  <option value="BCA">BCA</option>
                  <option value="CMAT">CMAT</option>
                  <option value="IOT">IOT</option>
                </select>
                <span></span>
                {errors.course && <span className="error-text">{errors.course}</span>}
              </label>

              <button type="button" className="submit next-btn" onClick={handleNext}>Next</button>
            </div>

            {/* Step 2: Account Setup */}
            <div className={`form-step ${currentStep === 2 ? 'active' : ''}`}>
              <label>
                <input required placeholder="" type="email" className="input" name="email" value={formData.email} onChange={handleInputChange} />
                <span>Email</span>
                {errors.email && <span className="error-text">{errors.email}</span>}
              </label>

              <label>
                <input required placeholder="" type="password" className="input" name="password" value={formData.password} onChange={handleInputChange} />
                <span>Password</span>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </label>

              <label>
                <input required placeholder="" type="password" className="input" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} />
                <span>Confirm Password</span>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </label>

              <div className="button-group">
                <button type="button" className="submit back-btn" onClick={handleBack}>Back</button>
                <button type="submit" className="submit signup-btn" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Signing Up...' : 'Sign Up'}
                </button>
              </div>
            </div>
          </form>

          <p className="signin">Already have an account? <Link to="/student/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;
