import React from 'react';
import WelcomeBanner from './WelcomeBanner.jsx';
import QuickLinks from './QuickLinks.jsx';
import AnnouncementCard from './AnnouncementCard.jsx';
import GymScheduleCard from './GymScheduleCard.jsx';
import DormMailCard from './DormMailCard.jsx';

import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      {/* 整合版 Welcome Banner（含今日狀態功能） */}
      <WelcomeBanner />

      {/* 橫向快速連結按鈕列 */}
      <QuickLinks />

      {/* 主內容區域：公告 + 其他卡片 */}
      <div className="dashboard-main simplified">
        <div className="dashboard-sidebar">
          <AnnouncementCard />
        </div>
        <div className="dashboard-content">
          <GymScheduleCard />
          <DormMailCard />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
