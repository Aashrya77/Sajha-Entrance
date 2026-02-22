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
  getProfile: () => API.get('/student/profile'),
  getClasses: () => API.get('/student/classes'),
  logout: () => API.post('/student/logout'),
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

// Result API
export const resultAPI = {
  searchResult: (course, symbolNumber) => API.get(`/results?course=${encodeURIComponent(course)}&symbolNumber=${encodeURIComponent(symbolNumber)}`),
  getTopResults: () => API.get('/results/top'),
};
