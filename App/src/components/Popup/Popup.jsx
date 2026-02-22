import React from 'react';

const Popup = ({ popup, setPopup }) => {
  if (!popup || !popup.isActive) return null;

  const handleClose = () => {
    setPopup(null);
  };

  return (
    <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{popup.title}</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            {popup.image && (
              <img src={popup.image} alt={popup.title} className="img-fluid mb-3" />
            )}
            <div dangerouslySetInnerHTML={{ __html: popup.content }} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Close</button>
            {popup.link && (
              <a href={popup.link} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                Learn More
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
