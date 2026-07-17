import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { noticeAPI, authAPI, activityAPI } from './api/services';
import { ADMIN_ROOT_PATH } from './api/config';
import config from './config';
import { trackPageView, isAnalyticsEnabled } from './analytics';

// Import components
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Loader from './components/Loader/Loader';
import RouteRobotsMeta from './components/Seo/RouteRobotsMeta';
import { booksData } from './data/booksData';

const Home = React.lazy(() => import('./pages/Home/Home'));
const Dashboard = React.lazy(() => import('./pages/Home/Dashboard'));
const About = React.lazy(() => import('./pages/About/About'));
const Courses = React.lazy(() => import('./pages/Courses/Courses'));
const CourseDetail = React.lazy(() => import('./pages/CourseDetail/CourseDetail'));
const Colleges = React.lazy(() => import('./pages/Colleges/Colleges'));
const CollegeDetail = React.lazy(() => import('./pages/CollegeDetail/CollegeDetail'));
const Blogs = React.lazy(() => import('./pages/Blogs/Blogs'));
const BlogDetail = React.lazy(() => import('./pages/BlogDetail/BlogDetail'));
const Contact = React.lazy(() => import('./pages/Contact/Contact'));
const Services = React.lazy(() => import('./pages/Services/Services'));
const Admission = React.lazy(() => import('./pages/Admission/Admission'));
const News = React.lazy(() => import('./pages/News/News'));
const Event = React.lazy(() => import('./pages/Event/Event'));
const Scholarship = React.lazy(() => import('./pages/Scholarship/Scholarship'));
const StudentLogin = React.lazy(() => import('./pages/StudentLogin/StudentLogin'));
const StudentRegister = React.lazy(() => import('./pages/StudentRegister/StudentRegister'));
const StudentProfile = React.lazy(() => import('./pages/StudentProfile/StudentProfile'));
const StudentRecordedClassesPage = React.lazy(() => import('./pages/StudentRecordedClasses/StudentRecordedClasses'));
const AdminRedirect = React.lazy(() => import('./pages/AdminRedirect/AdminRedirect'));
const NotFound = React.lazy(() => import('./pages/NotFound/NotFound'));
const Results = React.lazy(() => import('./pages/Results/Results'));
const Universities = React.lazy(() => import('./pages/Universities/Universities'));
const UniversityDetail = React.lazy(() => import('./pages/UniversityDetail/UniversityDetail'));
const MockTests = React.lazy(() => import('./pages/MockTests/MockTests'));
const MockTestExam = React.lazy(() => import('./pages/MockTestExam/MockTestExam'));
const MockTestResult = React.lazy(() => import('./pages/MockTestResult/MockTestResult'));
const MockTestResults = React.lazy(() => import('./pages/MockTestResults/MockTestResults'));
const ForgotPasswordForm = React.lazy(() => import('./components/FormDesign/ForgotPasswordForm'));
const Popup = React.lazy(() => import('./components/Popup/Popup'));
const BookList = React.lazy(() => import('./components/Books/BookList'));
const BookDetail = React.lazy(() => import('./components/Books/BookDetail'));
const Cart = React.lazy(() => import('./components/Books/Cart'));
const PaymentSuccess = React.lazy(() => import('./pages/PaymentSuccess/PaymentSuccess'));
const PaymentFailure = React.lazy(() => import('./pages/PaymentFailure/PaymentFailure'));
const TermsConditions = React.lazy(() => import('./pages/Legal/TermsConditions'));
const PrivacyPolicy = React.lazy(() => import('./pages/Legal/PrivacyPolicy'));
const PastQuestions = React.lazy(() => import('./pages/PastQuestions/PastQuestions'));
const PastQuestionDetail = React.lazy(() => import('./pages/PastQuestions/PastQuestionDetail'));

const PageLoader = () => (
  <div className="container mt-5 pt-5 d-flex justify-content-center">
    <Loader />
  </div>
);

// ScrollToTop component to reset scroll position on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const previousPathRef = useRef(pathname);
  
  useEffect(() => {
    const previousPath = previousPathRef.current;
    const isStudentProfileSubviewChange =
      previousPath.startsWith('/student/profile') && pathname.startsWith('/student/profile');

    if (!isStudentProfileSubviewChange) {
      window.scrollTo(0, 0);
    }

    previousPathRef.current = pathname;
  }, [pathname]);
  
  return null;
};

const PRESENCE_CLIENT_ID_KEY = 'sajha_presence_client_id';
const PRESENCE_HEARTBEAT_INTERVAL_MS = 30000;

const getPresenceClientId = () => {
  const existingClientId = localStorage.getItem(PRESENCE_CLIENT_ID_KEY);

  if (existingClientId) {
    return existingClientId;
  }

  const generatedClientId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  localStorage.setItem(PRESENCE_CLIENT_ID_KEY, generatedClientId);
  return generatedClientId;
};

