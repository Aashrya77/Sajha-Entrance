import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookPaymentAPI } from '../../api/services';
import './Cart.css';

const Cart = ({ cartItems, removeFromCart, updateQuantity, clearCart }) => {
  const navigate = useNavigate();
  const esewaFormRef = useRef(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [esewaData, setEsewaData] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
  });

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateSavings = () => {
    return cartItems.reduce((total, item) => {
      const savings = (item.originalPrice - item.price) * item.quantity;
      return total + savings;
    }, 0);
  };

  const handleQuantityChange = (bookId, newQuantity) => {
    if (newQuantity >= 0) {
      updateQuantity(bookId, newQuantity);
    }
  };

  const handleCustomerInfoChange = (e) => {
    setCustomerInfo({ ...customerInfo, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setCheckoutLoading(true);
    setCheckoutError('');

    try {
      const response = await bookPaymentAPI.initiatePayment({
        ...customerInfo,
        items: cartItems.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
      });

      if (response.data.success) {
        const { esewaParams, esewaPaymentUrl } = response.data.data;
        setEsewaData({ esewaParams, esewaPaymentUrl });

        // Auto-submit the hidden eSewa form after state update
        setTimeout(() => {
          if (esewaFormRef.current) {
            esewaFormRef.current.submit();
          }
        }, 100);
      } else {
        setCheckoutError(response.data.message || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(error.response?.data?.message || 'Failed to initiate payment. Please try again.');
    }
    setCheckoutLoading(false);
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your Cart is Empty</h2>
          <p>Add some books to your cart to see them here.</p>
          <button className="btn btn-primary cartbutton" onClick={() => navigate('/books')}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1 className="cart-title">Shopping Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</h1>

      <div className="cart-content">
        <div className="cart-items-section">
          {cartItems.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-image" onClick={() => navigate(`/book/${item.id}`)}>
                <img src={item.image} alt={item.title} />
              </div>

              <div className="cart-item-details">
                <h3 className="cart-item-title" onClick={() => navigate(`/book/${item.id}`)}>
                  {item.title}
                </h3>
               
                
                <div className="cart-item-price-info">
                  <span className="cart-item-price">Rs.{item.price}</span>
                  {item.originalPrice > item.price && (
                    <span className="cart-item-original-price">Rs.{item.originalPrice}</span>
                  )}
                  {item.discount > 0 && (
                    <span className="cart-item-discount">{item.discount}% OFF</span>
                  )}
                </div>
              </div>

              <div className="cart-item-actions">
                <div className="cart-quantity-controls">
                  <button 
                    className="cart-quantity-btn"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span className="cart-quantity-display">{item.quantity}</span>
                  <button 
                    className="cart-quantity-btn"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>

                <button 
                  className="cart-remove-btn"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </button>
              </div>

              <div className="cart-item-total">
                Rs.{(item.price * item.quantity).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary-section">
          <div className="cart-summary">
            <h2 className="summary-title">Order Summary</h2>
            
            <div className="summary-row">
              <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
              <span>Rs.{calculateSubtotal().toLocaleString()}</span>
            </div>

            {calculateSavings() > 0 && (
              <div className="summary-row savings">
                <span>Total Savings</span>
                <span className="savings-amount">- Rs.{calculateSavings().toLocaleString()}</span>
              </div>
            )}

            <div className="summary-row">
              <span>Shipping</span>
              <span className="free-shipping">FREE</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row total">
              <span>Total</span>
              <span>Rs.{calculateSubtotal().toLocaleString()}</span>
            </div>

            {!showCheckout ? (
              <>
                <button className="checkout-btn" onClick={() => setShowCheckout(true)}>
                  Proceed to Checkout
                </button>
                <button className="continue-shopping-btn" onClick={() => navigate('/books')}>
                  Continue Shopping
                </button>
              </>
            ) : (
              <div className="checkout-form-section">
                <h3 className="checkout-form-title">Delivery Details</h3>
                {checkoutError && (
                  <div className="checkout-error">{checkoutError}</div>
                )}
                <form onSubmit={handleCheckout}>
                  <div className="checkout-field">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="customerName"
                      value={customerInfo.customerName}
                      onChange={handleCustomerInfoChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="checkout-field">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={customerInfo.email}
                      onChange={handleCustomerInfoChange}
                      required
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="checkout-field">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleCustomerInfoChange}
                      required
                      placeholder="98XXXXXXXX"
                    />
                  </div>
                  <div className="checkout-field">
                    <label>Delivery Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={customerInfo.address}
                      onChange={handleCustomerInfoChange}
                      required
                      placeholder="Your delivery address"
                    />
                  </div>
                  <button
                    type="submit"
                    className="checkout-btn esewa-pay-btn"
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? (
                      <span>Processing...</span>
                    ) : (
                      <span>Pay Rs.{calculateSubtotal().toLocaleString()} with eSewa</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="continue-shopping-btn"
                    onClick={() => setShowCheckout(false)}
                  >
                    Back
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden eSewa form — auto-submitted after payment initiation */}
      {esewaData && (
        <form
          ref={esewaFormRef}
          action={esewaData.esewaPaymentUrl}
          method="POST"
          style={{ display: 'none' }}
        >
          {Object.entries(esewaData.esewaParams).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}
    </div>
  );
};

export default Cart;
