import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authAPI } from '../../api/services';
import './Form.css';
import adsImage from './ads.jpg';
import logoImage from './sajha-entrance.png';

const ForgotPasswordForm = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const images = [
    adsImage,
    adsImage
  ];
  const [currentImage, setCurrentImage] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(Boolean(token));
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const isResetMode = Boolean(token);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  useEffect(() => {
    if (!isResetMode) {
      setValidatingToken(false);
      return;
    }

    let ignore = false;

    const validateToken = async () => {
      setValidatingToken(true);
      setError('');
      setTokenInvalid(false);

      try {
        await authAPI.validateResetToken(token);
        if (!ignore) {
          setValidatingToken(false);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.response?.data?.error || 'This reset link is invalid or has expired.');
          setTokenInvalid(true);
          setValidatingToken(false);
        }
      }
    };

    validateToken();

    return () => {
      ignore = true;
    };
  }, [isResetMode, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isResetMode) {
        if (!formData.password) {
          setError('Password is required.');
          setLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        const response = await authAPI.resetPassword(token, {
          password: formData.password,
        });
        setSuccessMessage(response.data.message || 'Password reset successful. Please sign in.');
        setTimeout(() => navigate('/student/login'), 1200);
      } else {
        const response = await authAPI.forgotPassword({
          email: formData.email,
        });
        setSuccessMessage(
          response.data.message || 'If an account with that email exists, a reset link has been sent.'
        );
      }
    } catch (apiError) {
      setError(apiError.response?.data?.error || 'Something went wrong. Please try again.');
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
            <h2>Reset Password</h2>
            <p>Get back to your account securely.</p>
          </div>
        </div>

        <div className="form-container">
          <form className="form" onSubmit={handleSubmit}>
            <img src={logoImage} alt="Logo" className="form-logo" />
            <h1 className="form-title">{isResetMode ? 'Create New Password' : 'Forgot Password?'}</h1>
            <p className="message" style={{fontWeight: '350' , marginTop: '-19px'}}>
              {isResetMode
                ? 'Choose a new password for your account.'
                : 'Enter your email to receive a password reset link.'}
            </p>

            {error && (
              <div style={{background: '#fff0f0', color: '#d32f2f', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', border: '1px solid #ffcdd2'}}>
                {error}
              </div>
            )}

            {successMessage && (
              <div style={{background: '#f2fff3', color: '#1b5e20', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', border: '1px solid #c8e6c9'}}>
                {successMessage}
              </div>
            )}

            {!isResetMode && (
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
                <span>Email</span>
              </label>
            )}

            {isResetMode && (
              <>
                <label>
                  <input
                    required
                    placeholder=""
                    type="password"
                    className="input"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={validatingToken || tokenInvalid}
                  />
                  <span>New Password</span>
                </label>

                <label>
                  <input
                    required
                    placeholder=""
                    type="password"
                    className="input"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={validatingToken || tokenInvalid}
                  />
                  <span>Confirm Password</span>
                </label>
              </>
            )}

            <button className="submit" type="submit" disabled={loading || validatingToken || (isResetMode && tokenInvalid)}>
              {validatingToken
                ? 'Checking link...'
                : loading
                  ? (isResetMode ? 'Resetting Password...' : 'Sending Reset Link...')
                  : (isResetMode ? 'Reset Password' : 'Send Reset Link')}
            </button>
            <p className="signin">Remember your password? <Link to="/student/login">Sign In</Link></p>
            <p className="signin">Don't have an account? <Link to="/student/register">Register</Link></p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
