import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CoursePlanner from './components/1_CoursePlanner/CoursePlanner.jsx';
import GraduationTracker from './components/2_GraduationTracker/GraduationTracker.jsx';
import CampusDirectory from './components/3_CampusDirectory/CampusDirectory.jsx';
import UniversityCalendar from './components/4_UniversityCalendar/UniversityCalendar.jsx';
import './App.css';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">暨大生超級助理</Link>
      <div className="nav-links">
        <Link to="/">智慧排課</Link>
        <Link to="/tracker">畢業進度</Link>
        <Link to="/directory">校園通訊錄</Link>
        <Link to="/calendar">學校行事曆</Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
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