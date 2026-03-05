import React, { useState } from 'react';
import './InquiryModal.css';

const InquiryModal = ({ isOpen, onClose, collegeName, courses = [] }) => {
  const [selectedCourse, setSelectedCourse] = useState('');
  
  // Yadi modal open chhaina bhane kehi pani nadekhau
  if (!isOpen) return null;

  // Background overlay ma click garda modal banda garna
  const handleOverlayClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Form submission logic yaha halnu hola
    console.log("Enquiry sent for:", collegeName);
    console.log("Selected Course:", selectedCourse);
    onClose();
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
          {/* Dynamic College Name Box */}
          <div className="college-info-box">
            <span className="label">ENQUIRING ABOUT</span>
            <h3>{collegeName || "Select College"}</h3>
          </div>

          {/* Form */}
          <form className="inquiry-form" onSubmit={handleSubmit}>
            {/* Row 1: Full Name and Address */}
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input type="text" placeholder="Enter your full name" required />
            </div>

            <div className="form-group">
              <label>Address <span className="required">*</span></label>
              <input type="text" placeholder="Enter your current address" required />
            </div>

            {/* Row 2: Email and Phone */}
            <div className="form-group">
              <label>Email Address <span className="required">*</span></label>
              <input type="email" placeholder="your.email@example.com" required />
            </div>

            <div className="form-group">
              <label>Phone Number <span className="required">*</span></label>
              <input type="tel" placeholder="+977 98XXXXXXXX" required />
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
              <textarea rows="4" placeholder="Tell us about your enquiry..." required></textarea>
            </div>

            <button type="submit" className="submit-btn">
              <span className="send-icon">➤</span> Submit Enquiry
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