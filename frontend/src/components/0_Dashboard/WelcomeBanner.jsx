// frontend/src/components/0_Dashboard/WelcomeBanner.jsx (整合版 - 混合航班卡片風格 + i18n + 實時天氣)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../AuthContext.jsx';
import { robustRequest } from '../../apiHelper.js';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faGraduationCap,
  faClock,
  faQuoteLeft,
  faBook,
  faCalendarCheck,
  faStar,
  faChevronDown,
  faChevronUp,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import WeatherWidget from './WeatherWidget';

// 勵志語錄庫
const motivationalQuotes = [
  { text: "學習是人生最好的投資", author: "班傑明·富蘭克林" },
  { text: "千里之行，始於足下", author: "老子" },
  { text: "知識就是力量", author: "培根" },
  { text: "今天的努力是明天的收穫", author: "諺語" },
  { text: "堅持就是勝利", author: "諺語" },
  { text: "學而不思則罔，思而不學則殆", author: "孔子" },
  { text: "書山有路勤為徑，學海無涯苦作舟", author: "韓愈" },
  { text: "活到老，學到老", author: "諺語" },
  { text: "成功來自堅持不懈", author: "諺語" },
  { text: "不積跬步，無以至千里", author: "荀子" }
];

const RECOMMENDED_MIN_CREDITS = 16;
const RECOMMENDED_MAX_CREDITS = 22;

const getSemesterProgress = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  let semesterStart;
  if (month >= 8) {
    semesterStart = new Date(year, 8, 9);
  } else if (month >= 1) {
    semesterStart = new Date(year, 1, 17);
  } else {
    semesterStart = new Date(year - 1, 8, 9);
  }
  const weeksPassed = Math.floor((now - semesterStart) / (7 * 24 * 60 * 60 * 1000));
  const currentWeek = Math.max(1, Math.min(18, weeksPassed + 1));
  const totalWeeks = 18;
  const progress = (currentWeek / totalWeeks) * 100;
  return { currentWeek, totalWeeks, progress };
};

