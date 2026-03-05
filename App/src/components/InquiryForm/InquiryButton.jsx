import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import InquiryModal from './InquiryModel';
import './InquiryButton.css';

/**
 * Reusable Inquiry Button Component with Modal
 * 
 * Usage:
 * <InquiryButton collegeName="PCPS College" courses={coursesArray} />
 * 
 * Props:
 * - collegeName (required): Name of the college to display in modal
 * - courses (optional): Array of course objects with title/fullForm properties
 * - position (optional): Position of button - 'bottom-right' (default), 'bottom-left', etc.
 * - variant (optional): Button style variant
 */
const InquiryButton = ({ collegeName = 'College Name', position = 'bottom-right', courses = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    // Blur the background
    document.body.style.overflow = 'hidden';
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Restore background
    document.body.style.overflow = 'auto';
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`inquiry-fab inquiry-fab-${position}`}
        onClick={handleOpenModal}
        title="Inquire about this college"
        aria-label="Inquire about this college"
      >
        <Mail size={24} className="fab-icon" />
        <span className="fab-label">Inquire</span>
      </button>

      {/* Modal - Positioned fixed so it overlays everything */}
      <InquiryModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        collegeName={collegeName}
        courses={courses}
      />
    </>
  );
};

export default InquiryButton;
