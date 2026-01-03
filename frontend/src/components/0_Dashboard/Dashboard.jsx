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
              <div style={{ fontSize: '1.1rem' }}>2025 學期回顧 <span style={{ background: '#FFD700', color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', marginLeft: '5px' }}>🎁 抽獎</span></div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9, fontWeight: 'normal' }}>查看回顧 + 填問卷抽好禮！</div>
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
          padding: '12px 15px', // [RWD] 縮小 Padding 給內部更多空間
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> {/* [RWD] Gap 10px -> 8px */}
          <img
            src="/hola_logo.jpg"
            alt="Hola Bakery Logo"
            style={{
              width: '42px', // [RWD] 50px -> 42px
              height: '42px',
              borderRadius: '50%',
              border: '2px solid #d4af37', // 金色邊框
              objectFit: 'cover',
              background: '#000',
              flexShrink: 0 // 防止圖片被擠壓
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '5px' }}> {/* 加入 paddingRight 防止文字貼太近 */}
            <div style={{
              fontSize: '0.7rem', // [RWD] 0.75rem -> 0.7rem
              background: '#d4af37',
              color: '#000',
              width: 'fit-content',
              padding: '1px 6px',
              borderRadius: '4px',
              marginBottom: '3px',
              fontWeight: 800,
              lineHeight: 1.2
            }}>✨ 幫姊姊宣傳</div>
            <div style={{
              fontSize: 'clamp(0.9rem, 4vw, 1.1rem)', // [RWD] 動態字體，手機上變小
              color: '#fff',
              whiteSpace: 'nowrap', // 強制不換行
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '200px' // 限制最大寬度以觸發 ellipsis (視情況調整)
            }}>Hola Bakery 甜點工作室</div> {/* 移除 whiteSpace nowrap 測試效果? 不，使用者不喜歡換行，寧願字小一點 */}
            <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 'normal', color: '#ccc' }}> {/* [RWD] 0.8rem -> 0.75rem */}
              精緻手作 • 專屬客製 💝 {/* [RWD] 縮短副標題：客製化甜點 -> 客製，節省空間 */}
            </div>
          </div>
        </div>
        <span style={{
          fontSize: '0.8rem', // [RWD] 0.9rem -> 0.8rem
          border: '1px solid #d4af37',
          color: '#d4af37',
          padding: '5px 10px', // [RWD] 5px 12px -> 5px 10px
          borderRadius: '20px',
          whiteSpace: 'nowrap',
          flexShrink: 0 // 防止按鈕被擠壓
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
