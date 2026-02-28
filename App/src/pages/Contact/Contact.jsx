import React, { useState } from 'react';
import { homeAPI } from '../../api/services';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    course: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await homeAPI.sendContact(formData);
      if (response.data.success) {
        alert(response.data.message);
        setFormData({
          name: '',
          phone: '',
          address: '',
          email: '',
          course: '',
          message: ''
        });
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to send message');
    }
    setLoading(false);
  };

  return (
    <div className="contact-page mt-5 pt-5">
      <div className="container-fluid">
        <h1 className="text-uppercase mb-4 text-center" style={{fontWeight: 900, color: 'var(--primary-orange)'}}>
          CONTACT <span style={{color: 'var(--primary-black)'}}>US</span>
        </h1>
        
        <div className="row mt-5">
          <div className="col-lg-6">
            <div className="contact-info">
              <h3>Get in Touch</h3>
              <p>We're here to help you with your educational journey. Feel free to reach out to us.</p>
              
              <div className="contact-details mt-4">
                <div className="contact-item mb-3">
                  <i className="fa-solid fa-location-dot me-3" style={{color: 'var(--primary-orange)'}}></i>
                  <span>Kathmandu, Nepal</span>
                </div>
                <div className="contact-item mb-3">
                  <i className="fa-solid fa-phone me-3" style={{color: 'var(--primary-orange)'}}></i>
                  <span>+977 9860688212, 9705688212</span>
                </div>
                <div className="contact-item mb-3">
                  <i className="fa-solid fa-envelope me-3" style={{color: 'var(--primary-orange)'}}></i>
                  <span>sajhaentrance01@gmail.com</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-lg-6">
            <div className="contact-form">
              <h3>Send us a Message</h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email Address"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <select
                    className="form-control"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Course</option>
                    <option value="BSc.CSIT">BSc.CSIT</option>
                    <option value="BIT">BIT</option>
                    <option value="BCA">BCA</option>
                    <option value="BE">BE</option>
                    <option value="CMAT">CMAT</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="mb-3">
                  <textarea
                    className="form-control"
                    rows="5"
                    placeholder="Your Message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn-primary w-100" disabled={loading}>
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
