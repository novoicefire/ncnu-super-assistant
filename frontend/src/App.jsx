// frontend/src/App.jsx (整合 AdBlock 檢測器版本)
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// 引入页面组件
import CoursePlanner from './components/1_CoursePlanner/CoursePlanner.jsx';
import GraduationTracker from './components/2_GraduationTracker/GraduationTracker.jsx';
import CampusDirectory from './components/3_CampusDirectory/CampusDirectory.jsx';
import UniversityCalendar from './components/4_UniversityCalendar/UniversityCalendar.jsx';
import UpdateLog from './components/5_UpdateLog/UpdateLog.jsx';
import PostsPage from './components/PostsPage/PostsPage.jsx';
import AdminPanel from './components/AdminPanel/AdminPanel.jsx';
import Navbar from './components/Navbar.jsx';
import DisclaimerModal from './components/DisclaimerModal.jsx';
import AdBlockDetector from './components/AdBlockDetector.jsx'; // 🎯 新增：AdBlock 檢測器

// 引入全域样式
import './App.css';

function App() {
  // 🎯 免責聲明狀態管理
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  // 🎯 處理免責聲明確認
  const handleAcceptDisclaimer = () => {
    setShowDisclaimer(false);
  };

  // 🎯 防止背景滾動
  useEffect(() => {
    if (showDisclaimer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // 清理函數
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDisclaimer]);

  return (
    <Router>
      <AdBlockDetector> {/* 🎯 新增：AdBlock 檢測包裹器開始 */}
        {/* 🎯 免責聲明公告欄 */}
        <DisclaimerModal 
          isVisible={showDisclaimer} 
          onAccept={handleAcceptDisclaimer} 
        />

        {/* 🎯 主應用程式內容 */}
        <div className="app-container">
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/" element={<CoursePlanner />} />
              <Route path="/tracker" element={<GraduationTracker />} />
              <Route path="/directory" element={<CampusDirectory />} />
              <Route path="/calendar" element={<UniversityCalendar />} />
              <Route path="/updates" element={<UpdateLog />} />
              <Route path="/posts" element={<PostsPage />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </div>
          <Toaster />
        </div>
      </AdBlockDetector> {/* 🎯 新增：AdBlock 檢測包裹器結束 */}
    </Router>
  );
}

export default App;
