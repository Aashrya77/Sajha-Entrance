import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { noticeAPI, authAPI } from './api/services';

// Import components
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Courses from './pages/Courses/Courses';
import CourseDetail from './pages/CourseDetail/CourseDetail';
import Colleges from './pages/Colleges/Colleges';
import CollegeDetail from './pages/CollegeDetail/CollegeDetail';
import Blogs from './pages/Blogs/Blogs';
import BlogDetail from './pages/BlogDetail/BlogDetail';
import Contact from './pages/Contact/Contact';
import Services from './pages/Services/Services';
import StudentLogin from './pages/StudentLogin/StudentLogin';
import StudentRegister from './pages/StudentRegister/StudentRegister';
import StudentProfile from './pages/StudentProfile/StudentProfile';
import NotFound from './pages/NotFound/NotFound';
import Results from './pages/Results/Results';
import ForgotPasswordForm from './components/FormDesign/ForgotPasswordForm';
import Popup from './components/Popup/Popup';
import BookList from './components/Books/BookList';
import BookDetail from './components/Books/BookDetail';
import Cart from './components/Books/Cart';
import { booksData } from './data/booksData';
import PaymentSuccess from './pages/PaymentSuccess/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure/PaymentFailure';
function App() {
  const [notice, setNotice] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [popup, setPopup] = useState(null);
  const [cartItems, setCartItems] = useState([]);

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

  useEffect(() => {
    // Fetch notice data
    fetchNotice();
    // Check authentication
    checkAuth();
  }, []);

  const fetchNotice = async () => {
    try {
      const response = await noticeAPI.getNotice();
      if (response.data.success) {
        setNotice(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notice:', error);
    }
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

  const location = useLocation();
  const authPages = ['/student/login', '/student/register', '/forgot-password'];
  const isAuthPage = authPages.includes(location.pathname);

  return (
    <div className="App">
      {!isAuthPage && <Navbar notice={notice} studentData={studentData} isAuthenticated={isAuthenticated} cartCount={cartItems.reduce((total, item) => total + item.quantity, 0)} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/colleges" element={<Colleges />} />
        <Route path="/college/:id" element={<CollegeDetail />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/services" element={<Services />} />
        <Route path="/results" element={<Results />} />
        <Route path="/books" element={<BookList books={booksData} addToCart={addToCart} />} />
        <Route path="/book/:id" element={<BookDetail books={booksData} addToCart={addToCart} />} />
        <Route path="/cart" element={<Cart cartItems={cartItems} removeFromCart={removeFromCart} updateQuantity={updateQuantity} />} />
        <Route path="/student/login" element={<StudentLogin setStudentData={setStudentData} setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/student/profile" element={<StudentProfile studentData={studentData} setStudentData={setStudentData} setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAuthPage && <Footer />}
      {popup && <Popup popup={popup} setPopup={setPopup} />}
    </div>
  );
}

export default App;
