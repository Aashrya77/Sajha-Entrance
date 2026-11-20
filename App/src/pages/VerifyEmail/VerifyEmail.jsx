import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { authAPI } from '../../api/services';

const VerifyEmail = () => {
  const { token } = useParams();
  const requestRef = useRef(null);
  const requestSequence = useRef(0);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const requestId = ++requestSequence.current;
    setStatus('loading');
    setMessage('Verifying your email...');

    if (!requestRef.current || requestRef.current.token !== token) {
      requestRef.current = {
        token,
        promise: authAPI.verifyEmail(token),
      };
    }

    requestRef.current.promise
      .then((response) => {
        if (requestSequence.current === requestId) {
          setStatus('success');
          setMessage(response.data.message || 'Email verified. You can now log in.');
        }
      })
      .catch((error) => {
        if (requestSequence.current === requestId) {
          setStatus('error');
          setMessage(
            error.response?.data?.error ||
              'We could not verify this email. The link may have expired; request a new one from the login page.'
          );
        }
      });

    return () => {
      if (requestSequence.current === requestId) {
        requestSequence.current += 1;
      }
    };
  }, [token]);

  return (
    <main className="login-page-wrapper d-flex align-items-center justify-content-center min-vh-100 px-3 py-5">
      <section className="login-card w-100 text-center" style={{ maxWidth: '460px' }}>
        <h1 className="login-title">
          {status === 'loading'
            ? 'Verifying email'
            : status === 'success'
              ? 'Email verified'
              : 'Verification failed'}
        </h1>
        <p className="login-subtitle mb-4" role={status === 'error' ? 'alert' : 'status'}>
          {message}
        </p>
        {status !== 'loading' && (
          <Link
            to="/student/login"
            className="btn text-white"
            style={{ backgroundColor: 'var(--primary-orange)' }}
          >
            Go to login
          </Link>
        )}
      </section>
    </main>
  );
};

export default VerifyEmail;