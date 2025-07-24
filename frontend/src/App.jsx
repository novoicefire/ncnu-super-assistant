// frontend/src/App.jsx (傳遞免責聲明狀態版)
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// 引入页面组件
import CoursePlanner from './components/1_CoursePlanner/CoursePlanner.jsx';
import GraduationTracker from './components/2_GraduationTracker/GraduationTracker.jsx';
import CampusDirectory from './components/3_CampusDirectory/CampusDirectory.jsx';
import UniversityCalendar from './components/4_UniversityCalendar/UniversityCalendar.jsx';
import UpdateLog from './components/5_UpdateLog/UpdateLog.jsx';
import Navbar from './components/Navbar.jsx';
import DisclaimerModal from './components/DisclaimerModal.jsx';

// 引入全域样式
import './App.css';

function App() {
  // 🎯 免責聲明狀態管理
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false); // 🎯 新增：免責聲明確認狀態

  // 🎯 處理免責聲明確認
  const handleAcceptDisclaimer = () => {
    setShowDisclaimer(false);
    setDisclaimerAccepted(true); // 🎯 新增：設定已確認狀態
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
      {/* 🎯 免責聲明公告欄 */}
      <DisclaimerModal 
        isVisible={showDisclaimer} 
        onAccept={handleAcceptDisclaimer} 
      />

      {/* 🎯 主應用程式內容 */}
      <div className="app-container">
        {/* 🎯 修改：傳遞免責聲明確認狀態到 Navbar */}
        <Navbar disclaimerAccepted={disclaimerAccepted} />
        <div className="container">
          <Routes>
            <Route path="/" element={<CoursePlanner />} />
            <Route path="/tracker" element={<GraduationTracker />} />
            <Route path="/directory" element={<CampusDirectory />} />
            <Route path="/calendar" element={<UniversityCalendar />} />
            <Route path="/updates" element={<UpdateLog />} />
          </Routes>
        </div>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
