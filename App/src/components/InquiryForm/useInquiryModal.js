/**
 * Custom Hook for Managing Inquiry Modal State
 * 
 * Usage:
 * const { isOpen, open, close } = useInquiryModal();
 * 
 * Then use in your component:
 * <InquiryButton isOpen={isOpen} onOpen={open} onClose={close} collegeName="..." />
 */

import { useState } from 'react';

export const useInquiryModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    setIsOpen(false);
    document.body.style.overflow = 'auto';
  };

  const toggle = () => {
    if (isOpen) close();
    else open();
  };

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};

export default useInquiryModal;
