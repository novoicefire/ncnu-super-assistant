// frontend/src/components/0_Dashboard/CoursePreview.jsx (正常模式版)
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { robustRequest } from '../../apiHelper.js';
import CourseTable from '../1_CoursePlanner/CourseTable.jsx';

const CoursePreview = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [schedule, setSchedule] = useState({});
  const [flexibleCourses, setFlexibleCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 🎯 即時時間更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // 🎯 載入課表資料
  const loadSchedule = useCallback(async () => {
    // 🔐 正常模式：登入用戶載入真實資料
    if (!isLoggedIn || !user?.google_id) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await robustRequest('get', '/api/schedule', { 
        params: { user_id: user.google_id } 
      });
      setSchedule(data?.schedule_data || {});
      setFlexibleCourses(data?.flexible_courses || []);
    } catch (error) {
      console.error('Failed to load schedule:', error);
      setSchedule({});
      setFlexibleCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // 🎯 處理課程移除（預覽模式下跳轉到完整編輯）
  const handleCourseRemove = useCallback((courseId, time) => {
    // 在預覽模式下，點擊課程格子直接跳轉到完整編輯頁面
    navigate('/course-planner');
  }, [navigate]);

  // 🎯 獲取課表統計
  const getScheduleStats = () => {
    // 固定課表
    const courses = Object.entries(schedule)
      .filter(([key, value]) => key !== 'is_demo' && value)
      .map(([, value]) => value);
    const uniqueCourses = [...new Map(courses.map(c => [c.course_id, c])).values()];
    
    // 彈性課程
    const flexibleUnique = [...new Map(flexibleCourses.map(fc => [fc.course_id, fc])).values()];
    
    // 合併
    const allCourses = [...uniqueCourses, ...flexibleUnique];
    const allCourseCount = allCourses.length;
    const totalCredits = allCourses.reduce((sum, c) => sum + parseFloat(c.course_credit || 0), 0);
    // 固定課表時數不變
    const totalHours = courses.length;
    
    return { courseCount: allCourseCount, totalCredits, totalHours };
  };

  const stats = getScheduleStats();

  return (
    <div className="course-preview glass-effect">
      {/* ✅ 標題列 + 折疊按鈕 */}
      <div className="course-preview-header">
        <div className="header-left">
          <h3 className="gradient-text">📋 我的課表預覽</h3>
          <div className="current-time">
            {currentTime.toLocaleString('zh-TW', {
              weekday: 'long',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        <div className="header-right">
          <div className="schedule-stats">
            <div className="stat-item">
              <span className="stat-number">{stats.courseCount}</span>
              <span className="stat-label">門課程</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.totalCredits}</span>
              <span className="stat-label">學分</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.totalHours}</span>
              <span className="stat-label">時數</span>
            </div>
          </div>
          <button 
            className="preview-action-btn apple-button"
            onClick={() => navigate('/course-planner')}
          >
            完整編輯 →
          </button>
          <button 
            className="collapse-toggle mobile-only"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? '展開課表預覽' : '收起課表預覽'}
          >
            <span className={`toggle-icon ${isCollapsed ? 'collapsed' : ''}`}>
              ▼
            </span>
          </button>
        </div>
      </div>

      {/* ✅ 可折疊內容區域 */}
      <div className={`collapsible-content ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="course-preview-content">
          {isLoading ? (
            <div className="preview-loading">
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>載入課表資料中...</p>
              </div>
            </div>
          ) : !isLoggedIn ? (
            <div className="preview-placeholder">
              <div className="placeholder-content">
                <div className="placeholder-icon">🔐</div>
                <h4>登入查看您的課表</h4>
                <p>登入後即可在此預覽您的課程安排</p>
                <button 
                  className="placeholder-btn apple-button"
                  onClick={() => window.location.reload()}
                >
                  立即登入
                </button>
              </div>
            </div>
          ) : Object.keys(schedule).length === 0 ? (
            <div className="preview-placeholder">
              <div className="placeholder-content">
                <div className="placeholder-icon">🎯</div>
                <h4>開始規劃您的課程</h4>
                <p>前往智慧排課頁面開始安排您的學習時光</p>
                <button 
                  className="placeholder-btn apple-button"
                  onClick={() => navigate('/course-planner')}
                >
                  開始排課
                </button>
              </div>
            </div>
          ) : (
            <div className="course-table-container">
              {/* ✅ 直接使用 CourseTable 組件 */}
              <CourseTable 
                schedule={schedule} 
                onRemove={handleCourseRemove}
              />
            </div>
          )}
        </div>

        {/* 🎯 課表圖例 */}
        {!isLoading && Object.keys(schedule).length > 0 && (
          <div className="table-legend">
            <div className="legend-item">
              <div className="legend-dot current"></div>
              <span>當前時段</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot course"></div>
              <span>已安排課程</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot empty"></div>
              <span>空堂時間</span>
            </div>
          </div>
        )}
      </div>

      {/* ✅ 手機版折疊樣式 */}
      <style jsx>{`
        .course-preview {
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .course-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px 24px 0;
        }

        .header-left {
          flex: 1;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .collapse-toggle {
          display: none;
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.3s ease;
          color: var(--theme-text-primary);
        }

        .collapse-toggle:hover {
          background: var(--theme-bg-hover);
        }

        .toggle-icon {
          display: inline-block;
          transition: transform 0.3s ease;
          font-size: 14px;
        }

        .toggle-icon.collapsed {
          transform: rotate(-90deg);
        }

        .collapsible-content {
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          max-height: 2000px;
          opacity: 1;
        }

        .collapsible-content.collapsed {
          max-height: 0;
          opacity: 0;
          padding-top: 0;
          padding-bottom: 0;
        }

        .course-preview .course-table {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }
        
        /* ✅ 統計區塊圓角修復 */
        .schedule-stats {
          display: flex;
          gap: 12px;
        }
        
        .stat-item {
          background: var(--theme-bg-secondary, #f8f9fa) !important;
          border: 1px solid var(--theme-border-primary, #e9ecef) !important;
          border-radius: 12px !important;
          padding: 12px 16px !important;
          text-align: center !important;
          min-width: 60px !important;
          transition: all 0.3s ease !important;
          box-shadow: var(--theme-shadow-primary, 0 2px 4px rgba(0,0,0,0.1)) !important;
        }
        
        .stat-item:hover {
          transform: translateY(-2px) !important;
          box-shadow: var(--theme-shadow-hover, 0 4px 8px rgba(0,0,0,0.15)) !important;
        }
        
        .stat-number {
          display: block !important;
          font-size: 1.2rem !important;
          font-weight: 700 !important;
          color: var(--theme-text-primary, #333) !important;
          margin-bottom: 4px !important;
        }
        
        .stat-label {
          display: block !important;
          font-size: 0.75rem !important;
          color: var(--theme-text-secondary, #666) !important;
          font-weight: 500 !important;
        }
        
        /* ✅ 深色模式統計區塊 */
        [data-theme="dark"] .stat-item {
          background: var(--theme-bg-secondary, #2d3748) !important;
          border-color: var(--theme-border-primary, #4a5568) !important;
        }
        
        [data-theme="dark"] .stat-number {
          color: var(--theme-text-primary, #f7fafc) !important;
        }
        
        [data-theme="dark"] .stat-label {
          color: var(--theme-text-secondary, #a0aec0) !important;
        }
        
        .preview-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
        }
        
        .loading-spinner {
          text-align: center;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #00796b;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .course-table-container {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--theme-shadow-primary);
        }

        /* ✅ 手機版樣式 */
        @media (max-width: 768px) {
          .collapse-toggle {
            display: block;
          }

          .mobile-only {
            display: block !important;
          }

          .course-preview-header {
            flex-direction: column;
            gap: 16px;
            padding: 16px 20px 0;
          }

          .header-right {
            width: 100%;
            justify-content: space-between;
          }

          .schedule-stats {
            flex: 1;
            justify-content: flex-start;
          }

          .collapsible-content {
            padding: 0 20px 20px;
          }

          .collapsible-content.collapsed {
            padding: 0 20px 0;
          }

          .stat-item {
            padding: 8px 12px !important;
            min-width: 50px !important;
            border-radius: 10px !important;
          }
          
          .stat-number {
            font-size: 1rem !important;
            margin-bottom: 2px !important;
          }
          
          .stat-label {
            font-size: 0.7rem !important;
          }
        }

        @media (max-width: 480px) {
          .course-preview-header {
            padding: 12px 16px 0;
          }

          .collapsible-content {
            padding: 0 16px 16px;
          }

          .header-left h3 {
            font-size: 1.1rem;
          }

          .current-time {
            font-size: 0.8rem;
          }

          .schedule-stats {
            gap: 8px;
          }

          .preview-action-btn {
            font-size: 0.8rem;
            padding: 6px 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default CoursePreview;
