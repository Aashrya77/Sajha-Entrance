import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

const Cart = ({ cartItems, removeFromCart, updateQuantity }) => {
  const navigate = useNavigate();

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

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your Cart is Empty</h2>
          <p>Add some books to your cart to see them here.</p>
          <button className="btn btn-primary" onClick={() => navigate('/books')}>
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
                <p className="cart-item-author">by {item.author}</p>
                
                <div className="cart-item-price-info">
                  <span className="cart-item-price">₹{item.price}</span>
                  {item.originalPrice > item.price && (
                    <span className="cart-item-original-price">₹{item.originalPrice}</span>
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
                ₹{(item.price * item.quantity).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary-section">
          <div className="cart-summary">
            <h2 className="summary-title">Order Summary</h2>
            
            <div className="summary-row">
              <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
              <span>₹{calculateSubtotal().toLocaleString()}</span>
            </div>

            {calculateSavings() > 0 && (
              <div className="summary-row savings">
                <span>Total Savings</span>
                <span className="savings-amount">- ₹{calculateSavings().toLocaleString()}</span>
              </div>
            )}

            <div className="summary-row">
              <span>Shipping</span>
              <span className="free-shipping">FREE</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row total">
              <span>Total</span>
              <span>₹{calculateSubtotal().toLocaleString()}</span>
            </div>

            <button className="checkout-btn">
              Proceed to Checkout
            </button>

            <button className="continue-shopping-btn" onClick={() => navigate('/books')}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
