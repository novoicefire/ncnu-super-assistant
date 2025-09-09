// frontend/src/components/0_Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import SpecialBanner from './SpecialBanner.jsx'; // ✅ 新增：特殊橫幅組件
import WelcomeBanner from './WelcomeBanner.jsx';
import TodayStatus from './TodayStatus.jsx';
import CoursePreview from './CoursePreview.jsx';
import AnnouncementCard from './AnnouncementCard.jsx'; // ✅ 新增：公告區組件
import './Dashboard.css';

const Dashboard = () => {
  const { user, isLoggedIn } = useAuth();

  return (
    <div className="dashboard">
      <SpecialBanner />
      <WelcomeBanner user={user} isLoggedIn={isLoggedIn} />
      <div className="dashboard-main">
        <div className="dashboard-sidebar">
          <TodayStatus />
          {/* ✅ 替換：將 SystemStatus 替換為 AnnouncementCard */}
          <AnnouncementCard />
        </div>
        <CoursePreview />
      </div>
    </div>
  );
};

export default Dashboard;
