import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { paymentAPI, bookPaymentAPI } from '../../api/services';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const uuid = searchParams.get('uuid');
  const courseName = searchParams.get('course');
  const type = searchParams.get('type'); // 'book' for book orders
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const isBookOrder = type === 'book';

  useEffect(() => {
    if (uuid) {
      fetchPaymentDetails();
    } else {
      setLoading(false);
    }
  }, [uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPaymentDetails = async () => {
    try {
      const response = isBookOrder
        ? await bookPaymentAPI.getPaymentStatus(uuid)
        : await paymentAPI.getPaymentStatus(uuid);
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
          {isBookOrder
            ? 'Your book order has been confirmed! We will process your delivery shortly.'
            : 'Your enrollment has been confirmed. You will receive a confirmation email shortly.'}
        </p>

        {loading ? (
          <div className="payment-result-loading">
            <div className="esewa-spinner"></div>
            <p>Loading payment details...</p>
          </div>
        ) : payment ? (
          <div className="payment-result-details">
            {isBookOrder ? (
              <>
                <div className="payment-detail-row">
                  <span>Customer Name</span>
                  <strong>{payment.customerName}</strong>
                </div>
                <div className="payment-detail-row">
                  <span>Email</span>
                  <strong>{payment.email}</strong>
                </div>
                <div className="payment-detail-row">
                  <span>Phone</span>
                  <strong>{payment.phone}</strong>
                </div>
                <div className="payment-detail-row">
                  <span>Delivery Address</span>
                  <strong>{payment.address}</strong>
                </div>
                <div className="payment-detail-row">
                  <span>Items</span>
                  <strong>
                    {payment.items?.map((item, i) => (
                      <div key={i}>{item.title} × {item.quantity}</div>
                    ))}
                  </strong>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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
            {isBookOrder && payment.deliveryStatus && (
              <div className="payment-detail-row">
                <span>Delivery Status</span>
                <strong style={{ textTransform: 'capitalize' }}>{payment.deliveryStatus}</strong>
              </div>
            )}
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
          {isBookOrder ? (
            <Link to="/books" className="payment-result-btn primary">
              <i className="fa-solid fa-book me-2"></i>
              Browse More Books
            </Link>
          ) : (
            <Link to="/courses" className="payment-result-btn primary">
              <i className="fa-solid fa-book-open me-2"></i>
              Browse More Courses
            </Link>
          )}
          <Link to="/" className="payment-result-btn secondary">
            <i className="fa-solid fa-house me-2"></i>
            Go to Home
          </Link>
        </div>

        <div className="payment-result-note">
          <i className="fa-solid fa-envelope me-1"></i>
          {isBookOrder
            ? 'A confirmation email will be sent to your registered email address. Your order will be delivered soon!'
            : 'A confirmation email has been sent to your registered email address.'}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
