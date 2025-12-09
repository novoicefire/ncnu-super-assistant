// frontend/src/components/1_CoursePlanner/CoursePlanner.jsx (移除樣式衝突版)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';
import CourseTable from './CourseTable.jsx';
import './CoursePlanner.css';
import { useAuth } from '../../AuthContext.jsx';
import { robustRequest } from '../../apiHelper.js';

const CoursePlanner = () => {
  const { t } = useTranslation();
  const { user, isLoggedIn } = useAuth();
  const [staticCourses, setStaticCourses] = useState([]);
  const [hotnessData, setHotnessData] = useState({});
  const [schedule, setSchedule] = useState({});
  const [totalCredits, setTotalCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [isCapturing, setIsCapturing] = useState(false);
  const [filters, setFilters] = useState({
    courseName: '',
    teacher: '',
    department: '',
    division: '',
    time: '',
    hideConflicting: false
  });
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [flexibleCourses, setFlexibleCourses] = useState([]);
  const [scheduledCredits, setScheduledCredits] = useState(0);
  const [flexibleCredits, setFlexibleCredits] = useState(0);
  const [flexibleSort, setFlexibleSort] = useState({ key: 'added_time', order: 'asc' });

  // 🎨 簡化的樣式注入（移除 CourseTable 相關樣式）
  useEffect(() => {
    const enhancementStyles = `
      /* ✅ 只保留 CoursePlanner 頁面本身的樣式 */
      .course-planner {
        background: var(--theme-bg-primary);
        color: var(--theme-text-primary);
        border-radius: 16px;
        transition: all 0.3s ease;
      }
      
      .course-planner h1 {
        color: #00796b !important;
        font-weight: 700 !important;
      }
      
      [data-theme="dark"] .course-planner h1 {
        color: #48a999 !important;
      }
      
      .filters {
        background-color: var(--theme-bg-secondary);
        border: 1px solid var(--theme-border-primary);
        border-radius: 12px;
        box-shadow: var(--theme-shadow-primary);
      }
      
      .course-list-container {
        background: var(--theme-bg-card);
        border: 1px solid var(--theme-border-primary);
        border-radius: 12px;
        box-shadow: var(--theme-shadow-primary);
      }
      
      .course-table {
        background: var(--theme-bg-card);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: var(--theme-shadow-primary);
        border: 1px solid var(--theme-border-primary);
      }
      
      /* ✅ 篩選器樣式 */
      .filters label {
        color: var(--theme-text-primary) !important;
        font-weight: 500;
        transition: color 0.3s ease;
      }
      
      .filters input,
      .filters select {
        background: var(--theme-bg-secondary);
        color: var(--theme-text-primary);
        border: 1px solid var(--theme-border-primary);
        border-radius: 8px;
        transition: all 0.3s ease;
      }
      
      .filters input:focus,
      .filters select:focus {
        border-color: #00796b;
        box-shadow: 0 0 0 2px rgba(0, 121, 107, 0.2);
      }
      
      .filters input::placeholder {
        color: var(--theme-text-tertiary);
      }
      
      .conflict-filter-label {
        color: var(--theme-text-primary) !important;
      }
      
      .conflict-checkbox-text {
        color: var(--theme-text-primary) !important;
      }
      
      .conflict-checkbox-text span {
        color: var(--theme-text-primary) !important;
      }
      
      .conflict-count {
        color: var(--theme-text-secondary) !important;
      }
      
      .filter-info {
        color: var(--theme-text-secondary) !important;
      }
      
      /* ✅ 課程列表樣式 */
      .course-list li {
        background: var(--theme-bg-secondary);
        border-bottom: 1px solid var(--theme-border-secondary);
        color: var(--theme-text-primary);
        transition: background-color 0.3s ease;
      }
      
      .course-list li:hover {
        background: var(--theme-bg-hover);
      }
      
      .course-info small {
        color: var(--theme-text-secondary);
      }
      
      /* ✅ 通知系統樣式 */
      [data-theme="dark"] .notification-success {
        background-color: rgba(40, 167, 69, 0.9);
      }
      
      [data-theme="dark"] .notification-error {
        background-color: rgba(220, 53, 69, 0.9);
      }
      
      [data-theme="dark"] .notification-warning {
        background-color: rgba(255, 193, 7, 0.9);
        color: #000;
      }
      
      [data-theme="dark"] .notification-info {
        background-color: rgba(23, 162, 184, 0.9);
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = 'course-planner-enhancements';
    styleElement.textContent = enhancementStyles;
    document.head.appendChild(styleElement);

    return () => {
      const existingStyle = document.getElementById('course-planner-enhancements');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  // 課程資料清理與標準化函數
  const normalizeCourseDepartment = useCallback((course) => {
    if (course.course_cname && course.course_cname.includes('中文思辨與表達')) {
      return { ...course, department: '通識領域課程' };
    }

    if (!course.department || course.department.trim() === '') {
      if (course.course_cname) {
        const courseName = course.course_cname;
        if (courseName.includes('通識') || courseName.includes('中文思辨') ||
          courseName.includes('跨域專業學術英文')) {
          return { ...course, department: '通識領域課程' };
        }
        if (courseName.includes('服務學習') || courseName.includes('全校') ||
          courseName.includes('共同')) {
          return { ...course, department: '全校共同課程' };
        }
      }
      return { ...course, department: '其他課程' };
    }
    return course;
  }, []);

  // 🎯 格式化課程資訊顯示函數
  const formatCourseInfo = useCallback((course) => {
    const info = [];

    if (course.teacher) info.push(course.teacher);
    if (course.department) info.push(course.department);
    if (course.division) info.push(course.division);
    if (course.time) info.push(course.time);
    if (course.location && course.location.trim() !== '') info.push(course.location);
    if (course.course_credit) info.push(`${course.course_credit}學分`);

    return info.join(' | ');
  }, []);

  // 截圖功能
  const captureScheduleImage = useCallback(async () => {
    const tableElement = document.getElementById('course-schedule-table-isolated');
    if (!tableElement) {
      showNotification(t('coursePlanner.notifyNoTable'), 'error');
      return;
    }

    setIsCapturing(true);
    try {
      showNotification(t('coursePlanner.notifyGenerating'), 'info');

      const canvas = await html2canvas(tableElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        width: tableElement.scrollWidth,
        height: tableElement.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `NCNU_Schedule_${new Date().toLocaleDateString('en-US').replace(/\//g, '-')}.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          showNotification(t('coursePlanner.notifyImageSuccess'), 'success');
        } else {
          throw new Error('Cannot generate image');
        }
      }, 'image/png');

    } catch (error) {
      console.error('Screenshot failed:', error);
      showNotification(t('coursePlanner.notifyImageFailed'), 'error');
    } finally {
      setIsCapturing(false);
    }
  }, [t]);

  // 🔄 載入真實課程資料
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log('🔄 開始載入課程資料...');
        const courseRes = await axios.get('/data/本學期開課資訊API.json');
        const rawCourses = courseRes.data?.course_ncnu?.item || [];

        const normalizedCourses = rawCourses.map(course => {
          const normalized = normalizeCourseDepartment(course);
          if (!normalized.division || normalized.division.trim() === '') {
            normalized.division = '一般班';
          }
          return normalized;
        });

        console.log('✅ 課程資料載入完成，共', normalizedCourses.length, '門課程');
        setStaticCourses(normalizedCourses);

        // 課程熱度資料載入
        try {
          console.log('🔄 開始載入課程熱度資料...');
          const hotnessResult = await robustRequest('get', '/api/courses/hotness');

          if (hotnessResult && typeof hotnessResult === 'object') {
            console.log('✅ 課程熱度資料載入成功，共', Object.keys(hotnessResult).length, '筆記錄');
            setHotnessData(hotnessResult);
          } else {
            console.log('⚠️ 課程熱度資料格式異常或為空，使用空物件');
            setHotnessData({});
          }
        } catch (hotnessError) {
          console.warn('⚠️ 課程熱度資料載入失敗，但不影響主要功能:', hotnessError.message);
          setHotnessData({});
        }

      } catch (error) {
        console.error("❌ 主要資料載入失敗:", error);
        // 備用載入邏輯
        try {
          const courseRes = await axios.get('/data/本學期開課資訊API.json');
          const rawCourses = courseRes.data?.course_ncnu?.item || [];
          const normalizedCourses = rawCourses.map(course => {
            const normalized = normalizeCourseDepartment(course);
            if (!normalized.division || normalized.division.trim() === '') {
              normalized.division = '一般班';
            }
            return normalized;
          });
          setStaticCourses(normalizedCourses);
          console.log('✅ 備用載入成功');
        } catch (staticError) {
          console.error("❌ 備用載入也失敗:", staticError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [normalizeCourseDepartment]);

  // 🔄 載入課表資料（登入用戶從雲端，未登入用戶從本地）
  useEffect(() => {
    if (isLoggedIn && user?.google_id) {
      // 登入用戶：從雲端載入
      robustRequest('get', '/api/schedule', { params: { user_id: user.google_id } })
        .then(data => {
          setSchedule(data?.schedule_data || {});
          setFlexibleCourses(data?.flexible_courses || []);
        })
        .catch(err => {
          console.error('雲端課表載入失敗:', err);
          // 雲端載入失敗時嘗試載入本地資料
          const localSchedule = localStorage.getItem('course-schedule');
          const localFlexible = localStorage.getItem('flexible-courses');
          setSchedule(localSchedule ? JSON.parse(localSchedule) : {});
          setFlexibleCourses(localFlexible ? JSON.parse(localFlexible) : []);
        });
    } else {
      // 未登入用戶：從本地載入
      const localSchedule = localStorage.getItem('course-schedule');
      const localFlexible = localStorage.getItem('flexible-courses');
      setSchedule(localSchedule ? JSON.parse(localSchedule) : {});
      setFlexibleCourses(localFlexible ? JSON.parse(localFlexible) : []);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    // 計算固定時間課程學分（去重）
    const uniqueCourses = [...new Map(Object.values(schedule).map(item => [item['course_id'], item])).values()];
    const scheduledCreditsValue = uniqueCourses.reduce((sum, course) => sum + parseFloat(course.course_credit || 0), 0);

    // 計算彈性課程學分
    const flexibleCreditsValue = flexibleCourses.reduce((sum, course) => sum + parseFloat(course.course_credit || 0), 0);

    // 總學分 = 固定時間課程學分 + 彈性課程學分
    setTotalCredits(scheduledCreditsValue + flexibleCreditsValue);
    setScheduledCredits(scheduledCreditsValue);
    setFlexibleCredits(flexibleCreditsValue);
  }, [schedule, flexibleCourses]);

  const hasTimeConflict = useCallback((course) => {
    if (!course.time || Object.keys(schedule).length === 0) return false;

    const courseSlots = parseTimeSlots(course.time);
    if (courseSlots.length === 0) return false;

    return courseSlots.some(slot => {
      return schedule[slot] && schedule[slot].course_id !== course.course_id;
    });
  }, [schedule]);

  useEffect(() => {
    let result = staticCourses;

    if (filters.courseName) {
      result = result.filter(c => c.course_cname.toLowerCase().includes(filters.courseName.toLowerCase()));
    }
    if (filters.teacher) {
      result = result.filter(c => c.teacher.toLowerCase().includes(filters.teacher.toLowerCase()));
    }
    if (filters.department) {
      result = result.filter(c => c.department === filters.department);
    }
    if (filters.division) {
      result = result.filter(c => c.division === filters.division);
    }
    if (filters.time) {
      result = result.filter(c => c.time && c.time.toLowerCase().includes(filters.time.toLowerCase()));
    }
    if (filters.hideConflicting) {
      result = result.filter(course => !hasTimeConflict(course));
    }

    setFilteredCourses(result);
  }, [filters, staticCourses, hasTimeConflict]);

  const uniqueDepartments = useMemo(() => {
    if (staticCourses.length === 0) return [];

    const departments = staticCourses
      .map(c => c.department)
      .filter(dept => dept && dept.trim() !== '')
      .filter(Boolean);

    const uniqueDepts = [...new Set(departments)].sort();
    console.log('📊 開課單位列表:', uniqueDepts);

    return uniqueDepts;
  }, [staticCourses]);

  const uniqueDivisions = useMemo(() => {
    if (staticCourses.length === 0) return [];

    const divisions = staticCourses
      .map(c => c.division)
      .filter(division => division && division.trim() !== '' && division !== '通識')
      .filter(Boolean);

    const uniqueDivs = [...new Set(divisions)].sort();
    console.log('📊 班別列表:', uniqueDivs);

    return uniqueDivs;
  }, [staticCourses]);

  const showNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  // 🔄 儲存課表（登入用戶同步雲端，未登入用戶存本地）
  const saveSchedule = useCallback(async (newSchedule, newFlexibleCourses, actionType = 'update', courseName = '') => {
    setSchedule(newSchedule);
    setFlexibleCourses(newFlexibleCourses);

    // 🔄 總是先儲存到本地（作為備份）
    localStorage.setItem('course-schedule', JSON.stringify(newSchedule));
    localStorage.setItem('flexible-courses', JSON.stringify(newFlexibleCourses));

    if (isLoggedIn && user?.google_id) {
      // 🌐 登入用戶：同步到雲端
      setSaveStatus("saving");
      try {
        const response = await robustRequest('post', '/api/schedule', {
          params: { user_id: user.google_id },
          data: {
            schedule_data: newSchedule,
            flexible_courses: newFlexibleCourses
          }
        });

        if (response && response.success) {
          setSaveStatus("success");
          if (actionType === 'add') {
            showNotification(t('coursePlanner.notifyAddedCloud', { courseName }), 'success');
          } else if (actionType === 'remove') {
            showNotification(t('coursePlanner.notifyRemovedCloud', { courseName }), 'success');
          } else {
            showNotification(t('coursePlanner.notifyCloudSync'), 'success');
          }
        } else {
          throw new Error(response.error || "Backend response did not indicate success.");
        }
      } catch (error) {
        setSaveStatus("error");
        console.error("Failed to save schedule to cloud:", error);
        showNotification(t('coursePlanner.notifyCloudFailed'), 'warning');
      } finally {
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } else {
      // 💾 未登入用戶：只存本地
      if (actionType === 'add') {
        showNotification(t('coursePlanner.notifyAddedLocal', { courseName }), 'success');
      } else if (actionType === 'remove') {
        showNotification(t('coursePlanner.notifyRemovedLocal', { courseName }), 'success');
      }
    }
  }, [isLoggedIn, user, showNotification]);

  // 新增彈性課程
  const addFlexibleCourse = useCallback((course) => {
    if (flexibleCourses.some(fc => fc.course_id === course.course_id)) {
      showNotification(t('coursePlanner.notifyAlreadyFlexible'), 'warning');
      return;
    }
    const newFlexible = [...flexibleCourses, course];
    saveSchedule(schedule, newFlexible, 'add', course.course_cname);
  }, [flexibleCourses, schedule, saveSchedule, showNotification]);

  // 移除彈性課程
  const removeFlexibleCourse = useCallback((courseId) => {
    const course = flexibleCourses.find(fc => fc.course_id === courseId);
    const courseName = course ? course.course_cname : '';
    const newFlexible = flexibleCourses.filter(fc => fc.course_id !== courseId);
    saveSchedule(schedule, newFlexible, 'remove', courseName);
  }, [flexibleCourses, schedule, saveSchedule]);

  const parseTimeSlots = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return [];

    const timeGroups = timeString.match(/\d[a-zA-Z]+/g) || [];
    const slots = [];

    for (const group of timeGroups) {
      const day = group[0];
      const periods = group.substring(1);
      for (const period of periods) {
        slots.push(`${day}${period}`);
      }
    }

    return slots;
  };

  const addToSchedule = (course) => {
    const slots = parseTimeSlots(course.time);
    if (slots.length === 0) {
      // 無時間資訊，加入彈性課程區
      addFlexibleCourse(course);
      return;
    }

    for (let slot of slots) {
      if (schedule[slot]) {
        showNotification(
          t('coursePlanner.notifyConflict', { day: slot[0], period: slot.substring(1), existingCourse: schedule[slot].course_cname }),
          'warning'
        );
        return;
      }
    }

    const newSchedule = { ...schedule };
    slots.forEach(slot => {
      newSchedule[slot] = course;
    });

    saveSchedule(newSchedule, flexibleCourses, 'add', course.course_cname);
  };

  const removeFromSchedule = (courseId, time) => {
    const slots = parseTimeSlots(time);
    const newSchedule = { ...schedule };
    let courseName = '';

    slots.forEach(slot => {
      if (newSchedule[slot] && newSchedule[slot].course_id === courseId && newSchedule[slot].time === time) {
        courseName = newSchedule[slot].course_cname;
        delete newSchedule[slot];
      }
    });

    saveSchedule(newSchedule, flexibleCourses, 'remove', courseName);
  };

  const isCourseInSchedule = (course) => {
    const slots = parseTimeSlots(course.time);
    return slots.some(slot =>
      schedule[slot] &&
      schedule[slot].course_id === course.course_id &&
      schedule[slot].time === course.time
    );
  };

  const isCourseInFlexible = useCallback((course) => {
    return flexibleCourses.some(fc => fc.course_id === course.course_id);
  }, [flexibleCourses]);

  const handleCourseToggle = (course) => {
    const slots = parseTimeSlots(course.time);

    // 無時間課程的處理
    if (slots.length === 0) {
      if (isCourseInFlexible(course)) {
        removeFlexibleCourse(course.course_id);
      } else {
        addFlexibleCourse(course);
      }
      return;
    }

    // 有時間課程的處理
    if (isCourseInSchedule(course)) {
      removeFromSchedule(course.course_id, course.time);
    } else {
      addToSchedule(course);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFlexibleSort = (key) => {
    setFlexibleSort(prev => {
      if (prev.key === key) {
        return { ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' };
      }
      return { key, order: 'asc' };
    });
  };

  const sortedFlexibleCourses = useMemo(() => {
    let sortable = [...flexibleCourses];
    if (flexibleSort.key === 'course_credit') {
      sortable.sort((a, b) => {
        const creditA = parseFloat(a.course_credit || 0);
        const creditB = parseFloat(b.course_credit || 0);
        return flexibleSort.order === 'asc' ? creditA - creditB : creditB - creditA;
      });
    } else if (flexibleSort.key === 'course_cname') {
      sortable.sort((a, b) => flexibleSort.order === 'asc' ? a.course_cname.localeCompare(b.course_cname, 'zh-Hant') : b.course_cname.localeCompare(a.course_cname, 'zh-Hant'));
    } else if (flexibleSort.key === 'added_time' && flexibleSort.order === 'desc') {
      sortable.reverse();
    }
    return sortable;
  }, [flexibleCourses, flexibleSort]);

  const getSaveStatusMessage = () => {
    if (!isLoggedIn) return t('coursePlanner.statusNotLoggedIn');

    switch (saveStatus) {
      case "saving": return t('coursePlanner.statusSaving');
      case "success": return t('coursePlanner.statusSuccess');
      case "error": return t('coursePlanner.statusError');
      default: return t('coursePlanner.statusAuto');
    }
  };

  const conflictingCoursesCount = useMemo(() => {
    if (!filters.hideConflicting) return 0;
    return staticCourses.filter(course => hasTimeConflict(course)).length;
  }, [staticCourses, hasTimeConflict, filters.hideConflicting]);

  return (
    <div className="course-planner">
      {/* 通知系統 */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button
              className="notification-close"
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="planner-header">
        <h1>{t('coursePlanner.title')}</h1>
        <div className="header-info">
          <span>
            {t('coursePlanner.selectedCredits')}: {totalCredits} {t('coursePlanner.creditsUnit')}
            {totalCredits > 0 && `（${t('coursePlanner.fixed')} ${scheduledCredits} + ${t('coursePlanner.flexible')} ${flexibleCredits}）`}
          </span>
          <span>{getSaveStatusMessage()}</span>
        </div>
      </div>

      {/* 篩選器區域 */}
      <div className="filters">
        <div className="filter-group">
          <label>{t('coursePlanner.courseName')}</label>
          <input
            type="text"
            name="courseName"
            value={filters.courseName}
            onChange={handleFilterChange}
            placeholder={t('coursePlanner.searchCoursePlaceholder')}
          />
        </div>

        <div className="filter-group">
          <label>{t('coursePlanner.teacher')}</label>
          <input
            type="text"
            name="teacher"
            value={filters.teacher}
            onChange={handleFilterChange}
            placeholder={t('coursePlanner.searchTeacherPlaceholder')}
          />
        </div>

        <div className="filter-group">
          <label>{t('coursePlanner.classTime')}</label>
          <input
            type="text"
            name="time"
            value={filters.time}
            onChange={handleFilterChange}
            placeholder={t('coursePlanner.classTimePlaceholder')}
          />
        </div>

        <div className="filter-group">
          <label>{t('coursePlanner.department')}</label>
          <input
            type="text"
            name="department"
            list="department-list"
            value={filters.department}
            onChange={handleFilterChange}
            placeholder={t('coursePlanner.selectDepartment')}
            autoComplete="off"
          />
          <datalist id="department-list">
            <option value="">{t('coursePlanner.allDepartments')}</option>

            {/* 人文學院 */}
            <option value="中文系">📚 人文學院 - 中國語文學系</option>
            <option value="外文系">📚 人文學院 - 外國語文學系</option>
            <option value="歷史系">📚 人文學院 - 歷史學系</option>
            <option value="社工系">📚 人文學院 - 社會政策與社會工作學系</option>
            <option value="公行系">📚 人文學院 - 公共行政與政策學系</option>
            <option value="東南亞系">📚 人文學院 - 東南亞學系</option>
            <option value="國比系">📚 人文學院 - 國際文教與比較教育學系</option>
            <option value="原住民文化與社工學士專班">📚 人文學院 - 原住民文化產業與社會工作學士學位學程原住民族專班</option>
            <option value="東南亞系人類學">📚 人文學院 - 東南亞學系人類學</option>
            <option value="東南亞系在職專班">📚 人文學院 - 東南亞學系碩士在職專班</option>
            <option value="社工系二年制專班">📚 人文學院 - 社會政策與社會工作學系二年制在職專班</option>
            <option value="公行專班">📚 人文學院 - 公共行政與政策學系碩士在職專班</option>
            <option value="華文學程">📚 人文學院 - 華語文教學碩士學位學程</option>
            <option value="非營利組織專班">📚 人文學院 - 非營利組織經營管理碩士學位學程在職專班</option>
            <option value="國際文教管理人才博士學位學程">📚 人文學院 - 國際文教管理人才博士學位學程</option>
            <option value="國際文教人才博士班">📚 人文學院 - 文化創意與社會行銷碩士學位學程</option>

            {/* 管理學院 */}
            <option value="經濟系">💼 管理學院 - 經濟學系</option>
            <option value="國企系">💼 管理學院 - 國際企業學系</option>
            <option value="資管系">💼 管理學院 - 資訊管理學系</option>
            <option value="財金系">💼 管理學院 - 財務金融學系</option>
            <option value="觀光餐旅系觀光">💼 管理學院 - 觀光休閒與餐旅管理學系</option>
            <option value="觀光餐旅系餐旅">💼 管理學院 - 觀光休閒與餐旅管理學系餐旅</option>
            <option value="管院學士班">💼 管理學院 - 管理學院學士班</option>
            <option value="國企專班">💼 管理學院 - 國際企業學系碩士在職專班</option>
            <option value="資管專班">💼 管理學院 - 資訊管理學系碩士在職專班</option>
            <option value="財金專班">💼 管理學院 - 財務金融學系碩士在職專班</option>
            <option value="高階經管班">💼 管理學院 - 高階經營管理碩士學位學程</option>
            <option value="新興產業博士班">💼 管理學院 - 新興產業策略與發展博士學位學程</option>
            <option value="新興產業碩士班">💼 管理學院 - 新興產業策略與發展碩士學位學程</option>
            <option value="區域產碩專班">💼 管理學院 - 區域發展重點產業碩士專班</option>
            <option value="兩岸高階主管班">💼 管理學院 - 兩岸高階主管經營管理境外碩士在職學位學程</option>
            <option value="管院全英學程">💼 管理學院 - 管理學院商業管理及資訊科技創新應用全英語碩士學位學程</option>

            {/* 科技學院 */}
            <option value="資工系">💻 科技學院 - 資訊工程學系</option>
            <option value="土木系">💻 科技學院 - 土木工程學系</option>
            <option value="電機系">💻 科技學院 - 電機工程學系</option>
            <option value="應化系">💻 科技學院 - 應用化學系</option>
            <option value="應光系">💻 科技學院 - 應用材料及光電工程學系</option>
            <option value="科院學士班">💻 科技學院 - 科技學院學士班</option>
            <option value="電機通訊所">💻 科技學院 - 電機工程學系通訊工程</option>
            <option value="地震所">💻 科技學院 - 地震與防災工程研究所</option>
            <option value="應化生醫所">💻 科技學院 - 應用化學系生物醫學</option>
            <option value="光電碩專班">💻 科技學院 - 光電科技碩士學位學程</option>
            <option value="人工智慧學程">💻 科技學院 - 人工智慧與機器人碩士學位學程</option>
            <option value="光電產碩專班">💻 科技學院 - 光電材料產業碩士專班</option>
            <option value="精準農博">💻 科技學院 - 智慧精準農業產學研發博士學位學程</option>
            <option value="智慧農學">💻 科技學院 - 智慧暨永續農業學士學位學程</option>

            {/* 教育學院 */}
            <option value="教政系">🎓 教育學院 - 教育政策與行政學系</option>
            <option value="諮人系">🎓 教育學院 - 諮商心理與人力資源發展學系</option>
            <option value="教院學士班">🎓 教育學院 - 教育學院學士班</option>
            <option value="諮人系終身學習與人力資源">🎓 教育學院 - 諮商心理與人力資源發展學系終身學習與人力資源發展</option>
            <option value="課科所">🎓 教育學院 - 課程教學與科技研究所</option>
            <option value="終身學習專班">🎓 教育學院 - 終身學習與人力資源發展碩士學位學程碩士在職專班</option>
            <option value="諮人系輔諮新加坡專班">🎓 教育學院 - 諮商心理與人力資源發展學系輔導與諮商新加坡境外碩士在職專班</option>
            <option value="心理健康與諮詢專班">🎓 教育學院 - 心理健康與諮詢碩士學位學程在職專班</option>
            <option value="心理健康新加坡專班">🎓 教育學院 - 心理健康與輔導諮商碩士在職進修新加坡境外專班</option>

            {/* 水沙連學院 */}
            <option value="地方創生學程">🌊 水沙連學院 - 地方創生與跨域治理碩士學位學程</option>

            {/* 護理暨健康福祉學院 */}
            <option value="護理系">🏥 護理暨健康福祉學院 - 護理學系</option>
            <option value="護理系原專班">🏥 護理暨健康福祉學院 - 護理學系原住民族專班</option>
            <option value="高齡長照專班">🏥 護理暨健康福祉學院 - 高齡健康與長期照顧管理學士學位學程原住民族專班</option>
            <option value="長照專班">🏥 護理暨健康福祉學院 - 長期照顧經營管理碩士在職學位學程在職專班</option>

            {/* 通識 */}
            <option value="通識">📋 通識 - 通識領域課程</option>

            {/* 不分學院 */}
            <option value="共同必">🏛️ 不分學院 - 全校共同基本必修</option>
            <option value="共同選">🏛️ 不分學院 - 全校共同選修</option>
            <option value="體育室">🏛️ 不分學院 - 體育室</option>
            <option value="軍訓室">🏛️ 不分學院 - 軍訓室</option>
            <option value="共同科">🏛️ 不分學院 - 共同科</option>
            <option value="教育學程">🏛️ 不分學院 - 教育學程</option>
            <option value="遠距">🏛️ 不分學院 - 遠距教學中心</option>

          </datalist>
        </div>

        <div className="filter-group">
          <label>{t('coursePlanner.division')}</label>
          <select name="division" value={filters.division} onChange={handleFilterChange}>
            <option value="">{t('coursePlanner.allDivisions')}</option>
            {uniqueDivisions.map(division => (
              <option key={division} value={division}>{division}</option>
            ))}
          </select>
        </div>

        <div className="filter-group conflict-filter-group">
          <label className="conflict-filter-label">
            <span className="conflict-label-text">{t('coursePlanner.hideConflicts')}</span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                name="hideConflicting"
                checked={filters.hideConflicting}
                onChange={handleFilterChange}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
            </div>
            {conflictingCoursesCount > 0 && (
              <span className="conflict-count">({conflictingCoursesCount})</span>
            )}
          </label>
          <div className="filter-info">
            {t('coursePlanner.conflictHint')}
          </div>
        </div>
      </div>

      <div className="planner-content">
        {/* 課程列表 */}
        <div className="course-list-container">
          <h3>{t('coursePlanner.courseList')} ({filteredCourses.length})</h3>
          {isLoading ? (
            <p>{t('coursePlanner.loading')}</p>
          ) : (
            <ul className="course-list">
              {filteredCourses.map((course, index) => (
                <li key={`${course.course_id}-${course.time}-${index}`}>
                  <div className="course-info">
                    <div className="course-title-container">
                      <strong>{course.course_cname}</strong>
                      {!course.time && <span className="course-type-badge flexible">{t('coursePlanner.flexible')}</span>}
                    </div>
                    {hotnessData && hotnessData[course.course_id] && (
                      <span className="hotness-indicator">
                        🔥 {hotnessData[course.course_id]}{t('coursePlanner.people')}
                      </span>
                    )}
                    <small>
                      {formatCourseInfo(course)}
                    </small>
                  </div>
                  <button
                    className={`course-toggle-btn ${isCourseInSchedule(course) || isCourseInFlexible(course) ? 'remove' : 'add'
                      }`}
                    onClick={() => handleCourseToggle(course)}
                  >
                    {isCourseInSchedule(course) || isCourseInFlexible(course) ? '−' : '+'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 課表顯示區域 */}
        <div className="schedule-container">
          <div className="schedule-header">
            <div>
              <h3>{t('coursePlanner.mySchedule')}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--theme-text-secondary)', marginTop: '4px', fontWeight: 'normal' }}>
                {t('coursePlanner.clickToRemove')}
              </p>
            </div>
            <button
              className="save-image-btn"
              onClick={captureScheduleImage}
              disabled={isCapturing}
              title={t('coursePlanner.saveImage')}
            >
              {isCapturing ? t('coursePlanner.generating') : t('coursePlanner.saveImage')}
            </button>
          </div>
          <CourseTable
            schedule={schedule}
            onRemove={removeFromSchedule}
          />
        </div>
      </div>

      {/* 彈性/無固定時間課程區 */}
      <div className="flexible-courses-container">
        <div className="schedule-header flexible-header">
          <div className="flexible-header-title">
            <h3>{t('coursePlanner.flexibleCourses')}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--theme-text-secondary)', marginTop: '4px', fontWeight: 'normal' }}>
              {t('coursePlanner.flexibleDesc')}
            </p>
          </div>
          <div className="flexible-sort-buttons">
            <button onClick={() => handleFlexibleSort('course_credit')} className={flexibleSort.key === 'course_credit' ? 'active' : ''}>
              {t('coursePlanner.credits')} {flexibleSort.key === 'course_credit' && (flexibleSort.order === 'asc' ? '↑' : '↓')}
            </button>
            <button onClick={() => handleFlexibleSort('course_cname')} className={flexibleSort.key === 'course_cname' ? 'active' : ''}>
              {t('coursePlanner.name')} {flexibleSort.key === 'course_cname' && (flexibleSort.order === 'asc' ? '↑' : '↓')}
            </button>
            <button onClick={() => handleFlexibleSort('added_time')} className={flexibleSort.key === 'added_time' ? 'active' : ''}>
              {t('coursePlanner.addedTime')} {flexibleSort.key === 'added_time' && (flexibleSort.order === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
        {flexibleCourses.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--theme-text-tertiary)', padding: '20px', lineHeight: '1.6' }}>
            {t('coursePlanner.noFlexibleCourses')}
          </p>
        ) : (
          <ul className="flexible-course-list">
            {sortedFlexibleCourses.map(fc => (
              <li key={fc.course_id}>
                <div className="course-info">
                  <strong>{fc.course_cname}</strong>
                  <small>
                    {fc.teacher} | {fc.department} | {fc.course_credit}{t('coursePlanner.creditsUnit')}
                  </small>
                </div>
                <button
                  className="course-toggle-btn remove"
                  onClick={() => removeFlexibleCourse(fc.course_id)}
                >
                  −
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CoursePlanner;
