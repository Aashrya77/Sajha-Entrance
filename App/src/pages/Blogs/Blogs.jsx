import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [previousPage, setPreviousPage] = useState(0);
  const [nextPage, setNextPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, [currentPage]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const fetchBlogs = async () => {
    try {
      const response = await blogAPI.getAllBlogs(currentPage, searchTerm);
      if (response.data.success) {
        setBlogs(response.data.data.blogs || []);
        setPreviousPage(response.data.data.previousPage || 0);
        setNextPage(response.data.data.nextPage || 0);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBlogs();
  };

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  return (
    <div className="blogs mt-5 pt-5">
      <div className="container-fluid">
        <h1 className="text-uppercase mb-4 text-center" style={{fontWeight: 900, color: 'var(--primary-orange)'}}>
          OUR <span style={{color: 'var(--primary-black)'}}>BLOGS</span>
        </h1>

        {/* Search Bar */}
        <div className="row justify-content-center mb-4">
          <div className="col-md-6">
            <form onSubmit={handleSearch} className="d-flex">
              <input
                type="text"
                className="form-control me-2"
                placeholder="Search blogs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                <i className="fa-solid fa-search"></i>
              </button>
            </form>
          </div>
        </div>

        <div className="row g-4 mt-4">
          {blogs.map((blog) => (
            <div key={blog._id} className="col-12 col-md-6 col-lg-4">
              <Link to={`/blog/${blog._id}`} className="blog-card-link">
                <div className="blog-card">
                  {blog.blogImage && (
                    <div className="blog-card-image">
                      <img src={blog.blogImage} alt={blog.blogTitle} />
                    </div>
                  )}
                  <div className="blog-card-content">
                    <h5 className="blog-title">{blog.blogTitle}</h5>
                    <p className="blog-excerpt">
                      {blog.blogContent ? blog.blogContent.substring(0, 150) + '...' : ''}
                    </p>
                    <div className="blog-meta">
                      <span className="blog-date">
                        <i className="fa-solid fa-calendar me-2"></i>
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="pagination-wrapper mt-5">
          <nav aria-label="Page navigation">
            <ul className="pagination justify-content-center">
              {previousPage > 0 && (
                <li className="page-item">
                  <button className="page-link" onClick={() => setCurrentPage(previousPage)}>
                    Previous
                  </button>
                </li>
              )}
              {nextPage > 0 && (
                <li className="page-item">
                  <button className="page-link" onClick={() => setCurrentPage(nextPage)}>
                    Next
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Blogs;
