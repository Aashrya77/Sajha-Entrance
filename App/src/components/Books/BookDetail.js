import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './BookDetail.css';

const BookDetail = ({ books, addToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const book = books.find(b => b.id === parseInt(id));
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  if (!book) {
    return (
      <div className="book-detail-container">
        <div className="not-found">
          <h2>Book Not Found</h2>
          <button className="btn btn-primary" onClick={() => navigate('/books')}>
            Back to Books
          </button>
        </div>
      </div>
    );
  }

  const handleQuantityChange = (type) => {
    if (type === 'increase') {
      setQuantity(prev => prev + 1);
    } else if (type === 'decrease' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    addToCart(book, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star">★</span>);
    }

    return stars;
  };

  return (
    <div className="book-detail-container">
      <div className="breadcrumb">
        <span onClick={() => navigate('/')} className="breadcrumb-link">Home</span>
        <span className="breadcrumb-separator">/</span>
        <span onClick={() => navigate('/books')} className="breadcrumb-link">Books</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{book.title}</span>
      </div>

      <div className="book-detail-content">
        <div className="book-detail-left">
          <div className="book-image-section">
            {book.discount > 0 && (
              <div className="detail-discount-badge">-{book.discount}% OFF</div>
            )}
            <img src={book.image} alt={book.title} className="book-detail-image" />
          </div>
        </div>

        <div className="book-detail-right">
          <div className="book-detail-info">
            <span className="book-category-badge">{book.category}</span>
            <h1 className="book-detail-title">{book.title}</h1>
            <p className="book-detail-author">by <strong>{book.author}</strong></p>

            <div className="book-rating-section">
              <div className="rating-stars">
                {renderStars(book.rating)}
                <span className="rating-number">{book.rating}</span>
              </div>
              <span className="rating-reviews">({book.reviews} reviews)</span>
            </div>

            <div className="price-section">
              <div className="price-main">
                <span className="detail-current-price">₹{book.price}</span>
                {book.originalPrice > book.price && (
                  <>
                    <span className="detail-original-price">₹{book.originalPrice}</span>
                    <span className="savings-text">Save ₹{book.originalPrice - book.price}</span>
                  </>
                )}
              </div>
            </div>

            <div className="stock-section">
              {book.inStock ? (
                <span className="in-stock">✓ In Stock</span>
              ) : (
                <span className="out-of-stock">✗ Out of Stock</span>
              )}
            </div>

            <div className="quantity-section">
              <label className="quantity-label">Quantity:</label>
              <div className="quantity-controls">
                <button 
                  className="quantity-btn" 
                  onClick={() => handleQuantityChange('decrease')}
                  disabled={quantity === 1 || !book.inStock}
                >
                  -
                </button>
                <input 
                  type="text" 
                  className="quantity-input" 
                  value={quantity} 
                  readOnly 
                />
                <button 
                  className="quantity-btn" 
                  onClick={() => handleQuantityChange('increase')}
                  disabled={!book.inStock}
                >
                  +
                </button>
              </div>
            </div>

            <div className="action-buttons">
              <button 
                className="btn btn-add-cart" 
                onClick={handleAddToCart}
                disabled={!book.inStock}
              >
                {addedToCart ? '✓ Added to Cart' : 'Add to Cart'}
              </button>
              <button 
                className="btn btn-buy-now"
                disabled={!book.inStock}
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="book-description-section">
        <div className="description-card">
          <h2 className="section-title">Product Description</h2>
          <p className="description-text">{book.description}</p>
        </div>

        {book.features && book.features.length > 0 && (
          <div className="features-card">
            <h2 className="section-title">Key Features</h2>
            <ul className="features-list">
              {book.features.map((feature, index) => (
                <li key={index} className="feature-item">
                  <span className="feature-icon">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDetail;
