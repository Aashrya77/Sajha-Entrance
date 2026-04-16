import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';
import {
  canSwitchStudentCourse,
  NEB_PREPARATION_COURSE,
  STUDENT_COURSE_OPTIONS,
} from '../../constants/studentCourses';
import './StudentProfile.css';

const buildEditForm = (profile = {}) => ({
  name: profile.name || '',
  phone: profile.phone || '',
  collegeName: profile.collegeName || '',
  address: profile.address || '',
  course: profile.course || '',
});

const getInitials = (name = '') => {
  const words = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!words.length) {
    return 'SE';
  }

  return words.map((word) => word.charAt(0).toUpperCase()).join('');
};

const formatDate = (dateStr) => {
  if (!dateStr) {
    return 'Date TBD';
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return 'Date TBD';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) {
    return 'Time TBD';
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return 'Time TBD';
  }

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatJoinedDate = (dateStr) => {
  if (!dateStr) {
    return 'Recently joined';
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return 'Recently joined';
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

const getRecordedContentType = (recordedClass = {}) =>
  recordedClass.contentType === 'playlist' || recordedClass.playlistId ? 'playlist' : 'video';

const buildYoutubeEmbedUrl = (recordedClass = {}) => {
  const contentType = getRecordedContentType(recordedClass);
  const videoId = String(recordedClass.videoId || '').trim();
  const playlistId = String(recordedClass.playlistId || '').trim();
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
  });

  if (contentType === 'playlist' && playlistId) {
    params.set('list', playlistId);

    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
    }

    return `https://www.youtube-nocookie.com/embed/videoseries?${params.toString()}`;
  }

  if (!videoId) {
    return '';
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
};

const createRecordedViewerState = () => ({
  isOpen: false,
  loading: false,
  error: '',
  classItem: null,
  playlistTitle: '',
  playlistVideos: [],
  selectedVideoId: '',
});

const StudentProfile = ({ studentData, setStudentData, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(studentData || null);
  const [classData, setClassData] = useState({ liveClasses: [], recordedClasses: [] });
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(buildEditForm(studentData || {}));
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState('');
  const [pageMessage, setPageMessage] = useState(null);
  const [recordedViewer, setRecordedViewer] = useState(createRecordedViewerState);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/student/login');
      return;
    }

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (profile) {
      setEditForm(buildEditForm(profile));
    }
  }, [profile]);

  useEffect(() => {
    if (!isEditOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsEditOpen(false);
        setEditError('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditOpen]);

  useEffect(() => {
    if (!recordedViewer.isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setRecordedViewer(createRecordedViewerState());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordedViewer.isOpen]);

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
    if (setStudentData) {
      setStudentData(null);
    }
    if (setIsAuthenticated) {
      setIsAuthenticated(false);
    }
    navigate('/');
  };

  const openEditModal = () => {
    setEditForm(buildEditForm(profile));
    setEditError('');
    setPageMessage(null);
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditError('');
    setEditForm(buildEditForm(profile));
  };

  const closeRecordedViewer = () => {
    setRecordedViewer(createRecordedViewerState());
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setEditError('');

    try {
      const response = await authAPI.updateProfile(editForm);
      if (response.data.success) {
        const updatedProfile = response.data.data;
        setProfile(updatedProfile);
        if (setStudentData) {
          setStudentData((current) => ({
            ...(current || {}),
            id: updatedProfile.id,
            studentId: updatedProfile.studentId,
            name: updatedProfile.name,
            email: updatedProfile.email,
            course: updatedProfile.course,
            accountStatus: updatedProfile.accountStatus,
          }));
        }

        setPageMessage({
          type: 'success',
          text: 'Your profile details have been updated successfully.',
        });
        setIsEditOpen(false);
      }
    } catch (error) {
      const message =
        error.response?.data?.error || 'Unable to update your profile right now.';
      setEditError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRecordedClassOpen = async (recordedClass) => {
    if (!recordedClass?.youtubeUrl) {
      return;
    }

    const contentType = getRecordedContentType(recordedClass);

    setRecordedViewer({
      isOpen: true,
      loading: contentType === 'playlist',
      error: '',
      classItem: recordedClass,
      playlistTitle: recordedClass.topicName || 'Recorded Playlist',
      playlistVideos: [],
      selectedVideoId: recordedClass.videoId || '',
    });

    if (contentType !== 'playlist') {
      return;
    }

    try {
      const response = await authAPI.getRecordedClassDetails(recordedClass.id);
      const details = response.data || {};
      const playlistVideos = Array.isArray(details.playlist?.videos) ? details.playlist.videos : [];

      setRecordedViewer({
        isOpen: true,
        loading: false,
        error: '',
        classItem: {
          ...recordedClass,
          ...details,
        },
        playlistTitle:
          details.playlist?.title || details.topicName || recordedClass.topicName || 'Playlist',
        playlistVideos,
        selectedVideoId:
          details.videoId || playlistVideos[0]?.videoId || recordedClass.videoId || '',
      });
    } catch (error) {
      console.error('Error loading recorded class details:', error);

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/student/login');
        return;
      }

      const message =
        error.response?.data?.error || 'We could not load this playlist right now.';

      setRecordedViewer((current) => ({
        ...current,
        loading: false,
        error: message,
      }));
    }
  };

  const handlePlaylistVideoSelect = (videoId) => {
    setRecordedViewer((current) => ({
      ...current,
      selectedVideoId: videoId,
    }));
  };

  if (loading) {
    return (
      <div className="container mt-5 pt-5 d-flex justify-content-center">
        <Loader />
      </div>
    );
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

  const overviewItems = [
    {
      label: 'Email Address',
      value: profile.email,
      icon: 'fa-regular fa-envelope',
    },
    {
      label: 'Phone Number',
      value: profile.phone || 'Not provided',
      icon: 'fa-solid fa-phone',
    },
    {
      label: 'College',
      value: profile.collegeName || 'Not provided',
      icon: 'fa-solid fa-building-columns',
    },
    {
      label: 'Address',
      value: profile.address || 'Not provided',
      icon: 'fa-solid fa-location-dot',
    },
  ];

  const snapshotItems = [
    {
      label: 'Current Course',
      value: profile.course || 'Not assigned',
      icon: 'fa-solid fa-graduation-cap',
    },
    {
      label: 'Access Status',
      value: profile.accountStatus || 'Unpaid',
      icon: isPaid ? 'fa-solid fa-circle-check' : 'fa-solid fa-lock',
    },
    {
      label: 'Live Classes',
      value: classData.liveClasses.length,
      icon: 'fa-solid fa-video',
    },
    {
      label: 'Recorded Lessons',
      value: classData.recordedClasses.length,
      icon: 'fa-solid fa-circle-play',
    },
  ];

  const recordedViewerType = getRecordedContentType(recordedViewer.classItem || {});
  const recordedViewerEmbedUrl = recordedViewer.classItem
    ? buildYoutubeEmbedUrl({
        ...recordedViewer.classItem,
        videoId: recordedViewer.selectedVideoId || recordedViewer.classItem.videoId,
      })
    : '';
  const isCourseEditable = canSwitchStudentCourse(profile.course);

  return (
    <div className="student-dashboard">
      <div className="container">
        <div className="student-dashboard-shell">
          <section className="student-hero">
            <div className="student-hero__content">
              <div className="student-hero__identity">
                <div className="student-avatar">{getInitials(profile.name)}</div>
                <div className="student-hero__copy">
                  <span className="student-hero__eyebrow">Sajha Entrance Student Workspace</span>
                  <h1 className="student-hero__title">{profile.name}</h1>
                  <div className="student-hero__meta">
                    <span className="student-meta-pill">
                      <i className="fa-solid fa-graduation-cap"></i>
                      {profile.course || 'Course not assigned'}
                    </span>
                    <span
                      className={`student-meta-pill student-meta-pill--status ${
                        profile.accountStatus === 'Paid' ? 'is-paid' : 'is-unpaid'
                      }`}
                    >
                      <i
                        className={
                          profile.accountStatus === 'Paid'
                            ? 'fa-solid fa-circle-check'
                            : 'fa-solid fa-clock'
                        }
                      ></i>
                      {profile.accountStatus || 'Unpaid'}
                    </span>
                    <span className="student-meta-pill">
                      <i className="fa-regular fa-calendar"></i>
                      Joined {formatJoinedDate(profile.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="student-hero__actions">
                <button className="hero-action-btn" onClick={openEditModal}>
                  <i className="fa-solid fa-pen-to-square"></i>
                  Edit Profile
                </button>
              </div>
            </div>
          </section>

          {pageMessage && (
            <div className={`dashboard-inline-alert ${pageMessage.type || 'success'}`}>
              <i
                className={
                  pageMessage.type === 'error'
                    ? 'fa-solid fa-circle-exclamation'
                    : 'fa-solid fa-circle-check'
                }
              ></i>
              <span>{pageMessage.text}</span>
            </div>
          )}

          <section className="student-overview-grid">
            <div className="student-sidebar">
              <article className="dashboard-card">
                <div className="dashboard-card__section">
                  <div className="dashboard-card__header">
                    <div>
                      <p className="dashboard-card__eyebrow">Student Details</p>
                      <h2 className="dashboard-card__title">Personal Details</h2>
                    </div>
                  </div>

                  <div className="student-detail-panel">
                    {overviewItems.map((item) => (
                      <div className="student-detail-row" key={item.label}>
                        <div className="student-detail-row__icon">
                          <i className={item.icon}></i>
                        </div>
                        <span className="student-detail-row__label">{item.label}</span>
                        <span className="student-detail-row__separator">:</span>
                        <strong className="student-detail-row__value">{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dashboard-card__section dashboard-card__section--divider">
                  <div className="dashboard-card__header">
                    <div>
                      <p className="dashboard-card__eyebrow">Dashboard Snapshot</p>
                      <h2 className="dashboard-card__title">Learning Overview</h2>
                    </div>
                  </div>

                  <div className="student-overview-panel">
                    {snapshotItems.map((item) => (
                      <div className="student-overview-metric" key={item.label}>
                        <div className="student-overview-metric__meta">
                          <div className="student-overview-metric__icon">
                            <i className={item.icon}></i>
                          </div>
                          <span className="student-overview-metric__label">{item.label}</span>
                        </div>
                        <strong className="student-overview-metric__value">{item.value}</strong>
                      </div>
                    ))}
                  </div>

                  <button className="logout-btn" onClick={handleLogout}>
                    <i className="fa-solid fa-right-from-bracket"></i>
                    Logout
                  </button>
                </div>
              </article>
            </div>

            <div className="student-main-column">
              {!isPaid && (
                <div className="payment-banner">
                  <div className="payment-banner__icon">
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <div className="payment-banner__copy">
                    <h3>Unlock full class access</h3>
                    <p>
                      Your account is currently unpaid. Complete payment to unlock Zoom links
                      and recorded classes for your course.
                    </p>
                  </div>
                </div>
              )}

              <article className="dashboard-card classes-card">
                <div className="dashboard-card__header dashboard-card__header--classes">
                  <div>
                    <p className="dashboard-card__eyebrow">Classroom Access</p>
                    <h2 className="dashboard-card__title">My Classes</h2>
                    <p className="dashboard-card__description">
                      All your live sessions and recorded lessons for {profile.course}.
                    </p>
                  </div>
                </div>

                <div className="dash-tabs">
                  <button
                    className={`dash-tab ${activeTab === 'live' ? 'active' : ''}`}
                    onClick={() => setActiveTab('live')}
                  >
                    <i className="fa-solid fa-video"></i>
                    Live Classes
                  </button>
                  <button
                    className={`dash-tab ${activeTab === 'recorded' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recorded')}
                  >
                    <i className="fa-solid fa-circle-play"></i>
                    Recorded Classes
                  </button>
                </div>

                {activeTab === 'live' && (
                  <div className="class-list">
                    {classData.liveClasses.length === 0 ? (
                      <div className="empty-state">
                        <i className="fa-solid fa-calendar-xmark"></i>
                        <h3>No live classes scheduled yet</h3>
                        <p>Your course timetable will appear here once sessions are published.</p>
                      </div>
                    ) : (
                      classData.liveClasses.map((cls) => (
                        <div className="dashboard-class-card" key={cls.id}>
                          <div className="dashboard-class-card__icon is-live">
                            <i className="fa-solid fa-chalkboard-user"></i>
                          </div>

                          <div className="dashboard-class-card__content">
                            <div className="dashboard-class-card__topline">
                              <span className="dashboard-class-chip">Live Session</span>
                              <span
                                className={`class-status ${
                                  cls.status === 'Live Now'
                                    ? 'live'
                                    : cls.status === 'Upcoming'
                                    ? 'upcoming'
                                    : 'completed'
                                }`}
                              >
                                {cls.status}
                              </span>
                            </div>

                            <h3>{cls.classTitle}</h3>

                            <div className="class-meta">
                              <span>
                                <i className="fa-solid fa-book"></i>
                                {cls.subject}
                              </span>
                              <span>
                                <i className="fa-regular fa-calendar"></i>
                                {formatDate(cls.classDateTime)}
                              </span>
                              <span>
                                <i className="fa-regular fa-clock"></i>
                                {formatTime(cls.classDateTime)}
                              </span>
                              <span>
                                <i className="fa-solid fa-hourglass-half"></i>
                                {cls.duration || 60} min
                              </span>
                            </div>
                          </div>

                          <div className="dashboard-class-card__actions">
                            {cls.zoomMeetingLink ? (
                              <a
                                href={cls.zoomMeetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="join-btn"
                              >
                                <i className="fa-solid fa-video"></i>
                                Join
                              </a>
                            ) : (
                              <span
                                className="join-btn locked"
                                title={isPaid ? 'No link available' : 'Pay to unlock'}
                              >
                                <i className="fa-solid fa-lock"></i>
                                {isPaid ? 'No Link' : 'Locked'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'recorded' && (
                  <div className="class-list">
                    {classData.recordedClasses.length === 0 ? (
                      <div className="empty-state">
                        <i className="fa-solid fa-film"></i>
                        <h3>No recorded lessons yet</h3>
                        <p>Your recorded library will appear here after classes are published.</p>
                      </div>
                    ) : (
                      classData.recordedClasses.map((cls) => (
                        <div className="dashboard-class-card" key={cls.id}>
                          <div className="dashboard-class-card__icon is-recorded">
                            <i
                              className={
                                getRecordedContentType(cls) === 'playlist'
                                  ? 'fa-solid fa-list-ul'
                                  : 'fa-solid fa-circle-play'
                              }
                            ></i>
                          </div>

                          <div className="dashboard-class-card__content">
                            <div className="dashboard-class-card__topline">
                              <span className="dashboard-class-chip">
                                {getRecordedContentType(cls) === 'playlist'
                                  ? 'Recorded Playlist'
                                  : 'Recorded Lesson'}
                              </span>
                            </div>

                            <h3>{cls.topicName}</h3>

                            <div className="class-meta">
                              <span>
                                <i className="fa-solid fa-book"></i>
                                {cls.subject}
                              </span>
                              {cls.classDate && (
                                <span>
                                  <i className="fa-regular fa-calendar"></i>
                                  {formatDate(cls.classDate)}
                                </span>
                              )}
                              {cls.description && (
                                <span>
                                  <i className="fa-regular fa-note-sticky"></i>
                                  {cls.description}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="dashboard-class-card__actions">
                            {cls.youtubeUrl ? (
                              <button
                                type="button"
                                className="join-btn"
                                onClick={() => handleRecordedClassOpen(cls)}
                              >
                                <i
                                  className={
                                    getRecordedContentType(cls) === 'playlist'
                                      ? 'fa-solid fa-list-check'
                                      : 'fa-brands fa-youtube'
                                  }
                                ></i>
                                {getRecordedContentType(cls) === 'playlist'
                                  ? 'Open Playlist'
                                  : 'Watch Here'}
                              </button>
                            ) : (
                              <span
                                className="join-btn locked"
                                title={isPaid ? 'No link available' : 'Pay to unlock'}
                              >
                                <i className="fa-solid fa-lock"></i>
                                {isPaid ? 'No Link' : 'Locked'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </article>
            </div>
          </section>
        </div>
      </div>

      {isEditOpen && (
        <div
          className="profile-modal-backdrop"
          role="presentation"
          onClick={closeEditModal}
        >
          <div
            className="profile-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-modal-header">
              <div>
                <p className="profile-modal__eyebrow">Update your details</p>
                <h2 id="edit-profile-title">Edit Profile</h2>
              </div>
              <button className="profile-modal-close" onClick={closeEditModal} type="button">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {editError && (
              <div className="dashboard-inline-alert error">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{editError}</span>
              </div>
            )}

            <form className="profile-modal-form" onSubmit={handleProfileUpdate}>
              <div className="profile-modal-grid">
                <label className="profile-field">
                  <span>Full Name</span>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    required
                  />
                </label>

                <label className="profile-field">
                  <span>Phone Number</span>
                  <input
                    type="text"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditChange}
                    placeholder="Enter your phone number"
                  />
                </label>

                <label className="profile-field">
                  <span>College Name</span>
                  <input
                    type="text"
                    name="collegeName"
                    value={editForm.collegeName}
                    onChange={handleEditChange}
                    placeholder="Enter your college"
                  />
                </label>

                {isCourseEditable ? (
                  <label className="profile-field">
                    <span>Course</span>
                    <select
                      name="course"
                      value={editForm.course}
                      onChange={handleEditChange}
                    >
                      {STUDENT_COURSE_OPTIONS.map((courseOption) => (
                        <option key={courseOption.value} value={courseOption.value}>
                          {courseOption.label}
                        </option>
                      ))}
                    </select>
                    <small className="profile-field__hint">
                      Students currently in {NEB_PREPARATION_COURSE} can switch to another course once.
                    </small>
                  </label>
                ) : (
                  <label className="profile-field profile-field--readonly">
                    <span>Course</span>
                    <input type="text" value={profile.course || ''} readOnly />
                    <small className="profile-field__hint">
                      Course changes are only available for students currently enrolled in {NEB_PREPARATION_COURSE}.
                    </small>
                  </label>
                )}
              </div>

              <label className="profile-field">
                <span>Address</span>
                <textarea
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                  rows="4"
                  placeholder="Add your address"
                ></textarea>
              </label>

              <div className="profile-readonly-strip">
                <div className="profile-readonly-item">
                  <span>Email</span>
                  <strong>{profile.email}</strong>
                </div>
                <div className="profile-readonly-item">
                  <span>Account Status</span>
                  <strong>{profile.accountStatus}</strong>
                </div>
              </div>

              <div className="profile-modal-actions">
                <button type="button" className="secondary-btn" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {recordedViewer.isOpen && (
        <div
          className="recorded-viewer-backdrop"
          role="presentation"
          onClick={closeRecordedViewer}
        >
          <div
            className="recorded-viewer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recorded-viewer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="recorded-viewer-header">
              <div>
                <p className="profile-modal__eyebrow">Recorded Classes</p>
                <h2 id="recorded-viewer-title">
                  {recordedViewer.classItem?.topicName || 'Recorded Class'}
                </h2>
                <div className="recorded-viewer-meta">
                  <span className="student-meta-pill recorded-viewer-pill">
                    <i className="fa-solid fa-book"></i>
                    {recordedViewer.classItem?.subject || 'Subject'}
                  </span>
                  <span className="student-meta-pill recorded-viewer-pill">
                    <i
                      className={
                        recordedViewerType === 'playlist'
                          ? 'fa-solid fa-list-ul'
                          : 'fa-solid fa-circle-play'
                      }
                    ></i>
                    {recordedViewerType === 'playlist' ? 'Playlist' : 'Single Video'}
                  </span>
                  {recordedViewer.classItem?.classDate && (
                    <span className="student-meta-pill recorded-viewer-pill">
                      <i className="fa-regular fa-calendar"></i>
                      {formatDate(recordedViewer.classItem.classDate)}
                    </span>
                  )}
                </div>
              </div>

              <button
                className="profile-modal-close"
                onClick={closeRecordedViewer}
                type="button"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="recorded-viewer-layout">
              <div className="recorded-viewer-player-panel">
                {recordedViewerEmbedUrl ? (
                  <div className="recorded-player-frame">
                    <iframe
                      src={recordedViewerEmbedUrl}
                      title={recordedViewer.classItem?.topicName || 'Recorded class player'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="recorded-viewer-status error">
                    This class does not have a playable YouTube video yet.
                  </div>
                )}

                {recordedViewer.classItem?.description && (
                  <p className="recorded-viewer-description">
                    {recordedViewer.classItem.description}
                  </p>
                )}

                {recordedViewer.error && (
                  <div className="recorded-viewer-status error">{recordedViewer.error}</div>
                )}
              </div>

              {recordedViewerType === 'playlist' && (
                <aside className="recorded-playlist-panel">
                  <div className="recorded-playlist-panel__header">
                    <div>
                      <h3>{recordedViewer.playlistTitle || 'Playlist Videos'}</h3>
                      <p>Watch any lesson from this playlist without leaving Sajha Entrance.</p>
                    </div>
                    <span>{recordedViewer.playlistVideos.length} videos</span>
                  </div>

                  {recordedViewer.loading ? (
                    <div className="recorded-viewer-status">Loading playlist videos...</div>
                  ) : recordedViewer.playlistVideos.length > 0 ? (
                    <div className="recorded-playlist-list">
                      {recordedViewer.playlistVideos.map((video, index) => (
                        <button
                          type="button"
                          key={video.id || `${video.videoId}-${index}`}
                          className={`recorded-playlist-item ${
                            recordedViewer.selectedVideoId === video.videoId ? 'active' : ''
                          }`}
                          onClick={() => handlePlaylistVideoSelect(video.videoId)}
                        >
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="recorded-playlist-thumb"
                          />
                          <span className="recorded-playlist-item__content">
                            <strong>{video.title}</strong>
                            <small>{video.publishedAt ? formatDate(video.publishedAt) : ''}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="recorded-viewer-status">
                      Playlist videos could not be loaded right now. You can still use the
                      embedded player above.
                    </div>
                  )}
                </aside>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
