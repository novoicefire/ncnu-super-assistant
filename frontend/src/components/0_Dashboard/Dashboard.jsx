// frontend/src/components/0_Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import WelcomeBanner from './WelcomeBanner.jsx';
import TodayStatus from './TodayStatus.jsx';
import CoursePreview from './CoursePreview.jsx';
import AnnouncementCard from './AnnouncementCard.jsx'; // ✅ 新增：公告區組件
import SemesterWrapped from './SemesterWrapped.jsx'; // ✅ 新增：學期回顧組件
import './Dashboard.css';

const Dashboard = () => {
  const { user, isLoggedIn } = useAuth();
  const [showWrapped, setShowWrapped] = useState(false);

  return (
    <div className="dashboard">
      {showWrapped && user?.google_id && (
        <SemesterWrapped
          userId={user.google_id}
          onClose={() => setShowWrapped(false)}
        />
      )}

      <WelcomeBanner user={user} isLoggedIn={isLoggedIn} />

      {/* 🎁 學期回顧 Banner - 移動到這裡以在手機版顯示最上方 */}
      {isLoggedIn && (
        <div
          className="wrapped-banner"
          onClick={() => setShowWrapped(true)}
          style={{
            background: 'linear-gradient(90deg, #ff00cc, #333399)',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s',
            fontWeight: 'bold',
            marginTop: '10px'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>✨</span>
            <div>
              <div style={{ fontSize: '1.1rem' }}>2025 學期回顧</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9, fontWeight: 'normal' }}>點擊查看你的專屬學期總結</div>
            </div>
          </div>
          <span>查看 👉</span>
        </div>
      )}

      <div className="dashboard-main">
        <div className="dashboard-sidebar">
          <TodayStatus />
          {/* ✅ 替換：將 SystemStatus 替換為 AnnouncementCard */}
          <AnnouncementCard />
        </div>
        <div className="dashboard-content">
          <CoursePreview />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
