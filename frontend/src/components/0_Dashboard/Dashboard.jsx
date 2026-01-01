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

      {/* 🍰 Hola Bakery Banner */}
      <div
        className="promo-banner"
        onClick={() => window.open('https://www.instagram.com/hola._.bakery/?hl=zh-tw', '_blank')}
        style={{
          background: 'linear-gradient(135deg, #0f0f0f, #2b2b2b)', // 黑金低調質感
          color: '#d4af37', // 經典金
          padding: '15px 20px',
          borderRadius: '12px',
          marginBottom: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid rgba(212, 175, 55, 0.3)', // 金色細邊框
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)', // 深色陰影
          transition: 'transform 0.2s',
          fontWeight: 'bold',
          marginTop: isLoggedIn ? '-10px' : '10px'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/hola_logo.jpg"
            alt="Hola Bakery Logo"
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: '2px solid #d4af37', // 金色邊框
              objectFit: 'cover',
              background: '#000'
            }}
          />
          <div>
            <div style={{
              fontSize: '0.75rem',
              background: '#d4af37',
              color: '#000',
              width: 'fit-content',
              padding: '2px 8px',
              borderRadius: '4px', // 方一點更俐落
              marginBottom: '4px',
              fontWeight: 800
            }}>✨ 幫姊姊宣傳</div>
            <div style={{ fontSize: '1.1rem', color: '#fff' }}>Hola Bakery 甜點工作室</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 'normal', color: '#ccc' }}>
              精緻手作 • 專屬客製化甜點 💝
            </div>
          </div>
        </div>
        <span style={{
          fontSize: '0.9rem',
          border: '1px solid #d4af37',
          color: '#d4af37',
          padding: '5px 12px',
          borderRadius: '20px'
        }}>
          去逛逛 ↗
        </span>
      </div>

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
