import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const FAILURE_REASONS = {
  payment_failed: 'Your payment was not completed. This could be due to cancellation or insufficient balance.',
  signature_mismatch: 'Payment verification failed. Please contact support if money was deducted.',
  no_data: 'No payment data was received from eSewa.',
  invalid_data: 'Invalid payment response received.',
  incomplete: 'The payment was not marked as complete by eSewa.',
  not_found: 'Payment record was not found in our system.',
  server_error: 'An unexpected error occurred. Please try again later.',
};

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') || 'payment_failed';
  const uuid = searchParams.get('uuid');

  const reasonMessage = FAILURE_REASONS[reason] || FAILURE_REASONS.payment_failed;

  return (
    <div className="payment-result-page">
      <div className="payment-result-card payment-failure-card">
        <div className="payment-result-icon failure">
          <i className="fa-solid fa-circle-xmark"></i>
        </div>
        <h1 className="payment-result-title">Payment Failed</h1>
        <p className="payment-result-subtitle">{reasonMessage}</p>

        {uuid && (
          <div className="payment-result-details">
            <div className="payment-detail-row">
              <span>Transaction ID</span>
              <strong>{uuid}</strong>
            </div>
            <div className="payment-detail-row">
              <span>Status</span>
              <strong className="payment-status-badge failure">
                <i className="fa-solid fa-times-circle me-1"></i>Failed
              </strong>
            </div>
          </div>
        )}

        <div className="payment-result-actions">
          <Link to="/courses" className="payment-result-btn primary">
            <i className="fa-solid fa-rotate-right me-2"></i>
            Try Again
          </Link>
          <Link to="/contact" className="payment-result-btn secondary">
            <i className="fa-solid fa-headset me-2"></i>
            Contact Support
          </Link>
          <Link to="/" className="payment-result-btn secondary">
            <i className="fa-solid fa-house me-2"></i>
            Go to Home
          </Link>
        </div>

        <div className="payment-result-note">
          <i className="fa-solid fa-info-circle me-1"></i>
          If money was deducted from your eSewa account, it will be refunded within 24-48 hours.
          For any issues, please contact us with your transaction ID.
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
