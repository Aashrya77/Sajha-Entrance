import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';

const BlogDetail = () => {
  const { id } = useParams();
  const [blogData, setBlogData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  if (!blogData || !blogData.blogData) {
    return <div className="container mt-5 text-center">Blog not found</div>;
  }

  const { blogData: blog, relatedBlogs } = blogData;

  return (
    <div className="blog-detail mt-5 pt-5">
      <div className="container">
        <div className="row">
          <div className="col-lg-8">
            <article className="blog-article">
              <h1 className="blog-title mb-3">{blog.blogTitle}</h1>
              
              <div className="blog-meta mb-4">
                <span className="blog-date">
                  <i className="fa-solid fa-calendar me-2"></i>
                  {new Date(blog.createdAt).toLocaleDateString()}
                </span>
                {blog.author && (
                  <span className="blog-author ms-3">
                    <i className="fa-solid fa-user me-2"></i>
                    {blog.author}
                  </span>
                )}
              </div>

              {blog.blogImage && (
                <img src={blog.blogImage} alt={blog.blogTitle} className="img-fluid mb-4 rounded" />
              )}

              <div className="blog-content" dangerouslySetInnerHTML={{ __html: blog.blogContent }} />
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
                            <img src={relatedBlog.blogImage} className="card-img-top" alt={relatedBlog.blogTitle} />
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
    </div>
  );
};

export default BlogDetail;
