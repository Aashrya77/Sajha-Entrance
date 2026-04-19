import API from './config';

// Home API
export const homeAPI = {
  getHomeData: () => API.get('/home'),
  getAboutData: () => API.get('/about'),
  getServicesData: () => API.get('/services'),
  sendContact: (data) => API.post('/contact', data),
  subscribe: (email) => API.post('/subscribe', { email }),
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
  getRecordedClassDetails: (classId) => API.get(`/student/classes/recorded/${classId}`),
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

// Book Payment API
export const bookPaymentAPI = {
  initiatePayment: (data) => API.post('/book-payment/initiate', data),
  getPaymentStatus: (transactionUuid) => API.get(`/book-payment/status/${transactionUuid}`),
};

// Result API
export const resultAPI = {
  getCourses: () => API.get("/results/courses"),
  getPublishedExams: (course) =>
    API.get(`/results/exams?course=${encodeURIComponent(course)}`),
  searchResult: (course, symbolNumber, examId = "") => {
    const params = new URLSearchParams();
    params.append("course", course);
    params.append("symbolNumber", symbolNumber);
    if (examId) params.append("examId", examId);
    return API.get(`/results?${params.toString()}`);
  },
  getTopResults: (course = "", examId = "") => {
    const params = new URLSearchParams();
    if (course) params.append("course", course);
    if (examId) params.append("examId", examId);
    return API.get(`/results/top?${params.toString()}`);
  },
};

// Inquiry API
export const inquiryAPI = {
  submitInquiry: (data) => API.post('/inquiry', data),
};
