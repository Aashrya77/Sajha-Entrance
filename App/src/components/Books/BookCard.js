import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BookCard.css';

const BookCard = ({ book, addToCart }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/book/${book.id}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(book);
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
    <div className="book-card" onClick={handleCardClick}>
      <div className="book-card-image-container">
        {book.discount > 0 && (
          <div className="discount-badge">-{book.discount}%</div>
        )}
        {!book.inStock && (
          <div className="out-of-stock-overlay">Out of Stock</div>
        )}
        <img src={book.image} alt={book.title} className="book-card-image" />
      </div>
      
      <div className="book-card-content">
        <h3 className="book-card-title">{book.title}</h3>
        <p className="book-card-author">by {book.author}</p>
        
        <div className="book-card-rating">
          <div className="stars">
            {renderStars(book.rating)}
          </div>
          <span className="rating-text">({book.reviews})</span>
        </div>

        <div className="book-card-price">
          <span className="current-price">₹{book.price}</span>
          {book.originalPrice > book.price && (
            <span className="original-price">₹{book.originalPrice}</span>
          )}
        </div>

        <button 
          className="add-to-cart-btn" 
          onClick={handleAddToCart}
          disabled={!book.inStock}
        >
          {book.inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
};

export default BookCard;
