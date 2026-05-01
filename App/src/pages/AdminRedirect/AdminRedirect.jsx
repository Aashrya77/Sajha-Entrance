import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { buildAdminUrl, resolveAdminUrl } from '../../api/config';

const AdminRedirect = () => {
  const [adminUrl, setAdminUrl] = useState(() => resolveAdminUrl());
  const [isResolving, setIsResolving] = useState(() => !resolveAdminUrl());
  const [statusMessage, setStatusMessage] = useState('');

  const currentRouteUrl = useMemo(
    () => `${window.location.origin}${window.location.pathname}`.replace(/\/+$/g, ''),
    []
  );

  useEffect(() => {
    if (adminUrl) {
      const normalizedAdminUrl = adminUrl.replace(/\/+$/g, '');

      if (normalizedAdminUrl === currentRouteUrl) {
        setStatusMessage(
          'The admin route resolves to this same frontend host, but production is still serving the public app here. The host needs a rewrite or proxy for /sajha-admin.'
        );
        setIsResolving(false);
        return undefined;
      }

      const timeoutId = window.setTimeout(() => {
        window.location.replace(adminUrl);
      }, 150);

      return () => window.clearTimeout(timeoutId);
    }

    let isActive = true;

    const discoverAdminUrl = async () => {
      try {
        const response = await API.get('/health');
        const healthData = response?.data?.data || {};
        const discoveredAdminUrl =
          healthData.adminUrl || buildAdminUrl(healthData.backendUrl || '');

        if (!isActive) {
          return;
        }

        if (discoveredAdminUrl) {
          setAdminUrl(discoveredAdminUrl);
          return;
        }

        setStatusMessage(
          'This frontend host is not configured to open the admin portal directly yet.'
        );
      } catch (_error) {
        if (!isActive) {
          return;
        }

        setStatusMessage(
          'The admin portal could not be discovered from the API. Add VITE_ADMIN_URL or expose BACKEND_URL from the server health response.'
        );
      } finally {
        if (isActive) {
          setIsResolving(false);
        }
      }
    };

    void discoverAdminUrl();

    return () => {
      isActive = false;
    };
  }, [adminUrl, currentRouteUrl]);

  return (
    <div className="not-found-page mt-5 pt-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-7 text-center">
            <h1 style={{ fontSize: '4.5rem', color: 'var(--primary-orange)' }}>Admin</h1>
            <h2 className="mb-3">Redirecting to Admin Portal</h2>
            <p className="mb-4">
              {adminUrl && !statusMessage
                ? 'Taking you to the production admin portal now.'
                : isResolving
                  ? 'Checking the backend for the live admin portal URL.'
                  : statusMessage || 'This frontend host is not configured to open the admin portal directly yet.'}
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
