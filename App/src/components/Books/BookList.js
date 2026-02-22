import React, { useState } from 'react';
import BookCard from './BookCard';
import './BookList.css';

const BookList = ({ books, addToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', ...new Set(books.map(book => book.category))];

  const filteredBooks = selectedCategory === 'All' 
    ? books 
    : books.filter(book => book.category === selectedCategory);

  return (
    <div className="booklist-container">
      <div className="booklist-header">
        <h1 className="booklist-title">Sajha Entrance Book Store</h1>
        <p className="booklist-subtitle">Find the perfect study material for your entrance exam preparation</p>
      </div>

      <div className="filter-section">
        <div className="filter-container">
          <span className="filter-label">Filter by Category:</span>
          <div className="category-buttons">
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="books-grid">
        {filteredBooks.map(book => (
          <BookCard key={book.id} book={book} addToCart={addToCart} />
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="no-books">
          <p>No books found in this category.</p>
        </div>
      )}
    </div>
  );
};

export default BookList;
