import React, { useState } from 'react';
import { homeAPI } from '../../api/services';
import '../../../public/css/Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: 'Kathmandu', // Default address or empty
    email: '',
    course: '',
    college: '', 
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Backend fix: Yadi backend ma 'college' field chhaina bhane 
    // college info lai message ko agadi thapera pathaune
    const submissionData = {
      ...formData,
      message: `College: ${formData.college} | Message: ${formData.message}`
    };

    try {
      const response = await homeAPI.sendContact(submissionData);
      if (response.data.success) {
        alert("Message sent successfully!");
        setFormData({ name: '', phone: '', address: 'Kathmandu', email: '', course: '', college: '', message: '' });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error.response?.data?.error || 'Failed to send message. Please check all fields.');
    }
    setLoading(false);
  };

  return (
    <div className="contact-page">
      <div className="container contact-container">
        <div className="contact-header text-center mb-5">
          <h1 className="display-4 fw-bold text-uppercase">
            CONTACT <span className="highlight">US</span>
          </h1>
          <p className="text-muted">Have questions? We'd love to hear from you.Directly visit us or send a quick message. </p>
        </div>

        <div className="row g-5">
          {/* Left Side: Info & Map */}
          <div className="col-lg-5">
            <div className="info-wrapper">
              <h3 className="mb-4">Get in Touch</h3>
              <div className="contact-info-card">
                <div className="icon-box"><i className="fa-solid fa-location-dot"></i></div>
                <div>
                  <h5 className="highlight">Location</h5>
                  <p>Beside Laxmi Sunrise Bank, Putalisadak, Kathmandu</p>
                </div>
              </div>

              <div className="map-container mt-4">
                {/* Real Google Map Embed Link (Replace if needed) */}
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.4172445101684!2d85.3204128760924!3d27.70438182513222!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb190868f70399%3A0xc3f58a74ec32386!2sSajha%20Entrance!5e0!3m2!1sen!2snp!4v1700000000000" 
                  width="100%" height="250" style={{ border: 0, borderRadius: '15px' }} allowFullScreen="" loading="lazy">
                </iframe>
              </div>

              <div className="contact-info-card mt-4">
                <div className="icon-box"><i className="fa-solid fa-phone"></i></div>
                <div>
                  <h5 className="highlight">Phone No.</h5>
                  <p>+977 9860688212, 9705688212</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="col-lg-7">
            <div className="contact-form-card">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required placeholder='Your Full Name' />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">+2 College Name</label>
                    <input type="text" className="form-control" name="college" value={formData.college} onChange={handleChange} required placeholder='Your College Name' />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone Number</label>
                    <input type="tel" className="form-control" name="phone" value={formData.phone} onChange={handleChange} required placeholder='98XXXXXXXX' />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required placeholder='yourname@example.com' />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Course Interest</label>
                  <select className="form-select" name="course" value={formData.course} onChange={handleChange} required>
                    <option value="">Select Course</option>
                    <option value="IOE">IOE</option>
                    <option value="BSc.CSIT">BSc.CSIT</option>
                    <option value="BIT">BIT</option>
                    <option value="BCA">BCA</option>
                    <option value="CMAT">CMAT</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="form-label">Message</label>
                  <textarea className="form-control" rows="4" name="message" value={formData.message} onChange={handleChange} required placeholder='Your Message'></textarea>
                </div>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="fa-solid fa-paper-plane me-2"></i>
                  )}
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;