import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../api/services';
import '../../components/FormDesign/Form.css';
import adsImage from '../../components/FormDesign/ads.jpg';
import logoImage from '../../components/FormDesign/sajha-entrance.png';

const StudentLogin = ({ setStudentData, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const images = [adsImage, adsImage];
  const [currentImage, setCurrentImage] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login(formData);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setStudentData(response.data.data);
        setIsAuthenticated(true);
        navigate('/student/profile');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
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
          <div className="image-overlay-text">
            <h2>Welcome Back!</h2>
            <p>Login to continue your studies.</p>
          </div>
        </div>

        <div className="form-container">
          <form className="form" onSubmit={handleSubmit}>
            <img src={logoImage} alt="Logo" className="form-logo" />
            <h1 className="form-title">Sign In</h1>
            <p className="message" style={{fontWeight: '350', marginTop: '-20px'}}>Please enter your details.</p>

            {error && (
              <div style={{background: '#fff0f0', color: '#d32f2f', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', border: '1px solid #ffcdd2'}}>
                {error}
              </div>
            )}

            <label>
              <input
                required
                placeholder=""
                type="email"
                className="input"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
              <span>Email or Contact No.</span>
            </label>

            <label>
              <input
                required
                placeholder=""
                type="password"
                className="input"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
              <span>Password</span>
            </label>

            <div style={{textAlign: 'right', marginTop: '-5px'}}>
              <Link to="/forgot-password" style={{fontSize: '12px', color: '#ff7422', textDecoration: 'none'}}>Forgot Password?</Link>
            </div>

            <button className="submit" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p className="signin">Don't have an account? <Link to="/student/register">Register</Link></p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
