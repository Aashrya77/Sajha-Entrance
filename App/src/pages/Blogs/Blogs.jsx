import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MessageCircle, Search, Send, Share2 } from 'lucide-react';
import { blogAPI } from '../../api/services';
import { getImageFieldUrl } from '../../utils/imageHelper';
import Loader from '../../components/Loader/Loader';
import '../../styles/blog.css';

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [previousPage, setPreviousPage] = useState(0);
  const [nextPage, setNextPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [shareModal, setShareModal] = useState({ isOpen: false, blogId: null, blogTitle: '', blogUrl: '' });

  useEffect(() => {
    fetchBlogs();
  }, [currentPage]);

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
      // The page already renders its request failure state.
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBlogs();
  };

  const openShareModal = (e, blog) => {
    e.preventDefault();
    e.stopPropagation(); // Prevents the Link click
    const blogUrl = `${window.location.origin}/blog/${blog.slug || blog._id}`;
    setShareModal({
      isOpen: true,
      blogId: blog._id,
      blogTitle: blog.blogTitle,
      blogUrl: blogUrl
    });
  };

  const closeShareModal = () => {
    setShareModal({ isOpen: false, blogId: null, blogTitle: '', blogUrl: '' });
  };

  const handleShare = (platform) => {
    const { blogTitle, blogUrl } = shareModal;
    const text = `Check out this blog: ${blogTitle}`;
    let shareUrl = '';

    switch(platform) {
      case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(blogUrl)}`; break;
      case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(blogUrl)}`; break;
      case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(blogUrl)}`; break;
      case 'whatsapp': shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + blogUrl)}`; break;
      case 'telegram': shareUrl = `https://t.me/share/url?url=${encodeURIComponent(blogUrl)}&text=${encodeURIComponent(text)}`; break;
      case 'pinterest': shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(blogUrl)}`; break;
      default: return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      closeShareModal();
    }
  };

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  return (
    <div className="blogs mt-5 pt-5">
      <div className="container-fluid px-4">
        <h1 className="text-uppercase mb-4 text-center" style={{ fontWeight: 900, color: 'var(--primary-orange)' }}>
          OUR <span style={{ color: 'var(--primary-black)' }}>BLOGS</span>
        </h1>

        {/* Search Bar */}
        <div className="blogs-search-wrap mb-5">
          <div className="blogs-search-shell">
            <form onSubmit={handleSearch} className="blogs-search-form">
              <span className="blogs-search-icon" aria-hidden="true">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="blogs-search-input"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="blogs-search-submit" aria-label="Search articles">
                <Search size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* 4-Column Grid: Updated bootstrap classes */}
        <div className="row g-4 mt-2">
          {blogs.map((blog) => (
            <div key={blog._id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
              <Link to={`/blog/${blog.slug || blog._id}`} className="blog-card-link">
                <div className="blog-card">
                  <div className="blog-card-image">
                    <img 
                      src={blog.blogImage ? getImageFieldUrl(blog, 'blogImage', 'blogs') : 'https://placehold.co/400x240?text=No+Image'} 
                      alt={blog.blogTitle} 
                      onError={(e) => { e.target.src = 'https://placehold.co/400x240?text=No+Image'; }}
                    />
                  </div>
                  
                  <div className="blog-card-content">
                    <h5 className="blog-title">{blog.blogTitle}</h5>
                    <p className="blog-excerpt">
                      {(blog.blogDescriptionUnformatted || (blog.blogDescriptionFormatted ? blog.blogDescriptionFormatted.replace(/<[^>]*>?/gm, '') : '')).substring(0, 90)}{((blog.blogDescriptionUnformatted || blog.blogDescriptionFormatted || '').length > 90) ? '...' : ''}
                    </p>
                    
                    {/* Meta Row: Date Left, Share Right */}
                    <div className="blog-meta">
                      <div className="blog-meta-left">
                        <span className="blog-date">
                          <CalendarDays size={15} aria-hidden="true" />
                          {new Date(blog.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button 
                        className="btn-share"
                        onClick={(e) => openShareModal(e, blog)}
                      >
                        <Share2 size={15} aria-hidden="true" />Share
                      </button>
                    </div>

                    {/* Read More: Aligned Right */}
                    <div className="text-end mt-2">
                       <span className="btn-read-more">
                         Read More <ArrowRight size={15} aria-hidden="true" />
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
          <ul className="pagination">
            {previousPage > 0 && (
              <li className="page-item">
                <button className="page-link" onClick={() => setCurrentPage(previousPage)}>Previous</button>
              </li>
            )}
            {nextPage > 0 && (
              <li className="page-item">
                <button className="page-link" onClick={() => setCurrentPage(nextPage)}>Next</button>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Share Modal remains same logic, just ensure CSS matches */}
      {shareModal.isOpen && (
        <div className="share-modal" onClick={closeShareModal}>
          <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h4>Share this Blog</h4>
              <button className="share-modal-close" onClick={closeShareModal}>&times;</button>
            </div>
            <div className="share-options">
              <button className="share-option" onClick={() => handleShare('facebook')}>
                <Share2 size={20} style={{color: '#1877f2'}} aria-hidden="true" />
                <span>Facebook</span>
              </button>
              <button className="share-option" onClick={() => handleShare('whatsapp')}>
                <MessageCircle size={20} style={{color: '#25d366'}} aria-hidden="true" />
                <span>WhatsApp</span>
              </button>
              <button className="share-option" onClick={() => handleShare('twitter')}>
                <Send size={20} style={{color: '#1da1f2'}} aria-hidden="true" />
                <span>Twitter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blogs;
