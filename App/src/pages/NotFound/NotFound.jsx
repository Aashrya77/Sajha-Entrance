import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="not-found-page mt-5 pt-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <h1 style={{fontSize: '6rem', color: 'var(--primary-orange)'}}>404</h1>
            <h2 className="mb-3">Page Not Found</h2>
            <p className="mb-4">The page you are looking for doesn't exist or has been moved.</p>
            <Link to="/" className="btn-primary">
              <i className="fa-solid fa-home me-2"></i>Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
