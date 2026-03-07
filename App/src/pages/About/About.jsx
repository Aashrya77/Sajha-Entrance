import React, { useEffect, useState } from 'react';
import { homeAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';
import './Aboutpage.css'; 

const About = () => {
  const [loading, setLoading] = useState(true);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    address: 'Kathmandu',
    email: '',
    course: '',
    college: '',
    message: ''
  });

  const handleContactChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    const submissionData = {
      ...contactForm,
      message: `College: ${contactForm.college} | Message: ${contactForm.message}`
    };
    try {
      const response = await homeAPI.sendContact(submissionData);
      if (response.data.success) {
        alert("Message sent successfully!");
        setContactForm({ name: '', phone: '', address: 'Kathmandu', email: '', course: '', college: '', message: '' });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error.response?.data?.error || 'Failed to send message. Please check all fields.');
    }
    setContactLoading(false);
  };

  // React मा public folder भित्रको path दिँदा सिधै /sajhaphoto बाट सुरु गर्नुहोला
  const allImages = [
    "/sajhaphoto/mocktest1.jpg", "/sajhaphoto/mocktest2.jpg", "/sajhaphoto/mocktest3.jpg",
    "/sajhaphoto/mock.jpg", "/sajhaphoto/studenthall.jpg", "/sajhaphoto/student3.jpg",
    "/sajhaphoto/program.jpg", "/sajhaphoto/program1.jpg", "/sajhaphoto/mukesh.jpeg",
    "/sajhaphoto/aaramva.jpg", "/sajhaphoto/nirjalapanta.jpg", "/sajhaphoto/mocktestgift.jpg"
  ];

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://elfsightcdn.com/platform.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const rankHolders = [
    {
      id: 1,
      name: "Aramva Acharya",
      rank: "CSIT Rank 1 (2082 Batch)",
      image: "/sajhaphoto/aaramva.jpg",
      thought: "Sajha Entrance provided me the best environment and resources. The teachers are very supportive and the mock tests helped me gain confidence."
    },
    {
      id: 2,
      name: "Chhiring Gyalbu Lama",
      rank: "CSIT Rank 15 (2082 Batch)",
      image: "/sajhaphoto/chhiring.jpg",
      thought: "The study materials were very comprehensive. I highly recommend Sajha Entrance for anyone serious about their career."
    },
    {
      id: 3,
      name: "Arpit Ghimire",
      rank: "CSIT Rank 30 (2082 Batch)",
      image: "/sajhaphoto/arpit.jpg",
      thought: "The guidance and support from the faculty at Sajha Entrance helped me improve my performance significantly."
    },
    {
      id: 4,
      name: "Nirjala Panta",
      rank: "CSIT Rank 93 (2082 Batch)",
      image: "/sajhaphoto/nirjalapanta.jpg",
      thought: "Sajha Entrance is a great place for entrance preparation. The teachers are very knowledgeable."
    },
    {
      id: 5,
      name: "Biwash Parajuli",
      rank: "CSIT Rank 125 (2081 Batch)",
      image: "/sajhaphoto/biwasparajuli.jpg",
      thought: "Sajha Entrance provided me with the right guidance and resources to succeed."
    }
  ];

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      await homeAPI.getAboutData();
      setLoading(false);
    } catch (error) {
      console.error('Error fetching about data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mt-5 pt-5 d-flex justify-content-center"><Loader /></div>;
  }

  return (
    <div className="about-page mt-5 pt-5">
      <div className="container-fluid aboutus">
        <h1 className="text-uppercase mb-4 text-center" style={{ fontWeight: 900, color: 'var(--primary-orange)' }}>
          ABOUT <span style={{ color: 'var(--primary-black)' }}>US</span>
        </h1>

        <div className="row align-items-center mt-5">
          <div className="col-lg-6">
            <h2 className="section-title">Welcome to Sajha Entrance</h2>
            <div className="title-underline"></div>
            <p className="mt-4 about-text">
              Sajha Entrance is a leading IT-based educational hub dedicated to preparing students for competitive entrance examinations and building strong technical careers.
              We specialize in <strong>BSc.CSIT, BIT, BCA, CMAT & BCS.IT</strong> entrance preparation, providing both online and physical classes with structured courses, weekly mock tests, and performance-based rewards.
            </p>
            <div className="about-text">
             <strong>Our institution is run by passionate IT graduates who focus on:</strong> 
              <ol>
                <li>Concept-based learning</li>
                <li>Chapter-wise revision & model question practice</li>
                <li>Career counselling & guidance</li>
                <li>Scholarship support after +2</li>
                <li>Practical IT training programs</li>
              </ol>
             At Sajha Entrance, we believe success starts with the right guidance. Our mission is to empower students with knowledge, confidence, and skills to achieve their academic and professional goals.
            </div>
          </div>

          <div className="col-lg-6">
            <div className="about-gallery-grid">
              <div className="gallery-item"><img src={allImages[0]} alt="G1" /></div>
              <div className="gallery-item"><img src={allImages[1]} alt="G2" /></div>
              <div className="gallery-item"><img src={allImages[2]} alt="G3" /></div>
              <div className="gallery-item main-item"><img src={allImages[3]} alt="Main" /></div>
              <div className="gallery-item"><img src={allImages[4]} alt="G4" /></div>

              <div className="gallery-item view-more-box" onClick={() => setIsGalleryOpen(true)}>
                <img src={allImages[5]} alt="More" className="blur-img" />
                <button className="view-more-btn">
                  <i className="fa-solid fa-images"></i>
                  <span>View More</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL SECTION */}
        {isGalleryOpen && (
          <div className="gallery-modal-overlay" onClick={() => setIsGalleryOpen(false)}>
            <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setIsGalleryOpen(false)}>&times;</button>
              <div className="modal-scroll-area">
                <h3 className="text-white text-center mb-4">Our Sajha Gallery</h3>
                <div className="modal-image-grid">
                  {allImages.map((img, index) => (
                    <div key={index} className="modal-img-card">
                      <img src={img} alt={`Gallery ${index}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="row mt-5 pt-5 text-center">
          {[
            { icon: 'fa-award', title: 'Excellence', desc: 'Committed to providing quality education.' },
            { icon: 'fa-users', title: 'Expert Faculty', desc: 'Learn from experienced teachers.' },
            { icon: 'fa-chart-line', title: 'Proven Results', desc: 'Track record of successful students.' }
          ].map((f, i) => (
            <div className="col-lg-4 mb-4" key={i}>
              <div className="modern-feature-box">
                <i className={`fa-solid ${f.icon} fa-2x mb-3`}></i>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Rank Holders */}
        <div className="mt-5 pt-5">
          <h2 className="text-center mb-5" style={{ fontWeight: 800 }}>OUR <span style={{ color: 'var(--primary-orange)' }}>RANK HOLDERS</span></h2>
          <div className="row">
            {rankHolders.map((student) => (
              <div className="col-lg-4 col-md-6 mb-4" key={student.id}>
                <div className="rank-card">
                  <p className="student-thought">{student.thought}</p>
                  <div className="student-info">
                    <img src={student.image} alt={student.name} className="student-img" />
                    <div>
                      <h5 className="mb-0">{student.name}</h5>
                      <small className="text-orange">{student.rank}</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Google Reviews */}
        <div className="google-reviews-container mt-5 pt-4">
          <h2 className="text-center mb-5" style={{ fontWeight: 800 }}>
            WHAT OUR <span style={{ color: 'var(--primary-orange)' }}>STUDENTS SAY</span>
          </h2>
          <div className="elfsight-app-2f4ada3b-37d2-430b-b61d-568abcefef6b" data-elfsight-app-lazy></div>
        </div>

        {/* CONTACT & MAP SECTION */}
        <div className="contact-map-section mt-5 pt-5 pb-5">
          <div className="row g-0 shadow-lg rounded-4 overflow-hidden">
            <div className="col-lg-6 bg-white p-5">
              <h3 className="fw-bold mb-4">Contact <span className="text-orange">Us</span></h3>
              <form onSubmit={handleContactSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                     <label className="form-label">Full Name</label>
                    <input type="text" className="form-control custom-input" name="name" value={contactForm.name} onChange={handleContactChange} placeholder="Full Name" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">+2 College Name</label>
                    <input type="text" className="form-control custom-input" name="college" value={contactForm.college} onChange={handleContactChange} placeholder="+2 College Name" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone Number</label>
                    <input type="tel" className="form-control custom-input" name="phone" value={contactForm.phone} onChange={handleContactChange} placeholder="Phone Number" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-control custom-input" name="email" value={contactForm.email} onChange={handleContactChange} placeholder="Email Address" required />
                  </div>
                  <div className="col-12">
                      <label className="form-label">Course Interested In</label>
                    <select className="form-select custom-input" name="course" value={contactForm.course} onChange={handleContactChange} required>
                      <option value="">Select Course</option>
                      <option value="IOE">IOE</option>
                      <option value="BSc.CSIT">BSc. CSIT</option>
                      <option value="BIT">BIT</option>
                      <option value="BCA">BCA</option>
                      <option value="CMAT">CMAT</option>
                    </select>
                  </div>
                  <div className="col-12">
                      <label className="form-label">Message</label>
                    <textarea className="form-control custom-input" rows="4" name="message" value={contactForm.message} onChange={handleContactChange} placeholder="Your Message" required></textarea>
                  </div>
                  <div className="col-12 mt-4">
                    <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="fa-solid fa-paper-plane me-2"></i>
                  )}
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
                  </div>
                </div>
              </form>
            </div>
            <div className="col-lg-6">
              <div className="map-container h-100">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.4828359288117!2d85.32130547618451!3d27.702400757618451!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb190137b7aff5%3A0x3b10d30307ca3e78!2sSajha%20Entrance!5e0!3m2!1sen!2snp!4v1709400000000!5m2!1sen!2snp" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, minHeight: '450px' }} 
                  allowFullScreen="" 
                  loading="lazy">
                </iframe>
              </div>
            </div>
          </div>
        </div>

        {/* Mission */}
        <div className="mission-section mt-5 p-5 rounded-4 text-center bg-light">
          <h3 className="mb-4">Our Mission</h3>
          <p className="mx-auto" style={{ maxWidth: '800px', fontSize: '1.1rem', color: '#555' }}>
            To empower students with knowledge and skills to excel in their examinations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;