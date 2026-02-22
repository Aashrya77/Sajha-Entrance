import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { paymentAPI } from '../../api/services';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const uuid = searchParams.get('uuid');
  const courseName = searchParams.get('course');
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uuid) {
      fetchPaymentDetails();
    } else {
      setLoading(false);
    }
  }, [uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPaymentDetails = async () => {
    try {
      const response = await paymentAPI.getPaymentStatus(uuid);
      if (response.data.success) {
        setPayment(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
    setLoading(false);
  };

  return (
    <div className="payment-result-page">
      <div className="payment-result-card payment-success-card">
        <div className="payment-result-icon success">
          <i className="fa-solid fa-circle-check"></i>
        </div>
        <h1 className="payment-result-title">Payment Successful!</h1>
        <p className="payment-result-subtitle">
          Your enrollment has been confirmed. You will receive a confirmation email shortly.
        </p>

        {loading ? (
          <div className="payment-result-loading">
            <div className="esewa-spinner"></div>
            <p>Loading payment details...</p>
          </div>
        ) : payment ? (
          <div className="payment-result-details">
            <div className="payment-detail-row">
              <span>Course</span>
              <strong>{payment.courseTitle}</strong>
            </div>
            <div className="payment-detail-row">
              <span>Student Name</span>
              <strong>{payment.studentName}</strong>
            </div>
            <div className="payment-detail-row">
              <span>Email</span>
              <strong>{payment.email}</strong>
            </div>
            <div className="payment-detail-row">
              <span>Amount Paid</span>
              <strong>Rs. {payment.totalAmount?.toLocaleString()}</strong>
            </div>
            <div className="payment-detail-row">
              <span>Transaction ID</span>
              <strong>{payment.transactionUuid}</strong>
            </div>
            {payment.transactionCode && (
              <div className="payment-detail-row">
                <span>eSewa Ref</span>
                <strong>{payment.transactionCode}</strong>
              </div>
            )}
            <div className="payment-detail-row">
              <span>Status</span>
              <strong className="payment-status-badge success">
                <i className="fa-solid fa-check-circle me-1"></i>Completed
              </strong>
            </div>
            {payment.paidAt && (
              <div className="payment-detail-row">
                <span>Paid At</span>
                <strong>{new Date(payment.paidAt).toLocaleString()}</strong>
              </div>
            )}
          </div>
        ) : courseName ? (
          <div className="payment-result-details">
            <div className="payment-detail-row">
              <span>Course</span>
              <strong>{decodeURIComponent(courseName)}</strong>
            </div>
            {uuid && (
              <div className="payment-detail-row">
                <span>Transaction ID</span>
                <strong>{uuid}</strong>
              </div>
            )}
          </div>
        ) : null}

        <div className="payment-result-actions">
          <Link to="/courses" className="payment-result-btn primary">
            <i className="fa-solid fa-book-open me-2"></i>
            Browse More Courses
          </Link>
          <Link to="/" className="payment-result-btn secondary">
            <i className="fa-solid fa-house me-2"></i>
            Go to Home
          </Link>
        </div>

        <div className="payment-result-note">
          <i className="fa-solid fa-envelope me-1"></i>
          A confirmation email has been sent to your registered email address.
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
