// frontend/src/App.jsx (完整版)

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 引入頁面組件
import CoursePlanner from './components/1_CoursePlanner/CoursePlanner.jsx';
import GraduationTracker from './components/2_GraduationTracker/GraduationTracker.jsx';
import CampusDirectory from './components/3_CampusDirectory/CampusDirectory.jsx';
import UniversityCalendar from './components/4_UniversityCalendar/UniversityCalendar.jsx';
import Navbar from './components/Navbar.jsx'; // 引入新的 Navbar

// 引入全域樣式
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar /> {/* 使用新的 Navbar 組件 */}
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