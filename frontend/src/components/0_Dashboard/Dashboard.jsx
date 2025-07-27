// frontend/src/components/0_Dashboard/Dashboard.jsx (佈局調整版)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import WelcomeBanner from './WelcomeBanner.jsx';
import TodayStatus from './TodayStatus.jsx';
import CoursePreview from './CoursePreview.jsx';
import SystemStatus from './SystemStatus.jsx';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isLoggedIn } = useAuth();
  const [systemData, setSystemData] = useState({
    isLoading: true,
    serverStatus: 'checking',
    lastSync: null,
    userCount: 0
  });

  // 🎯 載入系統狀態資料
  useEffect(() => {
    const loadSystemData = async () => {
      try {
        // 模擬 API 請求，後續會替換為真實 API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSystemData({
          isLoading: false,
          serverStatus: 'online',
          lastSync: new Date(),
          userCount: 1247
        });
      } catch (error) {
        console.error('Failed to load system data:', error);
        setSystemData(prev => ({
          ...prev,
          isLoading: false,
          serverStatus: 'error'
        }));
      }
    };

    loadSystemData();
  }, []);

  return (
    <div className="dashboard">
      {/* 🎨 歡迎橫幅 */}
      <WelcomeBanner user={user} />
      
      {/* 📊 主要內容區域 */}
      <div className="dashboard-main">
        {/* 📅 左側邊欄：今日狀態 + 系統狀態 */}
        <div className="dashboard-sidebar">
          {/* 今日狀態區 */}
          <TodayStatus 
            user={user}
            isLoggedIn={isLoggedIn}
          />
          
          {/* ✅ 系統狀態區 - 移到左側邊欄 */}
          <SystemStatus 
            systemData={systemData}
            onRefresh={() => {
              setSystemData(prev => ({ ...prev, isLoading: true }));
              // 觸發重新載入
              setTimeout(() => {
                setSystemData({
                  isLoading: false,
                  serverStatus: 'online',
                  lastSync: new Date(),
                  userCount: Math.floor(Math.random() * 2000) + 1000
                });
              }, 1000);
            }}
          />
        </div>

        {/* 📋 課表預覽區 - 保持在右側 */}
        <CoursePreview />
      </div>
    </div>
  );
};

export default Dashboard;
