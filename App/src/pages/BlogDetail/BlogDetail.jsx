import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { blogAPI } from '../../api/services';
import { getImageUrl } from '../../utils/imageHelper';
import Loader from '../../components/Loader/Loader';
import '../../../public/css/blog.css';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blogData, setBlogData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareModal, setShareModal] = useState({ isOpen: false, blogTitle: '', blogUrl: '' });

  useEffect(() => {
    fetchBlogDetail();
  }, [id]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const fetchBlogDetail = async () => {
    try {
      const response = await blogAPI.getBlogById(id);
      if (response.data.success) {
        setBlogData(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching blog details:', error);
      setLoading(false);
    }
  };

  const openShareModal = () => {
    const blogUrl = window.location.href;
    const blogData_ = blogData.blogData;
    setShareModal({
      isOpen: true,
      blogTitle: blogData_.blogTitle,
      blogUrl: blogUrl
    });
  };

  const closeShareModal = () => {
    setShareModal({ isOpen: false, blogTitle: '', blogUrl: '' });
  };

  const handleShare = (platform) => {
    const { blogTitle, blogUrl } = shareModal;
    const text = `Check out this blog: ${blogTitle}`;
    let shareUrl = '';

    switch(platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(blogUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(blogUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(blogUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + blogUrl)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(blogUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(blogUrl)}`;
        break;
      default:
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      closeShareModal();
    }
  };

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  if (!blogData || !blogData.blogData) {
    return <div className="container mt-5 text-center">Blog not found</div>;
  }

  const { blogData: blog, relatedBlogs } = blogData;

  return (
    <div className="blog-detail mt-5 pt-5">
      <div className="container-fluid">
        <div className="mb-4">
          <button 
            onClick={() => navigate(-1)} 
            className="btn-back-to-blogs"
          >
            <i className="fa-solid fa-arrow-left me-2"></i>
            Back to Blogs
          </button>
        </div>
        <div className="row">
          <div className="col-lg-8">
            <article className="blog-article">
              <h1 className="blog-title mb-3">{blog.blogTitle}</h1>
              
              <div className="blog-meta mb-4">
                <span className="blog-date">
                  <i className="fa-solid fa-calendar"></i>
                  {new Date(blog.createdAt).toLocaleDateString()}
                </span>
                {blog.author && (
                  <span className="blog-author">
                    <i className="fa-solid fa-user"></i>
                    {blog.author}
                  </span>
                )}
                <button 
                  className="article-share-btn"
                  onClick={openShareModal}
                  title="Share this blog"
                >
                  <i className="fa-solid fa-share-nodes"></i>
                  Share
                </button>
              </div>

              {blog.blogImage && (
                <img src={getImageUrl(blog.blogImage, 'blogs')} alt={blog.blogTitle} className="img-fluid mb-4 rounded" />
              )}

              <div className="blog-content" dangerouslySetInnerHTML={{ __html: blog.blogDescriptionFormatted || blog.blogDescriptionUnformatted || '' }} />
            </article>
          </div>

          <div className="col-lg-4">
            <div className="blog-sidebar">
              {relatedBlogs && relatedBlogs.length > 0 && (
                <div className="related-blogs">
                  <h4 className="mb-3">Related Blogs</h4>
                  {relatedBlogs.map((relatedBlog) => (
                    <div key={relatedBlog._id} className="related-blog-item mb-3">
                      <Link to={`/blog/${relatedBlog._id}`} className="text-decoration-none">
                        <div className="card">
                          {relatedBlog.blogImage && (
                            <img src={getImageUrl(relatedBlog.blogImage, 'blogs')} className="card-img-top" alt={relatedBlog.blogTitle} />
                          )}
                          <div className="card-body">
                            <h6 className="card-title">{relatedBlog.blogTitle}</h6>
                            <p className="card-text small text-muted">
                              {new Date(relatedBlog.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {shareModal.isOpen && (
        <div className="share-modal" onClick={closeShareModal}>
          <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h4>Share this Blog</h4>
              <button className="share-modal-close" onClick={closeShareModal}>
                ×
              </button>
            </div>
            <div className="share-options">
              <button 
                className="share-option share-facebook"
                onClick={() => handleShare('facebook')}
                title="Share on Facebook"
              >
                <i className="fa-brands fa-facebook-f"></i>
                <span>Facebook</span>
              </button>
              <button 
                className="share-option share-twitter"
                onClick={() => handleShare('twitter')}
                title="Share on Twitter"
              >
                <i className="fa-brands fa-twitter"></i>
                <span>Twitter</span>
              </button>
              <button 
                className="share-option share-linkedin"
                onClick={() => handleShare('linkedin')}
                title="Share on LinkedIn"
              >
                <i className="fa-brands fa-linkedin-in"></i>
                <span>LinkedIn</span>
              </button>
              <button 
                className="share-option share-whatsapp"
                onClick={() => handleShare('whatsapp')}
                title="Share on WhatsApp"
              >
                <i className="fa-brands fa-whatsapp"></i>
                <span>WhatsApp</span>
              </button>
              <button 
                className="share-option share-telegram"
                onClick={() => handleShare('telegram')}
                title="Share on Telegram"
              >
                <i className="fa-brands fa-telegram"></i>
                <span>Telegram</span>
              </button>
              <button 
                className="share-option share-pinterest"
                onClick={() => handleShare('pinterest')}
                title="Share on Pinterest"
              >
                <i className="fa-brands fa-pinterest-p"></i>
                <span>Pinterest</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogDetail;
