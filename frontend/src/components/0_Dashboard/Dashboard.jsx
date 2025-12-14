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

      {/* 主內容區域：公告 + 常用連結 */}
      <div className="dashboard-main simplified">
        <div className="dashboard-sidebar">
          <AnnouncementCard />
        </div>
        <div className="dashboard-content">
          <GymScheduleCard />
          <DormMailCard />
          <QuickLinks />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
