import React, { useState } from 'react';
import { paymentAPI } from '../../api/services';

const EsewaPayment = ({ courseId, courseTitle, amount, onCancel }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [step, setStep] = useState('form'); // 'form' | 'confirm' | 'processing'
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(98|97|96)\d{8}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Enter a valid Nepali phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
    if (apiError) setApiError('');
  };

  const handleProceed = (e) => {
    e.preventDefault();
    if (validate()) {
      setStep('confirm');
    }
  };

  const handlePayWithEsewa = async () => {
    setStep('processing');
    setApiError('');

    try {
      // Call backend to create payment record and get signed eSewa params
      const response = await paymentAPI.initiatePayment({
        courseId,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        amount,
      });

      if (!response.data.success) {
        setApiError(response.data.message || 'Failed to initiate payment');
        setStep('confirm');
        return;
      }

      const { esewaParams, esewaPaymentUrl } = response.data.data;

      // Create a hidden form and submit to eSewa
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = esewaPaymentUrl;

      Object.entries(esewaParams).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('Payment initiation error:', error);
      setApiError(
        error.response?.data?.message || 'Something went wrong. Please try again.'
      );
      setStep('confirm');
    }
  };

  if (step === 'processing') {
    return (
      <div className="esewa-processing">
        <div className="esewa-spinner"></div>
        <p>Redirecting to eSewa...</p>
        <span>Please do not close this window</span>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="esewa-confirm">
        <h4 className="esewa-confirm-title">
          <i className="fa-solid fa-receipt me-2"></i>Confirm Payment
        </h4>
        {apiError && (
          <div className="esewa-api-error">
            <i className="fa-solid fa-circle-exclamation me-1"></i>
            {apiError}
          </div>
        )}
        <div className="esewa-summary">
          <div className="esewa-summary-row">
            <span>Course</span>
            <strong>{courseTitle}</strong>
          </div>
          <div className="esewa-summary-row">
            <span>Student</span>
            <strong>{formData.fullName}</strong>
          </div>
          <div className="esewa-summary-row">
            <span>Email</span>
            <strong>{formData.email}</strong>
          </div>
          <div className="esewa-summary-row">
            <span>Phone</span>
            <strong>{formData.phone}</strong>
          </div>
          <div className="esewa-summary-row esewa-total-row">
            <span>Total Amount</span>
            <strong>Rs. {amount.toLocaleString()}</strong>
          </div>
        </div>
        <button className="esewa-pay-btn" onClick={handlePayWithEsewa}>
          <img
            src="https://esewa.com.np/common/images/esewa_logo.png"
            alt="eSewa"
            className="esewa-logo"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          Pay Rs. {amount.toLocaleString()} with eSewa
        </button>
        <button className="esewa-back-btn" onClick={() => setStep('form')}>
          <i className="fa-solid fa-arrow-left me-1"></i> Edit Details
        </button>
      </div>
    );
  }

  return (
    <form className="esewa-form" onSubmit={handleProceed}>
      <div className="esewa-form-group">
        <label>Full Name <span>*</span></label>
        <div className="esewa-input-wrap">
          <i className="fa-solid fa-user"></i>
          <input
            type="text"
            name="fullName"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleChange}
            className={errors.fullName ? 'error' : ''}
          />
        </div>
        {errors.fullName && <span className="esewa-error">{errors.fullName}</span>}
      </div>

      <div className="esewa-form-group">
        <label>Email <span>*</span></label>
        <div className="esewa-input-wrap">
          <i className="fa-solid fa-envelope"></i>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'error' : ''}
          />
        </div>
        {errors.email && <span className="esewa-error">{errors.email}</span>}
      </div>

      <div className="esewa-form-group">
        <label>Phone Number <span>*</span></label>
        <div className="esewa-input-wrap">
          <i className="fa-solid fa-phone"></i>
          <input
            type="tel"
            name="phone"
            placeholder="98XXXXXXXX"
            value={formData.phone}
            onChange={handleChange}
            className={errors.phone ? 'error' : ''}
          />
        </div>
        {errors.phone && <span className="esewa-error">{errors.phone}</span>}
      </div>

      <div className="esewa-form-actions">
        <button type="submit" className="esewa-proceed-btn">
          Proceed to Payment
          <i className="fa-solid fa-arrow-right ms-2"></i>
        </button>
        <button type="button" className="esewa-cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default EsewaPayment;
