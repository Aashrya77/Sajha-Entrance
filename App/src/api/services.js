import API, { baseURL, publicAPI } from './config';

const QUESTION_VIEWER_STORAGE_KEY = 'sajha_question_viewer_id';

const createQuestionViewerId = () => {
  const browserCrypto = typeof window !== 'undefined' ? window.crypto : null;
  if (browserCrypto && typeof browserCrypto.randomUUID === 'function') {
    return browserCrypto.randomUUID();
  }

  return `viewer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};

const getQuestionViewerId = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const storage = window.localStorage;
    if (!storage) {
      return '';
    }

    const existingId = storage.getItem(QUESTION_VIEWER_STORAGE_KEY);
    if (existingId) {
      return existingId;
    }

    const nextId = createQuestionViewerId();
    storage.setItem(QUESTION_VIEWER_STORAGE_KEY, nextId);
    return nextId;
  } catch (_error) {
    return '';
  }
};

const getQuestionViewerHeaders = () => {
  const viewerId = getQuestionViewerId();
  return viewerId ? { 'x-question-viewer-id': viewerId } : {};
};

// Home API
export const homeAPI = {
  getHomeData: () => API.get('/home'),
  getAboutData: () => API.get('/about'),
  getServicesData: () => API.get('/services'),
  sendContact: (data) => API.post('/contact', data),
  subscribe: (email) => API.post('/subscribe', { email }),
};

export const advertisementAPI = {
  getForPage: (page) => API.get(`/advertisements?page=${encodeURIComponent(page)}`),
};

// Course API
export const courseAPI = {
  getAllCourses: () => API.get('/courses'),
  getCourseById: (id) => API.get(`/course/${id}`),
};

// College API
export const collegeAPI = {
  getAllColleges: (page = 1, search = '', location = '') => {
    const params = new URLSearchParams();
    params.append('page', page);
    if (search) params.append('searchCollege', search);
    if (location) params.append('location', location);
    return API.get(`/colleges?${params.toString()}`);
  },
  getCollegeById: (id) => API.get(`/college/${id}`),
};

// University API
export const universityAPI = {
  getAllUniversities: (page = 1, search = '', location = '') => {
    const params = new URLSearchParams();
    params.append('page', page);
    if (search) params.append('searchUniversity', search);
    if (location) params.append('location', location);
    return API.get(`/universities?${params.toString()}`);
  },
  getUniversityById: (id) => API.get(`/university/${id}`),
};

// Blog API
export const blogAPI = {
  getAllBlogs: (page = 1, search = '') => {
    const params = new URLSearchParams();
    params.append('page', page);
    if (search) params.append('searchBlog', search);
    return API.get(`/blogs?${params.toString()}`);
  },
  getBlogById: (id) => API.get(`/blog/${id}`),
};

// Auth API
export const authAPI = {
  login: (credentials) => API.post('/student/login', credentials),
  register: (userData) => API.post('/student/register', userData),
  forgotPassword: (data) => API.post('/student/forgot-password', data),
  validateResetToken: (token) => API.get(`/student/reset-password/${token}`),
  resetPassword: (token, data) => API.post(`/student/reset-password/${token}`, data),
  getProfile: () => API.get('/student/profile'),
  updateProfile: (data) => API.put('/student/profile', data),
  getClasses: () => API.get('/student/classes'),
  logout: () => API.post('/student/logout'),
};

export const youtubeLibraryAPI = {
  getHome: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.subject) query.append('subject', params.subject);
    if (params.course) query.append('course', params.course);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    return API.get(`/youtube-library/home?${query.toString()}`);
  },
  getLive: (params = {}) => {
    const query = new URLSearchParams();
    if (params.course) query.append('course', params.course);
    return API.get(`/youtube-library/live?${query.toString()}`);
  },
  getPlaylists: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.subject) query.append('subject', params.subject);
    if (params.course) query.append('course', params.course);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    return API.get(`/youtube-library/playlists?${query.toString()}`);
  },
  getVideos: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.subject) query.append('subject', params.subject);
    if (params.course) query.append('course', params.course);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    return API.get(`/youtube-library/videos?${query.toString()}`);
  },
};

export const zoomRecordingAPI = {
  getRecordings: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    return API.get(`/student/zoom-recordings?${query.toString()}`);
  },
  getCategories: () => API.get('/student/zoom-recordings/categories'),
  getSyncStatus: () => API.get('/student/zoom-recordings/sync/status'),
  sync: () => API.post('/student/zoom-recordings/sync'),
  streamUrl: (recordingId) =>
    `${baseURL}/student/zoom-recordings/${encodeURIComponent(recordingId)}/stream`,
  thumbnailUrl: (recordingId) =>
    `${baseURL}/student/zoom-recordings/${encodeURIComponent(recordingId)}/thumbnail`,
};

// Notice API
export const noticeAPI = {
  getNotice: () => API.get('/notice'),
};

// Payment API
export const paymentAPI = {
  initiatePayment: (data) => API.post('/payment/initiate', data),
  getPaymentStatus: (transactionUuid) => API.get(`/payment/status/${transactionUuid}`),
  verifyPayment: (transactionUuid) => API.post(`/payment/verify/${transactionUuid}`),
};

// MockTest API
export const mockTestAPI = {
  getAllMockTests: (search = '', course = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (course) params.append('course', course);
    return API.get(`/mocktests?${params.toString()}`);
  },
  getMockTestForExam: (id) => API.get(`/mocktest/${id}`),
  submitMockTest: (id, data) => API.post(`/mocktest/${id}/submit`, data),
  getMyAttempts: () => API.get('/mocktest-attempts'),
  getAttemptResult: (attemptId) => API.get(`/mocktest-attempt/${attemptId}`),
};

// Question Bank API
export const questionBankAPI = {
  getAllQuestions: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.exam) query.append('exam', params.exam);
    if (params.type) query.append('type', params.type);
    if (params.year) query.append('year', params.year);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    return API.get(`/question-bank?${query.toString()}`);
  },
  getQuestionBySlug: (slug) =>
    API.get(`/question-bank/${slug}`, {
      headers: getQuestionViewerHeaders(),
    }),
};

// Book Payment API
export const bookPaymentAPI = {
  initiatePayment: (data) => API.post('/book-payment/initiate', data),
  getPaymentStatus: (transactionUuid) => API.get(`/book-payment/status/${transactionUuid}`),
};

// Result API
export const resultAPI = {
  getCourses: (config = {}) => publicAPI.get('/results/courses', config),
  getMockTests: (courseId, config = {}) =>
    publicAPI.get(`/results/mock-tests?courseId=${encodeURIComponent(courseId)}`, config),
  getMockTestDates: (courseId, mockTestId, config = {}) =>
    publicAPI.get(
      `/results/mock-test-dates?courseId=${encodeURIComponent(
        courseId
      )}&mockTestId=${encodeURIComponent(mockTestId)}`,
      config
    ),
  searchResult: ({ courseId, mockTestId, sessionId, rollNumber }, config = {}) =>
    publicAPI.post(
      '/results/search',
      {
        courseId,
        mockTestId,
        sessionId,
        rollNumber,
      },
      config
    ),
};

// Inquiry API
export const inquiryAPI = {
  submitInquiry: (data) => API.post('/inquiry', data),
};

export const activityAPI = {
  sendHeartbeat: (data) => API.post('/activity/heartbeat', data),
};
