// frontend/src/components/0_Dashboard/TodayStatus.jsx (Refactored with Hook)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import StatusCard from './StatusCard.jsx';
import { robustRequest } from '../../apiHelper.js';
import { useCalendarEvents } from '../../hooks/useCalendarEvents'; // 導入新的 Hook

const RECOMMENDED_MIN_CREDITS = 16; // 建議最低學分
const RECOMMENDED_MAX_CREDITS = 22; // 建議最高學分

const TodayStatus = () => {
  const { user, isLoggedIn } = useAuth();
  const { events: allCalendarEvents, loading: calendarLoading } = useCalendarEvents(); // 使用 Hook

  const [activeCard, setActiveCard] = useState(null);
  const todayStatusRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [todayData, setTodayData] = useState({
    courses: [],
    events: [],
    totalCredits: 0,
    creditDetails: {},
    isLoading: true,
    lastUpdate: null
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (todayStatusRef.current && !todayStatusRef.current.contains(event.target)) {
        setActiveCard(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCardClick = (cardId) => {
    setActiveCard(prevActiveCard => (prevActiveCard === cardId ? null : cardId));
  };

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
          classroom: course.location || '未指定教室',
          periods,
          isUpcoming: isUpcomingCourse(timeInfo.start),
          isInProgress: isInProgressCourse(timeInfo.start, timeInfo.end)
        });
      }
    });

    return todayCourses.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

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

  const isUpcomingCourse = (startTime) => {
    const now = new Date();
    const [hours, minutes] = startTime.split(':').map(Number);
    const courseTime = new Date();
    courseTime.setHours(hours, minutes, 0, 0);
    const timeDiff = courseTime - now;
    return timeDiff > 0 && timeDiff <= 30 * 60 * 1000; // 30分鐘內
  };

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

  const calculateTotalCredits = (schedule) => {
    if (!schedule) return 0;
    const uniqueCourses = [...new Map(
      Object.values(schedule).map(item => [item.course_id, item])
    ).values()];
    return uniqueCourses.reduce((sum, course) => 
      sum + parseFloat(course.course_credit || 0), 0
    );
  };

  const calculateCreditDetails = (schedule) => {
    const defaultResult = {
      totalCredits: 0,
      courseCount: 0,
      categories: {
        '必修': { credits: 0, courses: [] },
        '選修': { credits: 0, courses: [] },
        '通識': { credits: 0, courses: [] },
        '其他': { credits: 0, courses: [] }
      },
      recommendedMin: RECOMMENDED_MIN_CREDITS,
      recommendedMax: RECOMMENDED_MAX_CREDITS
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
        recommendedMin: RECOMMENDED_MIN_CREDITS,
        recommendedMax: RECOMMENDED_MAX_CREDITS
      };
    } catch (error) {
      console.error('計算學分詳情時發生錯誤:', error);
      return defaultResult;
    }
  };

  // 載入課表資料
  const loadScheduleData = useCallback(async () => {
    if (!isLoggedIn || !user?.google_id) {
      setTodayData(prev => ({ ...prev, isLoading: false, lastUpdate: new Date() }));
      return;
    }
    try {
      const schedule = await robustRequest('get', '/api/schedule', { params: { user_id: user.google_id } });
      const todayCourses = getTodayCourses(schedule);
      const totalCredits = calculateTotalCredits(schedule);
      const creditDetails = calculateCreditDetails(schedule);
      setTodayData(prev => ({
        ...prev,
        courses: todayCourses,
        totalCredits,
        creditDetails,
        isLoading: calendarLoading, // Loading state now depends on calendar events too
        lastUpdate: new Date()
      }));
    } catch (error) {
      console.error('Failed to load schedule data:', error);
      setTodayData(prev => ({ ...prev, isLoading: false }));
    }
  }, [isLoggedIn, user, calendarLoading]);

  // 當從 Hook 拿到行事曆資料後，篩選出今天的活動
  useEffect(() => {
    if (!calendarLoading) {
      const today = new Date();
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
      const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));

      const todaysEvents = allCalendarEvents.filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return (eventStart >= todayStart && eventStart <= todayEnd) || (eventEnd >= todayStart && eventStart < todayStart);
      });
      setTodayData(prev => ({ ...prev, events: todaysEvents }));
    }
  }, [allCalendarEvents, calendarLoading]);

  useEffect(() => {
    loadScheduleData();
    const intervalId = setInterval(loadScheduleData, 300000);
    return () => clearInterval(intervalId);
  }, [loadScheduleData]);

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
            <div className="event-content">
              <h4 className="event-title">{event.summary}</h4>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCreditsCard = () => {
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
    const PROGRESS_BAR_MAX_CREDITS = 25; // 定義進度條的滿格為 25 學分
    const progressPercentage = Math.min((totalCredits / PROGRESS_BAR_MAX_CREDITS) * 100, 100);

    return (
      <div className="credits-overview">
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
            {/* 🎯 新增：建議學分範圍標記 */}
            <div
              className="suggestion-marker"
              style={{ left: `${(recommendedMin / PROGRESS_BAR_MAX_CREDITS) * 100}%` }}
              title={`建議最低學分: ${recommendedMin}`}
            >
            </div>
            <div
              className="suggestion-marker"
              style={{ left: `${(recommendedMax / PROGRESS_BAR_MAX_CREDITS) * 100}%` }}
              title={`建議最高學分: ${recommendedMax}`}
            >
            </div>
          </div>
          <div className="progress-markers">
            <span className="marker min-marker">0</span>
            <span className="marker max-marker">{PROGRESS_BAR_MAX_CREDITS}</span>
          </div>
        </div>

        <div className="credits-breakdown">
          <h5 className="breakdown-title">學分分佈</h5>
          <div className="category-list">
            {categories && typeof categories === 'object' ? 
              Object.entries(categories).map(([categoryName, categoryData]) => {
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
    <div className="today-status glass-effect" ref={todayStatusRef}>
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
              isClickable={true}
              isOpen={activeCard === 'courses'}
              onClick={() => handleCardClick('courses')}
              animationDelay={100}
            />
            
            <StatusCard
              icon="🎯"
              title="校園活動"
              value={`${todayData.events.length} 項活動`}
              status={todayData.events.length > 0 ? 'active' : 'empty'}
              cardContent={renderEventsCard()}
              isClickable={true}
              isOpen={activeCard === 'events'}
              onClick={() => handleCardClick('events')}
              animationDelay={200}
            />
            
            <StatusCard
              icon="⭐"
              title="總學分"
              value={`${todayData.totalCredits} 學分`}
              status={todayData.totalCredits > 0 ? 'active' : 'empty'}
              cardContent={renderCreditsCard()}
              isClickable={true}
              isOpen={activeCard === 'credits'}
              onClick={() => handleCardClick('credits')}
              animationDelay={300}
            />
          </div>
        )}
      </div>

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

        /* 🎯 新增：建議標記樣式 (移至全域範圍) */
        .progress-bar {
          position: relative; /* 讓標記可以相對於它定位 */
        }

        .suggestion-marker {
          position: absolute;
          top: -4px; /* 向上偏移一點，使其突出 */
          bottom: -4px; /* 向下偏移一點，使其突出 */
          width: 2px;
          background-color: rgba(108, 117, 125, 0.5); /* 半透明灰色 */
          transform: translateX(-50%); /* 將標記置中於其 left 位置 */
          z-index: 1; /* 確保在進度條填充色的上方 */
        }

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
