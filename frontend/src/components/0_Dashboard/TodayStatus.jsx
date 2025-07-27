// frontend/src/components/0_Dashboard/TodayStatus.jsx (錯誤修復版)
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import StatusCard from './StatusCard.jsx';
import { robustRequest, getTodayEvents } from '../../apiHelper.js';

const TodayStatus = () => {
  const { user, isLoggedIn } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [todayData, setTodayData] = useState({
    courses: [],
    events: [],
    totalCredits: 0,
    creditDetails: {
      totalCredits: 0,
      courseCount: 0,
      categories: {},
      recommendedMin: 18,
      recommendedMax: 25
    }, // ✅ 修復：提供預設值
    isLoading: true,
    lastUpdate: null
  });

  // 🎯 載入今日資料
  const loadTodayData = useCallback(async () => {
    if (!isLoggedIn || !user?.google_id) {
      setTodayData(prev => ({
        ...prev,
        isLoading: false,
        lastUpdate: new Date()
      }));
      return;
    }

    try {
      // 並行載入課表和活動資料
      const [schedule, events] = await Promise.all([
        robustRequest('get', '/api/schedule', { params: { user_id: user.google_id } }),
        getTodayEvents()
      ]);

      const todayCourses = getTodayCourses(schedule);
      const totalCredits = calculateTotalCredits(schedule);
      const creditDetails = calculateCreditDetails(schedule);

      setTodayData({
        courses: todayCourses,
        events: events || [],
        totalCredits,
        creditDetails,
        isLoading: false,
        lastUpdate: new Date()
      });
    } catch (error) {
      console.error('Failed to load today data:', error);
      setTodayData(prev => ({
        ...prev,
        isLoading: false,
        lastUpdate: new Date()
      }));
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    loadTodayData();
    // 每 5 分鐘自動更新
    const intervalId = setInterval(loadTodayData, 300000);
    return () => clearInterval(intervalId);
  }, [loadTodayData]);

  // 🎯 獲取今日課程
  const getTodayCourses = (schedule) => {
    if (!schedule) return [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return [];

    const todayCourses = [];
    const processedCourses = new Set();

    Object.values(schedule).forEach(course => {
      if (!course || !course.time) return;
      const timePattern = new RegExp(`${dayOfWeek}[a-zA-Z]+`);
      if (timePattern.test(course.time) && !processedCourses.has(course.course_id)) {
        processedCourses.add(course.course_id);
        const periods = course.time.match(new RegExp(`${dayOfWeek}([a-zA-Z]+)`))?.[1] || '';
        const timeInfo = getTimeFromPeriods(periods);
        
        todayCourses.push({
          id: course.course_id,
          name: course.course_cname,
          teacher: course.teacher,
          startTime: timeInfo.start,
          endTime: timeInfo.end,
          timeRange: `${timeInfo.start}-${timeInfo.end}`,
          classroom: course.classroom || '未指定教室',
          periods,
          isUpcoming: isUpcomingCourse(timeInfo.start),
          isInProgress: isInProgressCourse(timeInfo.start, timeInfo.end)
        });
      }
    });

    return todayCourses.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // 🎯 節次轉換為時間範圍
  const getTimeFromPeriods = (periods) => {
    const timeMap = {
      'a': { start: '08:00', end: '09:00' },
      'b': { start: '09:00', end: '10:00' },
      'c': { start: '10:00', end: '11:00' },
      'd': { start: '11:00', end: '12:00' },
      'z': { start: '12:00', end: '13:00' },
      'e': { start: '13:00', end: '14:00' },
      'f': { start: '14:00', end: '15:00' },
      'g': { start: '15:00', end: '16:00' },
      'h': { start: '16:00', end: '17:00' },
      'i': { start: '17:00', end: '18:00' },
      'j': { start: '18:00', end: '19:00' },
      'k': { start: '19:00', end: '20:00' },
      'l': { start: '20:00', end: '21:00' }
    };

    if (periods.length === 0) {
      return { start: '時間未定', end: '時間未定' };
    }

    const firstPeriod = periods[0];
    const lastPeriod = periods[periods.length - 1];

    return {
      start: timeMap[firstPeriod]?.start || '時間未定',
      end: timeMap[lastPeriod]?.end || '時間未定'
    };
  };

  // 🎯 判斷是否為即將開始的課程
  const isUpcomingCourse = (startTime) => {
    const now = new Date();
    const [hours, minutes] = startTime.split(':').map(Number);
    const courseTime = new Date();
    courseTime.setHours(hours, minutes, 0, 0);
    const timeDiff = courseTime - now;
    return timeDiff > 0 && timeDiff <= 30 * 60 * 1000; // 30分鐘內
  };

  // 🎯 判斷是否為進行中的課程
  const isInProgressCourse = (startTime, endTime) => {
    const now = new Date();
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const courseStart = new Date();
    courseStart.setHours(startHours, startMinutes, 0, 0);
    const courseEnd = new Date();
    courseEnd.setHours(endHours, endMinutes, 0, 0);
    
    return now >= courseStart && now <= courseEnd;
  };

  // 🎯 計算總學分
  const calculateTotalCredits = (schedule) => {
    if (!schedule) return 0;
    const uniqueCourses = [...new Map(
      Object.values(schedule).map(item => [item.course_id, item])
    ).values()];
    return uniqueCourses.reduce((sum, course) => 
      sum + parseFloat(course.course_credit || 0), 0
    );
  };

  // ✅ 修復：計算學分詳細資訊，添加防護檢查
  const calculateCreditDetails = (schedule) => {
    // ✅ 返回預設值結構
    const defaultResult = {
      totalCredits: 0,
      courseCount: 0,
      categories: {
        '必修': { credits: 0, courses: [] },
        '選修': { credits: 0, courses: [] },
        '通識': { credits: 0, courses: [] },
        '其他': { credits: 0, courses: [] }
      },
      recommendedMin: 18,
      recommendedMax: 25
    };

    if (!schedule || typeof schedule !== 'object') {
      return defaultResult;
    }

    try {
      const uniqueCourses = [...new Map(
        Object.values(schedule).map(item => [item.course_id, item])
      ).values()];

      const categories = {
        '必修': { credits: 0, courses: [] },
        '選修': { credits: 0, courses: [] },
        '通識': { credits: 0, courses: [] },
        '其他': { credits: 0, courses: [] }
      };

      uniqueCourses.forEach(course => {
        if (!course) return;
        
        const credits = parseFloat(course.course_credit || 0);
        const courseName = course.course_cname || '';
        
        // 根據課程名稱或類型判斷類別
        let category = '其他';
        if (courseName.includes('必修') || course.course_type === 'required') {
          category = '必修';
        } else if (courseName.includes('通識') || course.course_type === 'general') {
          category = '通識';
        } else if (course.course_type === 'elective') {
          category = '選修';
        }

        categories[category].credits += credits;
        categories[category].courses.push({
          name: courseName,
          credits: credits,
          teacher: course.teacher || '未指定教師'
        });
      });

      const totalCredits = uniqueCourses.reduce((sum, course) => 
        sum + parseFloat(course.course_credit || 0), 0
      );

      return {
        totalCredits,
        courseCount: uniqueCourses.length,
        categories,
        recommendedMin: 18,
        recommendedMax: 25
      };
    } catch (error) {
      console.error('計算學分詳情時發生錯誤:', error);
      return defaultResult;
    }
  };

  // 🎯 渲染今日課程卡片內容
  const renderCoursesCard = () => {
    if (todayData.courses.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h4>今日沒有課程</h4>
          <p>請好好休息或安排其他活動</p>
        </div>
      );
    }

    return (
      <div className="courses-timeline">
        {todayData.courses.map((course, index) => (
          <div 
            key={course.id} 
            className={`course-item ${course.isInProgress ? 'in-progress' : ''} ${course.isUpcoming ? 'upcoming' : ''}`}
          >
            <div className="course-time">
              <span className="time-range">{course.timeRange}</span>
              {course.isInProgress && <span className="live-badge">進行中</span>}
              {course.isUpcoming && <span className="upcoming-badge">即將開始</span>}
            </div>
            <div className="course-details">
              <h4 className="course-name">{course.name}</h4>
              <p className="course-info">
                <span className="teacher">👨‍🏫 {course.teacher}</span>
                <span className="classroom">📍 {course.classroom}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 🎯 渲染活動卡片內容
  const renderEventsCard = () => {
    if (todayData.events.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h4>今日沒有特別活動</h4>
          <p>關注學校官網獲取最新消息</p>
        </div>
      );
    }

    return (
      <div className="events-list">
        {todayData.events.map((event, index) => (
          <div key={index} className="event-item">
            <div className="event-time">{event.time}</div>
            <div className="event-content">
              <h4 className="event-title">{event.title}</h4>
              <p className="event-location">{event.location}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ✅ 修復：渲染總學分卡片內容，添加完整的防護檢查
  const renderCreditsCard = () => {
    // ✅ 防護檢查：確保 creditDetails 存在
    if (!todayData.creditDetails) {
      return (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h4>載入學分資料中</h4>
          <p>請稍候片刻...</p>
        </div>
      );
    }

    const { totalCredits, courseCount, categories, recommendedMin, recommendedMax } = todayData.creditDetails;

    if (totalCredits === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h4>尚未選修課程</h4>
          <p>前往課程規劃頁面開始安排您的學習計劃</p>
        </div>
      );
    }

    // 計算學分狀態
    const getCreditsStatus = () => {
      if (totalCredits < recommendedMin) {
        return { type: 'low', message: '學分偏少，建議增加課程', color: '#ffc107' };
      } else if (totalCredits > recommendedMax) {
        return { type: 'high', message: '學分較多，注意學習負擔', color: '#dc3545' };
      } else {
        return { type: 'good', message: '學分安排合理', color: '#28a745' };
      }
    };

    const status = getCreditsStatus();
    const progressPercentage = Math.min((totalCredits / recommendedMax) * 100, 100);

    return (
      <div className="credits-overview">
        {/* 學分總覽 */}
        <div className="credits-summary">
          <div className="credits-main">
            <div className="credits-number">{totalCredits}</div>
            <div className="credits-unit">學分</div>
          </div>
          <div className="credits-info">
            <div className="course-count">{courseCount} 門課程</div>
            <div className="credits-status" style={{ color: status.color }}>
              {status.message}
            </div>
          </div>
        </div>

        {/* 學分進度條 */}
        <div className="credits-progress">
          <div className="progress-header">
            <span className="progress-label">學分進度</span>
            <span className="progress-range">{recommendedMin}-{recommendedMax} 學分（建議）</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${progressPercentage}%`,
                backgroundColor: status.color 
              }}
            ></div>
            {totalCredits > recommendedMax && (
              <div 
                className="progress-overflow"
                style={{ 
                  width: `${((totalCredits - recommendedMax) / recommendedMax) * 100}%` 
                }}
              ></div>
            )}
          </div>
          <div className="progress-markers">
            <span className="marker min-marker">{recommendedMin}</span>
            <span className="marker max-marker">{recommendedMax}</span>
          </div>
        </div>

        {/* ✅ 修復：學分分類統計，添加防護檢查 */}
        <div className="credits-breakdown">
          <h5 className="breakdown-title">學分分佈</h5>
          <div className="category-list">
            {categories && typeof categories === 'object' ? 
              Object.entries(categories).map(([categoryName, categoryData]) => {
                // ✅ 防護檢查：確保 categoryData 存在且有 credits 屬性
                if (!categoryData || !categoryData.credits || categoryData.credits === 0) {
                  return null;
                }
                
                return (
                  <div key={categoryName} className="category-item">
                    <div className="category-header">
                      <span className="category-name">{categoryName}</span>
                      <span className="category-credits">{categoryData.credits} 學分</span>
                    </div>
                    <div className="category-courses">
                      {categoryData.courses && Array.isArray(categoryData.courses) ? 
                        categoryData.courses.slice(0, 3).map((course, index) => (
                          <div key={index} className="course-summary">
                            <span className="course-summary-name">{course.name || '未知課程'}</span>
                            <span className="course-summary-credits">({course.credits || 0})</span>
                          </div>
                        )) : null
                      }
                      {categoryData.courses && categoryData.courses.length > 3 && (
                        <div className="more-courses">
                          +{categoryData.courses.length - 3} 門課程
                        </div>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="no-categories">
                  <p>暫無課程分類資料</p>
                </div>
              )
            }
          </div>
        </div>

        {/* 學分建議 */}
        <div className="credits-recommendations">
          <h5 className="rec-title">💡 學分建議</h5>
          <div className="rec-content">
            {status.type === 'low' && (
              <>
                <p>目前學分偏少，建議：</p>
                <ul>
                  <li>考慮增加 {recommendedMin - totalCredits} 學分</li>
                  <li>選修感興趣的通識課程</li>
                  <li>提前修習下學期必修課程</li>
                </ul>
              </>
            )}
            {status.type === 'high' && (
              <>
                <p>學分較多，請注意：</p>
                <ul>
                  <li>合理安排讀書時間</li>
                  <li>避免期末考試衝突</li>
                  <li>考慮是否需要調整課程</li>
                </ul>
              </>
            )}
            {status.type === 'good' && (
              <>
                <p>學分安排很棒！建議：</p>
                <ul>
                  <li>保持良好的學習節奏</li>
                  <li>關注各科目平衡發展</li>
                  <li>預留時間參與課外活動</li>
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const formatLastUpdate = () => {
    if (!todayData.lastUpdate) return '';
    return todayData.lastUpdate.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="today-status glass-effect">
      {/* ✅ 標題列 + 折疊按鈕 */}
      <div className="today-status-header">
        <div className="header-content">
          <h3 className="gradient-text">📅 今日狀態</h3>
          {formatLastUpdate() && (
            <span className="last-update">更新於 {formatLastUpdate()}</span>
          )}
        </div>
        <button 
          className="collapse-toggle mobile-only"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? '展開今日狀態' : '收起今日狀態'}
        >
          <span className={`toggle-icon ${isCollapsed ? 'collapsed' : ''}`}>
            ▼
          </span>
        </button>
      </div>

      {/* ✅ 可折疊內容區域 */}
      <div className={`collapsible-content ${isCollapsed ? 'collapsed' : ''}`}>
        {todayData.isLoading ? (
          <div className="loading-state">
            <div className="loading-animation">
              <div className="pulse-circle"></div>
              <p>載入今日資料中...</p>
            </div>
          </div>
        ) : (
          <div className="status-grid">
            <StatusCard
              icon="📚"
              title="今日課程"
              value={`${todayData.courses.length} 堂課`}
              status={todayData.courses.length > 0 ? 'active' : 'empty'}
              cardContent={renderCoursesCard()}
              animationDelay={100}
            />
            
            <StatusCard
              icon="🎯"
              title="校園活動"
              value={`${todayData.events.length} 項活動`}
              status={todayData.events.length > 0 ? 'active' : 'empty'}
              cardContent={renderEventsCard()}
              animationDelay={200}
            />
            
            <StatusCard
              icon="⭐"
              title="總學分"
              value={`${todayData.totalCredits} 學分`}
              status={todayData.totalCredits > 0 ? 'active' : 'empty'}
              cardContent={renderCreditsCard()}
              animationDelay={300}
            />
          </div>
        )}
      </div>

      {/* ✅ 手機版折疊樣式 */}
      <style jsx>{`
        .today-status {
          margin-bottom: 20px;
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .today-status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px 0;
        }

        .header-content {
          flex: 1;
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
          max-height: 1000px;
          opacity: 1;
        }

        .collapsible-content.collapsed {
          max-height: 0;
          opacity: 0;
          padding-top: 0;
          padding-bottom: 0;
        }

        /* ✅ 手機版樣式 */
        @media (max-width: 768px) {
          .collapse-toggle {
            display: block;
          }

          .mobile-only {
            display: block !important;
          }

          .today-status-header {
            padding: 16px 20px 0;
          }

          .collapsible-content {
            padding: 0 20px 20px;
          }

          .collapsible-content.collapsed {
            padding: 0 20px 0;
          }

          .status-grid {
            gap: 12px;
          }
        }

        @media (max-width: 480px) {
          .today-status-header {
            padding: 12px 16px 0;
          }

          .collapsible-content {
            padding: 0 16px 16px;
          }

          .header-content h3 {
            font-size: 1.1rem;
          }

          .last-update {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TodayStatus;
