import React, { useState, useEffect } from 'react';
import './Maintenance.css';

const Maintenance = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Set maintenance end time to 2 hours from now
    const maintenanceEndTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = maintenanceEndTime - now;

      if (distance < 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({
          hours: String(hours).padStart(2, '0'),
          minutes: String(minutes).padStart(2, '0'),
          seconds: String(seconds).padStart(2, '0'),
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="maintenance-container">
      <div className="maintenance-content">
        <div className="maintenance-logo-section">
          <img src="/img/logo-main.png" alt="Sajha Logo" className="maintenance-logo" />
        </div>
        
        <h1 className="maintenance-title">We'll Be Right Back!</h1>
        <p className="maintenance-subtitle">Our website is currently under maintenance</p>

        <div className="maintenance-loader"></div>

        <p className="maintenance-message">
          We're working hard to bring you an improved experience. We apologize for any inconvenience and appreciate your patience.
        </p>

        <div className="maintenance-timer">
          <div className="timer-box">
            <div className="timer-value">{timeLeft.hours}</div>
            <div className="timer-label">Hours</div>
          </div>
          <div className="timer-box">
            <div className="timer-value">{timeLeft.minutes}</div>
            <div className="timer-label">Minutes</div>
          </div>
          <div className="timer-box">
            <div className="timer-value">{timeLeft.seconds}</div>
            <div className="timer-label">Seconds</div>
          </div>
        </div>

        <div className="contact-section">
          <h3>Questions?</h3>
          <p>📧 Email: support@sajha.com</p>
          <p>📱 Call us: +977-1-234-5678</p>
          <p className="contact-note">We'll be back online shortly!</p>
        </div>

        <div className="social-links">
          <a href="https://facebook.com" title="Facebook" target="_blank" rel="noopener noreferrer">f</a>
          <a href="https://twitter.com" title="Twitter" target="_blank" rel="noopener noreferrer">𝕏</a>
          <a href="https://instagram.com" title="Instagram" target="_blank" rel="noopener noreferrer">📷</a>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
