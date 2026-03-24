import React, { useState } from 'react';
import { inquiryAPI } from '../../api/services';
import './InquiryModal.css';

const InquiryModal = ({ isOpen, onClose, collegeName, collegeId, universityId, courses = [] }) => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Yadi modal open chhaina bhane kehi pani nadekhau
  if (!isOpen) return null;

  // Background overlay ma click garda modal banda garna
  const handleOverlayClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!collegeId && !universityId) {
      setError('Institution information not found. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        course: selectedCourse,
        message: formData.message
      };

      // Add collegeId or universityId based on which is provided
      if (collegeId) {
        payload.collegeId = collegeId;
      } else if (universityId) {
        payload.universityId = universityId;
      }

      const response = await inquiryAPI.submitInquiry(payload);

      if (response.data.success) {
        setSuccess(true);
        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
            message: ''
          });
          setSelectedCourse('');
          setSuccess(false);
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      setError(err.response?.data?.error || 'Failed to submit inquiry. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        
        {/* Header - Sajha Orange Theme */}
        <div className="modal-header">
          <div className="header-title">
            <span className="send-icon">➤</span>
            Make Enquiry
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-content">
          {/* Success Message */}
          {success && (
            <div className="inquiry-success-message">
              <span className="success-icon">✓</span>
              <p>Your enquiry has been submitted successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="inquiry-error-message">
              <p>{error}</p>
            </div>
          )}

          {/* Dynamic College Name Box */}
          <div className="college-info-box">
            <span className="label">ENQUIRING ABOUT</span>
            <h3>{collegeName || "Select College"}</h3>
          </div>

          {/* Form */}
          <form className="inquiry-form" onSubmit={handleSubmit}>
            {/* Row 1: Full Name */}
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input 
                type="text" 
                name="name"
                placeholder="Enter your full name" 
                value={formData.name}
                onChange={handleInputChange}
                required 
              />
            </div>

            {/* Row 2: Email and Phone */}
            <div className="form-group">
              <label>Email Address <span className="required">*</span></label>
              <input 
                type="email" 
                name="email"
                placeholder="your.email@example.com" 
                value={formData.email}
                onChange={handleInputChange}
                required 
              />
            </div>

            <div className="form-group">
              <label>Phone Number <span className="required">*</span></label>
              <input 
                type="tel" 
                name="phone"
                placeholder="+977 98XXXXXXXX" 
                value={formData.phone}
                onChange={handleInputChange}
                required 
              />
            </div>

            {/* Full Width: Course Selection */}
            {courses && courses.length > 0 && (
              <div className="form-group form-group-full-width">
                <label>I want to study <span className="required">*</span></label>
                <select 
                  value={selectedCourse} 
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  required
                  className="course-select"
                >
                  <option value="">-- Select a course --</option>
                  {courses.map((course) => (
                    <option key={course._id || course.id} value={course.title || course.name}>
                      {course.fullForm || course.title || course.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Full Width: Message */}
            <div className="form-group form-group-full-width">
              <label>Message <span className="required">*</span></label>
              <textarea 
                rows="4" 
                name="message"
                placeholder="Tell us about your enquiry..." 
                value={formData.message}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span> Submitting...
                </>
              ) : (
                <>
                  <span className="send-icon">➤</span> Submit Enquiry
                </>
              )}
            </button>
          </form>

          <p className="footer-note">
            By submitting this form, you agree to be contacted by the college regarding your enquiry.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InquiryModal;