import React, { useEffect, useState } from 'react';
import { homeAPI } from '../../api/services';
import Loader from '../../components/Loader/Loader';
import './Aboutpage.css'; 

const About = () => {
  const [loading, setLoading] = useState(true);
  // --- यो लाइन छुटेको थियो, यसलाई थप्नुहोस् ---
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const allImages = [
    "/public/sajhaphoto/mocktest1.jpg", "/public/sajhaphoto/mocktest2.jpg", "/public/sajhaphoto/mocktest3.jpg",
    "/public/sajhaphoto/mock.jpg", "/public/sajhaphoto/studenthall.jpg", "/public/sajhaphoto/student3.jpg",
    "/public/sajhaphoto/program.jpg", "/public/sajhaphoto/program1.jpg", "/public/sajhaphoto/mukesh.jpeg",
    "/public/sajhaphoto/aaramva.jpg", "/public/sajhaphoto/nirjalapanta.jpg", "/public/sajhaphoto/mocktestgift.jpg"
  ];

  // Elfsight Script loading
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

  // Rank Holders Data
  const rankHolders = [
    {
      id: 1,
      name: "Aramva Acharya",
      rank: "CSIT Rank 1 (2082 Batch)",
      image: "/public/sajhaphoto/aaramva.jpg",
      thought: "Sajha Entrance provided me the best environment and resources. The teachers are very supportive and the mock tests helped me gain confidence."
    },
     {
      id: 2,
      name: "Chhiring Gyalbu Lama",
      rank: "CSIT Rank 15 (2082 Batch)",
      image: "/public/sajhaphoto/chhiring.jpg",
      thought: "The study materials were very comprehensive. I highly recommend Sajha Entrance for anyone serious about their career."
    },
     {
      id: 3,
      name: "Arpit Ghimire",
      rank: "CSIT Rank 30 (2082 Batch)",
      image: "/public/sajhaphoto/arpit.jpg",
      thought: "The guidance and support from the faculty at Sajha Entrance helped me improve my performance significantly. The mock tests were especially helpful in preparing for the actual exam."
    },
    {
      id: 4,
      name: "Nirjala Panta",
      rank: "CSIT Rank 93 (2082 Batch)",
      image: "/public/sajhaphoto/nirjalapanta.jpg",
      thought: "Sajha Entrance is a great place for entrance preparation. The teachers are very knowledgeable and the study materials are top-notch. I am grateful for their support throughout my preparation."
    },
    {
      id: 5,
      name: "biwash Parajuli",
      rank: "CSIT Rank 125 (2081 Batch)",
      image: "/public/sajhaphoto/biwasparajuli.jpg",
      thought: "Sajha Entrance provided me with the right guidance and resources to succeed. The mock tests were very helpful in identifying my weaknesses and improving my performance."
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
            <p className="mt-4 about-text">
              Sajha Entrance is a leading IT-based educational hub dedicated to preparing students for competitive entrance examinations and building strong technical careers.We specialize in <strong>IOE, BSc.CSIT, BIT, BCA, CMAT & BCS.IT entrance preparation</strong> , providing both online and physical classes with structured courses, weekly mock tests, and performance-based rewards.
            </p>
            <p className="about-text">
              Our institution is run by passionate IT graduates who understand the real challenges students face. We focus on:
              <li>Concept-based learning</li>
              <li>Chapter-wise revision & model question practice</li>
              <li>Career counselling & guidance</li>
              <li>Scholarship support after +2</li>
              <li>Practical IT training programs</li> <br />
              At Sajha Entrance, we believe success starts with the right guidance. Our mission is to empower students with knowledge, confidence, and skills               to achieve their academic and professional goals.
            </p>
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

        {/* --- MODAL SECTION --- */}
        {isGalleryOpen && (
          <div className="gallery-modal-overlay" onClick={() => setIsGalleryOpen(false)}>
            <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setIsGalleryOpen(false)}>&times;</button>
              <div className="modal-scroll-area">
                <h3 className="text-white text-center mb-4">Our Campus Gallery</h3>
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
        <div className="row mt-5 pt-5">
          {[
            { icon: 'fa-award', title: 'Excellence', desc: 'Committed to providing quality education and guidance.' },
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