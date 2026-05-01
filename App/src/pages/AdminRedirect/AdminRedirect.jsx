import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resolveAdminUrl } from '../../api/config';

const AdminRedirect = () => {
  const adminUrl = resolveAdminUrl();

  useEffect(() => {
    if (!adminUrl) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      window.location.replace(adminUrl);
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [adminUrl]);

  return (
    <div className="not-found-page mt-5 pt-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-7 text-center">
            <h1 style={{ fontSize: '4.5rem', color: 'var(--primary-orange)' }}>Admin</h1>
            <h2 className="mb-3">Redirecting to Admin Portal</h2>
            <p className="mb-4">
              {adminUrl
                ? 'Taking you to the production admin portal now.'
                : 'This frontend host is not configured to open the admin portal directly yet.'}
            </p>
            {adminUrl ? (
              <a href={adminUrl} className="btn-primary">
                Open Admin Portal
              </a>
            ) : (
              <Link to="/" className="btn-primary">
                Go to Homepage
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRedirect;
