import React from 'react';
import { useNavigate } from 'react-router-dom';
import ZoomRecordedClasses from '../../components/ZoomRecordedClasses/ZoomRecordedClasses';

const StudentRecordedClassesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="student-recorded-classes-page">
      <div className="container py-4">
        <button
          type="button"
          className="primary-btn"
          onClick={() => navigate('/student/profile')}
          style={{ marginBottom: '1rem' }}
        >
          ← Back to dashboard
        </button>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <div>
              <h2 className="dashboard-card__title">All Recorded Classes</h2>
              <p className="dashboard-card__description">
                Browse every synced recorded class available for your course.
              </p>
            </div>
          </div>

          <ZoomRecordedClasses
            isPaid={true}
            allowSync={true}
            pageSize={100}
            loadMoreBehavior="paginate"
          />
        </article>
      </div>
    </div>
  );
};

export default StudentRecordedClassesPage;