const WelcomeBanner = () => {
  const { user, isLoggedIn } = useAuth();
  const { t, i18n } = useTranslation();
  const { events: allCalendarEvents, loading: calendarLoading } = useCalendarEvents();

  const [quote, setQuote] = useState(null);
  const [semesterProgress] = useState(getSemesterProgress());
  const [expandedCard, setExpandedCard] = useState(null);
  const bannerRef = useRef(null);

  const [todayData, setTodayData] = useState({
    courses: [],
    events: [],
    totalCredits: 0,
    isLoading: true
  });

  useEffect(() => {
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setQuote(randomQuote);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bannerRef.current && !bannerRef.current.contains(event.target)) {
        setExpandedCard(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    if (!periods || periods.length === 0) return { start: '時間未定', end: '時間未定' };
    return {
      start: timeMap[periods[0]]?.start || '時間未定',
      end: timeMap[periods[periods.length - 1]]?.end || '時間未定'
    };
  };

  const isUpcomingCourse = (startTime) => {
    const now = new Date();
    const [hours, minutes] = startTime.split(':').map(Number);
    const courseTime = new Date();
    courseTime.setHours(hours, minutes, 0, 0);
    const timeDiff = courseTime - now;
    return timeDiff > 0 && timeDiff <= 30 * 60 * 1000;
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

  // 計算課程進度百分比（僅限進行中的課程）
  const getCourseProgress = (startTime, endTime) => {
    const now = new Date();
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const courseStart = new Date();
    courseStart.setHours(startHours, startMinutes, 0, 0);
    const courseEnd = new Date();
    courseEnd.setHours(endHours, endMinutes, 0, 0);

    const total = courseEnd - courseStart;
    const elapsed = now - courseStart;
    const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));
    return progress;
  };

  // 判斷課程是否已結束
  const isCompletedCourse = (endTime) => {
    const now = new Date();
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const courseEnd = new Date();
    courseEnd.setHours(endHours, endMinutes, 0, 0);
    return now > courseEnd;
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
          isUpcoming: isUpcomingCourse(timeInfo.start),
          isInProgress: isInProgressCourse(timeInfo.start, timeInfo.end),
          isCompleted: isCompletedCourse(timeInfo.end)
        });
      }
    });
    return todayCourses.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const calculateTotalCredits = (schedule, flexibleCourses = []) => {
    if (!schedule && (!flexibleCourses || flexibleCourses.length === 0)) return 0;
    const courses = Object.values(schedule || {});
    const uniqueCourses = [...new Map(courses.map(item => item && [item.course_id, item])).values()].filter(Boolean);
    const flexibleUnique = [...new Map((flexibleCourses || []).map(fc => fc && [fc.course_id, fc])).values()].filter(Boolean);
    const allCourses = [...uniqueCourses, ...flexibleUnique];
    const finalUniqueCourses = [...new Map(allCourses.map(c => [c.course_id, c])).values()];
    return finalUniqueCourses.reduce((sum, c) => sum + parseFloat(c.course_credit || 0), 0);
  };

  const loadScheduleData = useCallback(async () => {
    if (!isLoggedIn || !user?.google_id) {
      setTodayData(prev => ({ ...prev, isLoading: false }));
      return;
    }
    try {
      const data = await robustRequest('get', '/api/schedule', {
        params: { user_id: user.google_id }
      });
      const todayCourses = getTodayCourses(data?.schedule_data);
      const totalCredits = calculateTotalCredits(data?.schedule_data, data?.flexible_courses);
      setTodayData(prev => ({
        ...prev,
        courses: todayCourses,
        totalCredits,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to load schedule data:', error);
      setTodayData(prev => ({ ...prev, isLoading: false }));
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (!calendarLoading) {
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
      const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));
      const todaysEvents = allCalendarEvents.filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return (eventStart >= todayStart && eventStart <= todayEnd) ||
          (eventEnd >= todayStart && eventStart < todayStart);
      });
      setTodayData(prev => ({ ...prev, events: todaysEvents }));
    }
  }, [allCalendarEvents, calendarLoading]);

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return t('welcome.goodEvening');
    if (hour < 12) return t('welcome.goodMorning');
    if (hour < 18) return t('welcome.goodAfternoon');
    return t('welcome.goodEvening');
  };

  const getUserName = () => {
    if (!isLoggedIn || !user) return t('welcome.guest');
    return user.full_name?.split(' ')[0] || t('welcome.guest');
  };

  const toggleCard = (cardId) => {
    setExpandedCard(prev => prev === cardId ? null : cardId);
  };

  // 渲染課程列表（混合風格）
  const renderCoursesContent = () => {
    // 進行中或即將開始的課程
    const specialCourses = todayData.courses.filter(c => c.isInProgress || c.isUpcoming);
    // 稍後課程（未完成、非進行中、非即將開始）
    const laterCourses = todayData.courses.filter(c => !c.isInProgress && !c.isUpcoming && !c.isCompleted);
    // 已完成的課程
    const completedCourses = todayData.courses.filter(c => c.isCompleted);

    return (
      <div className="expanded-content flight-style">
        <div className="expanded-header">
          <h4><FontAwesomeIcon icon={faBook} /> {t('dashboard.todayCourses')}</h4>
          <button className="close-expanded" onClick={() => setExpandedCard(null)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        {todayData.courses.length === 0 ? (
          <div className="empty-state-mini">{t('dashboard.noCourses')}</div>
        ) : (
          <>
            {/* 特殊課程：航班卡片風格 */}
            {specialCourses.length > 0 && (
              <div className="flight-cards-list">
                {specialCourses.map(course => (
                  <div
                    key={course.id}
                    className={`flight-card ${course.isInProgress ? 'in-progress' : ''} ${course.isUpcoming ? 'upcoming' : ''}`}
                  >
                    <div className="flight-card-header">
                      <span className="flight-label">CLASS</span>
                      <span className="flight-time">{course.startTime}</span>
                      {course.isInProgress && <span className="flight-status live">🔴 {t('dashboard.inProgress')}</span>}
                      {course.isUpcoming && <span className="flight-status soon">🟢 {t('dashboard.upcoming')}</span>}
                    </div>
                    <div className="flight-route">
                      <div className="flight-point from">
                        <span className="point-label">{t('dashboard.from')}</span>
                        <span className="point-code">{course.startTime}</span>
                      </div>
                      <div className="flight-line">
                        {course.isInProgress ? (
                          /* 進行中：進度條虛線 + 書本跟隨進度 */
                          <div className="progress-dashed-line with-icon">
                            <div
                              className="progress-fill-dashed"
                              style={{ width: `${getCourseProgress(course.startTime, course.endTime)}%` }}
                            ></div>
                            <FontAwesomeIcon
                              icon={faBook}
                              className="flight-icon moving"
                              style={{ left: `calc(${getCourseProgress(course.startTime, course.endTime)}% - 10px)` }}
                            />
                          </div>
                        ) : (
                          /* 非進行中：普通虛線 */
                          <>
                            <div className="dashed-line"></div>
                            <FontAwesomeIcon icon={faBook} className="flight-icon" />
                            <div className="dashed-line"></div>
                          </>
                        )}
                      </div>
                      <div className="flight-point to">
                        <span className="point-label">{t('dashboard.to')}</span>
                        <span className="point-code">{course.endTime}</span>
                      </div>
                    </div>
                    <div className="flight-card-footer">
                      <div className="flight-info">
                        <span className="flight-name">{course.name}</span>
                        <span className="flight-meta">👨‍🏫 {course.teacher} · 📍 {course.classroom}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 稍後課程：簡單列表風格 */}
            {laterCourses.length > 0 && (
              <div className="courses-list-simple">
                {specialCourses.length > 0 && <div className="courses-divider">{t('dashboard.laterCourses')}</div>}
                {laterCourses.map(course => (
                  <div key={course.id} className="course-row-simple">
                    <div className="course-time-badge">{course.timeRange}</div>
                    <div className="course-info">
                      <span className="course-name">{course.name}</span>
                      <span className="course-meta">{course.teacher} · {course.classroom}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 已完成課程 */}
            {completedCourses.length > 0 && (
              <div className="courses-list-simple completed">
                <div className="courses-divider">{t('dashboard.completed')}</div>
                {completedCourses.map(course => (
                  <div key={course.id} className="course-row-simple completed">
                    <div className="course-time-badge">{course.timeRange}</div>
                    <div className="course-info">
                      <span className="course-name">{course.name}</span>
                      <span className="course-meta">{course.teacher} · {course.classroom}</span>
                    </div>
                    <span className="completed-badge">✓</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderEventsContent = () => (
    <div className="expanded-content">
      <div className="expanded-header">
        <h4><FontAwesomeIcon icon={faCalendarCheck} /> {t('dashboard.campusEvents')}</h4>
        <button className="close-expanded" onClick={() => setExpandedCard(null)}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      {todayData.events.length === 0 ? (
        <div className="empty-state-mini">{t('dashboard.noEvents')}</div>
      ) : (
        <div className="events-list">
          {todayData.events.map((event, idx) => (
            <div key={idx} className="event-row">
              <span className="event-name">{event.summary}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreditsContent = () => (
    <div className="expanded-content">
      <div className="expanded-header">
        <h4><FontAwesomeIcon icon={faStar} /> {t('dashboard.semesterCredits')}</h4>
        <button className="close-expanded" onClick={() => setExpandedCard(null)}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className="credits-summary">
        <div className="credits-big">{todayData.totalCredits}</div>
        <div className="credits-label">{t('dashboard.credits')}</div>
        <div className="credits-bar">
          <div
            className="credits-fill"
            style={{ width: `${Math.min(100, (todayData.totalCredits / RECOMMENDED_MAX_CREDITS) * 100)}%` }}
          ></div>
        </div>
        <div className="credits-range">{t('dashboard.recommendedRange')}：{RECOMMENDED_MIN_CREDITS} - {RECOMMENDED_MAX_CREDITS} {t('dashboard.credits')}</div>
      </div>
    </div>
  );

  return (
    <div className="welcome-banner integrated" ref={bannerRef}>
      <div className="welcome-decoration">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
        <div className="floating-shape shape-5"></div>
      </div>

      <div className="welcome-content integrated">
        <div className="welcome-header-row">
          <div className="greeting-section">
            <h1 className="welcome-title">{getGreeting()}，{getUserName()}！</h1>
          </div>
          <WeatherWidget />
        </div>

        <div className="semester-row">
          <span className="semester-text">第 {semesterProgress.currentWeek} 週 / {semesterProgress.totalWeeks} 週</span>
          <div className="semester-progress-bar">
            <div className="progress-fill" style={{ width: `${semesterProgress.progress}%` }}></div>
          </div>
        </div>

        <div className="status-cards-row">
          <div
            className={`status-card-mini ${expandedCard === 'courses' ? 'active' : ''}`}
            onClick={() => toggleCard('courses')}
          >
            <FontAwesomeIcon icon={faBook} className="card-icon" />
            <div className="card-content">
              <span className="card-value">{todayData.courses.length}</span>
              <span className="card-label">今日課程</span>
            </div>
            <FontAwesomeIcon icon={expandedCard === 'courses' ? faChevronUp : faChevronDown} className="expand-icon" />
          </div>

          <div
            className={`status-card-mini ${expandedCard === 'events' ? 'active' : ''}`}
            onClick={() => toggleCard('events')}
          >
            <FontAwesomeIcon icon={faCalendarCheck} className="card-icon" />
            <div className="card-content">
              <span className="card-value">{todayData.events.length}</span>
              <span className="card-label">{t('dashboard.campusEvents')}</span>
            </div>
            <FontAwesomeIcon icon={expandedCard === 'events' ? faChevronUp : faChevronDown} className="expand-icon" />
          </div>

          <div
            className={`status-card-mini ${expandedCard === 'credits' ? 'active' : ''}`}
            onClick={() => toggleCard('credits')}
          >
            <FontAwesomeIcon icon={faStar} className="card-icon" />
            <div className="card-content">
              <span className="card-value">{todayData.totalCredits}</span>
              <span className="card-label">{t('dashboard.semesterCredits')}</span>
            </div>
            <FontAwesomeIcon icon={expandedCard === 'credits' ? faChevronUp : faChevronDown} className="expand-icon" />
          </div>
        </div>

        {expandedCard && (
          <div className="expanded-section">
            {expandedCard === 'courses' && renderCoursesContent()}
            {expandedCard === 'events' && renderEventsContent()}
            {expandedCard === 'credits' && renderCreditsContent()}
          </div>
        )}

        {quote && !expandedCard && (
          <div className="quote-section">
            <FontAwesomeIcon icon={faQuoteLeft} className="quote-icon" />
            <span className="quote-text">「{quote.text}」</span>
            <span className="quote-author">— {quote.author}</span>
          </div>
        )}

        {!expandedCard && (
          <div className="quick-actions">
            <Link to="/course-planner" className="quick-btn">
              <FontAwesomeIcon icon={faCalendarAlt} />
              <span>{t('nav.coursePlanner')}</span>
            </Link>
            <Link to="/tracker" className="quick-btn">
              <FontAwesomeIcon icon={faGraduationCap} />
              <span>{t('nav.progress')}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeBanner;
