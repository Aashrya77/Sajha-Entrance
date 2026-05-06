import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API, {
  ADMIN_ROOT_PATH,
  buildAdminUrl,
  isLocalUrl,
  resolveAdminRouteUrl,
  resolveAdminUrl,
} from '../../api/config';

const ADMIN_HARD_RELOAD_KEY = 'sajha-admin-hard-reload';
const normalizeUrl = (value = '') => String(value || '').replace(/\/+$/g, '');

const AdminRedirect = () => {
  const [adminUrl, setAdminUrl] = useState(() => resolveAdminUrl());
  const [isResolving, setIsResolving] = useState(() => !resolveAdminUrl());
  const [statusMessage, setStatusMessage] = useState('');

  const currentRouteUrl = useMemo(
    () => normalizeUrl(`${window.location.origin}${window.location.pathname}`),
    []
  );

  useEffect(() => {
    if (adminUrl) {
      const normalizedAdminUrl = normalizeUrl(adminUrl);
      const hasAttemptedHardReload =
        window.sessionStorage.getItem(ADMIN_HARD_RELOAD_KEY) === currentRouteUrl;

      if (normalizedAdminUrl === currentRouteUrl && hasAttemptedHardReload) {
        setStatusMessage(
          'The /sajha-admin route is still being served by the public app after a hard reload. Point /sajha-admin to the backend AdminJS server in production.'
        );
        setIsResolving(false);
        return undefined;
      }

      if (normalizedAdminUrl === currentRouteUrl) {
        window.sessionStorage.setItem(ADMIN_HARD_RELOAD_KEY, currentRouteUrl);
      } else {
        window.sessionStorage.removeItem(ADMIN_HARD_RELOAD_KEY);
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
        const discoveredAdminUrl = healthData.adminUrl || buildAdminUrl(healthData.backendUrl || '');
        const sameOriginAdminUrl = resolveAdminRouteUrl(
          healthData.adminRootPath || ADMIN_ROOT_PATH
        );
        const shouldPreferSameOriginAdminUrl =
          Boolean(sameOriginAdminUrl) &&
          (!discoveredAdminUrl ||
            (isLocalUrl(discoveredAdminUrl) && !isLocalUrl(window.location.origin)));

        if (!isActive) {
          return;
        }

        if (shouldPreferSameOriginAdminUrl) {
          setAdminUrl(sameOriginAdminUrl);
          return;
        }

        if (discoveredAdminUrl) {
          setAdminUrl(discoveredAdminUrl);
          return;
        }

        if (sameOriginAdminUrl) {
          setAdminUrl(sameOriginAdminUrl);
          return;
        }

        setStatusMessage(
          'This frontend host is not configured to open the admin portal directly yet.'
        );
      } catch (_error) {
        if (!isActive) {
          return;
        }

        const fallbackAdminUrl = resolveAdminRouteUrl();

        if (fallbackAdminUrl) {
          setAdminUrl(fallbackAdminUrl);
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
