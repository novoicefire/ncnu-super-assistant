// Triggering develop branch deployment on Vercel
// frontend/src/App.jsx (加入 Toaster)

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // [核心修改] 1. 导入 Toaster

// 引入页面组件
import CoursePlanner from './components/1_CoursePlanner/CoursePlanner.jsx';
import GraduationTracker from './components/2_GraduationTracker/GraduationTracker.jsx';
import CampusDirectory from './components/3_CampusDirectory/CampusDirectory.jsx';
import UniversityCalendar from './components/4_UniversityCalendar/UniversityCalendar.jsx';
import Navbar from './components/Navbar.jsx';

// 引入全域样式
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        {/* [核心修改] 2. 将 Toaster 元件放置在应用程式的顶层 */}
        {/* 它会处理所有 toast 通知的渲染，放在这里最合适 */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000, // 默认持续 3 秒
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <Navbar />
        <main className="container">
          <Routes>
            <Route path="/" element={<CoursePlanner />} />
            <Route path="/tracker" element={<GraduationTracker />} />
            <Route path="/directory" element={<CampusDirectory />} />
            <Route path="/calendar" element={<UniversityCalendar />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;