function App() {
  const [notice, setNotice] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [popup, setPopup] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const addToCart = useCallback((book, quantity = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === book.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === book.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...book, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((bookId) => {
    setCartItems(prev => prev.filter(item => item.id !== bookId));
  }, []);

  const updateQuantity = useCallback((bookId, quantity) => {
    if (quantity === 0) {
      setCartItems(prev => prev.filter(item => item.id !== bookId));
    } else {
      setCartItems(prev =>
        prev.map(item =>
          item.id === bookId ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  useEffect(() => {
    // Fetch notice data
    fetchNotice();
    // Check authentication
    checkAuth();
  }, []);

  const sendPresenceHeartbeat = useCallback(() => {
    activityAPI
      .sendHeartbeat({
        clientId: getPresenceClientId(),
        path: `${location.pathname}${location.search || ''}`,
        title: document.title,
      })
      .catch(() => {});
  }, [location.pathname, location.search]);

  useEffect(() => {
    sendPresenceHeartbeat();

    const intervalId = window.setInterval(
      sendPresenceHeartbeat,
      PRESENCE_HEARTBEAT_INTERVAL_MS
    );
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendPresenceHeartbeat();
      }
    };

    window.addEventListener('focus', sendPresenceHeartbeat);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', sendPresenceHeartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sendPresenceHeartbeat]);

  useEffect(() => {
    if (!isAnalyticsEnabled()) {
      return;
    }
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  const fetchNotice = async () => {
    try {
      const response = await noticeAPI.getNotice();
      if (response.data.success) {
        setNotice(response.data.data);
      }
    } catch (_error) {}
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await authAPI.getProfile();
        if (response.data.success) {
          setStudentData(response.data.data);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      // Silently clear stale auth — user can keep browsing
      localStorage.removeItem('token');
      setStudentData(null);
      setIsAuthenticated(false);
    }
  };

  const handleStudentLogout = useCallback(async () => {
    try {
      if (localStorage.getItem('token')) {
        await authAPI.logout();
      }
    } catch (_error) {} finally {
      localStorage.removeItem('token');
      setStudentData(null);
      setIsAuthenticated(false);
      navigate('/');
    }
  }, [navigate]);

  const authPages = ['/student/login', '/student/register', '/forgot-password'];
  const isAuthPage =
    authPages.includes(location.pathname) ||
    location.pathname.startsWith('/reset-password/');
  const isMockTestExamPage = /^\/mocktest\/[^/]+$/.test(location.pathname);
  const hideSiteChrome = isAuthPage || isMockTestExamPage;

  return (
    <div className="App">
      <ScrollToTop />
      <RouteRobotsMeta />
      {!hideSiteChrome && <Navbar notice={notice} studentData={studentData} isAuthenticated={isAuthenticated} cartCount={cartItems.reduce((total, item) => total + item.quantity, 0)} onLogout={handleStudentLogout} />}
      <React.Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/colleges" element={<Colleges />} />
        <Route path="/college/:id" element={<CollegeDetail />} />
        <Route path="/universities" element={<Universities />} />
        <Route path="/university/:id" element={<UniversityDetail />} />
        <Route path="/mocktests" element={<MockTests isAuthenticated={isAuthenticated} />} />
        <Route path="/mocktest/:id" element={<MockTestExam />} />
        <Route path="/mocktest-result/:attemptId" element={<MockTestResult />} />
        <Route path="/mocktest-results" element={<MockTestResults />} />
        <Route
          path="/past-questions"
          element={
            <React.Suspense fallback={<PageLoader />}>
              <PastQuestions />
            </React.Suspense>
          }
        />
        <Route
          path="/past-questions/:slug"
          element={
            <React.Suspense fallback={<PageLoader />}>
              <PastQuestionDetail />
            </React.Suspense>
          }
        />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/services" element={<Services />} />
        <Route path="/admission" element={<Admission />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<News />} />
        <Route path="/events" element={<Event />} />
        <Route path="/events/:id" element={<Event />} />
        <Route path="/scholarships" element={<Scholarship />} />
        <Route path="/results" element={<Results />} />
        <Route path="/books" element={<BookList books={booksData} addToCart={addToCart} />} />
        <Route path="/book/:id" element={<BookDetail books={booksData} addToCart={addToCart} />} />
        <Route path="/cart" element={<Cart cartItems={cartItems} removeFromCart={removeFromCart} updateQuantity={updateQuantity} clearCart={clearCart} />} />
        <Route path="/student/login" element={<StudentLogin setStudentData={setStudentData} setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/student/recorded-classes" element={<StudentRecordedClassesPage />} />
        <Route path="/student/profile/*" element={<StudentProfile studentData={studentData} setStudentData={setStudentData} setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password/:token" element={<ForgotPasswordForm />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
        <Route path="/terms-and-conditions" element={<TermsConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path={`${ADMIN_ROOT_PATH}/*`} element={<AdminRedirect />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </React.Suspense>
      {!hideSiteChrome && <Footer />}
      {popup && <Popup popup={popup} setPopup={setPopup} />}
    </div>
  );
}

export default App;
