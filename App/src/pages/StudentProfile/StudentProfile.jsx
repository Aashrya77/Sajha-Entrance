import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';
import './StudentProfile.css';

const StudentProfile = ({ studentData, setStudentData, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(studentData || null);
  const [classData, setClassData] = useState({ liveClasses: [], recordedClasses: [] });
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/student/login');
      return;
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, classesRes] = await Promise.all([
        authAPI.getProfile(),
        authAPI.getClasses(),
      ]);

      if (profileRes.data.success) {
        setProfile(profileRes.data.data);
      }
      if (classesRes.data.success) {
        setClassData(classesRes.data.data);
        setIsPaid(classesRes.data.isPaid);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/student/login');
      }
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    if (setStudentData) setStudentData(null);
    if (setIsAuthenticated) setIsAuthenticated(false);
    navigate('/');
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  if (!profile) {
    return (
      <div className="container mt-5 pt-5 text-center">
        <h3>Please login to view your dashboard</h3>
        <button className="btn-primary mt-3" onClick={() => navigate('/student/login')}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="row">
          {/* Left: Profile Card */}
          <div className="col-lg-4 col-md-5">
            <div className="profile-card">
              <div className="profile-avatar">
                {profile.name?.charAt(0).toUpperCase()}
              </div>
              <h4>{profile.name}</h4>
              <p className="student-id">{profile.studentId}</p>
              <span className={`status-badge ${profile.accountStatus === 'Paid' ? 'paid' : 'unpaid'}`}>
                {profile.accountStatus}
              </span>

              <div style={{ marginTop: 20 }}>
                <div className="profile-info-row">
                  <span className="label">Email</span>
                  <span className="value">{profile.email}</span>
                </div>
                <div className="profile-info-row">
                  <span className="label">Phone</span>
                  <span className="value">{profile.phone || '—'}</span>
                </div>
                <div className="profile-info-row">
                  <span className="label">Course</span>
                  <span className="value">{profile.course}</span>
                </div>
                <div className="profile-info-row">
                  <span className="label">College</span>
                  <span className="value">{profile.collegeName || '—'}</span>
                </div>
                <div className="profile-info-row">
                  <span className="label">Address</span>
                  <span className="value">{profile.address || '—'}</span>
                </div>
              </div>

              <button className="logout-btn" onClick={handleLogout}>
                <i className="fa-solid fa-right-from-bracket me-2"></i>Logout
              </button>
            </div>
          </div>

          {/* Right: Dashboard Content */}
          <div className="col-lg-8 col-md-7">
            {/* Payment Banner (if unpaid) */}
            {!isPaid && (
              <div className="payment-banner">
                <i className="fa-solid fa-lock"></i>
                <div className="banner-text">
                  <h6>Payment Required</h6>
                  <p>Your account is unpaid. Complete payment to access Zoom class links and recorded classes. Contact admin or pay online.</p>
                </div>
              </div>
            )}

            {/* Classes Section */}
            <div className="dash-section">
              <h5><i className="fa-solid fa-chalkboard-user"></i> My Classes — {profile.course}</h5>

              <div className="dash-tabs">
                <button className={`dash-tab ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>
                  <i className="fa-solid fa-video me-1"></i> Live Classes
                </button>
                <button className={`dash-tab ${activeTab === 'recorded' ? 'active' : ''}`} onClick={() => setActiveTab('recorded')}>
                  <i className="fa-solid fa-play-circle me-1"></i> Recorded
                </button>
              </div>

              {/* Live Classes Tab */}
              {activeTab === 'live' && (
                <>
                  {classData.liveClasses.length === 0 ? (
                    <div className="empty-state">
                      <i className="fa-solid fa-calendar-xmark"></i>
                      <p>No classes scheduled for your course yet.</p>
                    </div>
                  ) : (
                    classData.liveClasses.map((cls) => (
                      <div className="class-card" key={cls.id}>
                        <div className="class-info">
                          <h6>{cls.classTitle}</h6>
                          <div className="class-meta">
                            <span><i className="fa-solid fa-book"></i> {cls.subject}</span>
                            <span><i className="fa-regular fa-calendar"></i> {formatDate(cls.classDateTime)}</span>
                            <span><i className="fa-regular fa-clock"></i> {formatTime(cls.classDateTime)}</span>
                            <span><i className="fa-solid fa-hourglass-half"></i> {cls.duration || 60} min</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className={`class-status ${cls.status === 'Live Now' ? 'live' : cls.status === 'Upcoming' ? 'upcoming' : 'completed'}`}>
                            {cls.status}
                          </span>
                          {cls.zoomMeetingLink ? (
                            <a href={cls.zoomMeetingLink} target="_blank" rel="noopener noreferrer" className="join-btn">
                              <i className="fa-solid fa-video"></i> Join
                            </a>
                          ) : (
                            <span className="join-btn locked" title={isPaid ? 'No link available' : 'Pay to unlock'}>
                              <i className="fa-solid fa-lock"></i> {isPaid ? 'No Link' : 'Locked'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* Recorded Classes Tab */}
              {activeTab === 'recorded' && (
                <>
                  {classData.recordedClasses.length === 0 ? (
                    <div className="empty-state">
                      <i className="fa-solid fa-film"></i>
                      <p>No recorded classes available yet.</p>
                    </div>
                  ) : (
                    classData.recordedClasses.map((cls) => (
                      <div className="class-card" key={cls.id}>
                        <div className="class-info">
                          <h6>{cls.topicName}</h6>
                          <div className="class-meta">
                            <span><i className="fa-solid fa-book"></i> {cls.subject}</span>
                            {cls.classDate && <span><i className="fa-regular fa-calendar"></i> {formatDate(cls.classDate)}</span>}
                            {cls.description && <span>{cls.description}</span>}
                          </div>
                        </div>
                        {cls.youtubeUrl ? (
                          <a href={cls.youtubeUrl} target="_blank" rel="noopener noreferrer" className="join-btn">
                            <i className="fa-brands fa-youtube"></i> Watch
                          </a>
                        ) : (
                          <span className="join-btn locked" title={isPaid ? 'No link' : 'Pay to unlock'}>
                            <i className="fa-solid fa-lock"></i> {isPaid ? 'No Link' : 'Locked'}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
