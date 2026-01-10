// frontend/src/components/1_CoursePlanner/CoursePlanner.jsx (v3.0 學業規劃器版)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';
import CourseTable from './CourseTable.jsx';
import SemesterSelector from './components/SemesterSelector.jsx';
import UserYearSettings from './components/UserYearSettings.jsx';
import GraduationPanel from './components/GraduationPanel.jsx';
import { useSemester } from './hooks/useSemester.js';
import BottomSheet from '../common/BottomSheet.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import './CoursePlanner.css';
import { useAuth } from '../../AuthContext.jsx';
import { robustRequest } from '../../apiHelper.js';



const CoursePlanner = () => {
  const { t, i18n } = useTranslation();
  const { user, isLoggedIn } = useAuth();

  // 🆕 v3.0：根據語言設定取得課程名稱
  const getCourseName = useCallback((course) => {
    if (!course) return '';
    // 英文模式且有英文名稱時使用英文，否則使用中文
    if (i18n.language === 'en' && course.course_ename) {
      return course.course_ename;
    }
    return course.course_cname || '';
  }, [i18n.language]);

  // 🆕 v2.0：學期管理 Hook
  const {
    selectedSemester,
    setSelectedSemester,
    enrollmentYear,
    graduationYear,
    availableSemesters,
    yearOptions,
    isLoading: semesterLoading,
    needsSetup,
    saveYearSettings,
    currentSemester
  } = useSemester();

  const [staticCourses, setStaticCourses] = useState([]);
  const [hotnessData, setHotnessData] = useState({});
  const [schedule, setSchedule] = useState({});
  const [totalCredits, setTotalCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [isCapturing, setIsCapturing] = useState(false);
  const [filters, setFilters] = useState({
    courseName: '',
    courseId: '',  // 🆕 課程代碼篩選
    teacher: '',
    department: '',
    division: '',
    time: '',
    conflictMode: 'show' // 'show' = 顯示全部, 'gray' = 灰色顯示, 'hide' = 完全隱藏
  });
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [flexibleCourses, setFlexibleCourses] = useState([]);
  const [scheduledCredits, setScheduledCredits] = useState(0);
  const [flexibleCredits, setFlexibleCredits] = useState(0);
  const [flexibleSort, setFlexibleSort] = useState({ key: 'added_time', order: 'asc' });
  const [filtersExpanded, setFiltersExpanded] = useState(false); // 預設收起篩選器
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false); // 手機版課程搜尋 BottomSheet


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

  // 🎯 格式化課程資訊顯示函數（支援英文模式）
  const formatCourseInfo = useCallback((course) => {
    const info = [];

    // 根據語言選擇對應欄位
    const teacher = (i18n.language === 'en' && course.eteacher) ? course.eteacher : course.teacher;
    const department = (i18n.language === 'en' && course.edepartment) ? course.edepartment : course.department;
    const division = (i18n.language === 'en' && course.edivision) ? course.edivision : course.division;
    const credits = i18n.language === 'en' ? 'credits' : '學分';

    if (teacher) info.push(teacher);
    if (department) info.push(department);
    if (division) info.push(division);
    if (course.time) info.push(course.time);
    if (course.location && course.location.trim() !== '') info.push(course.location);
    if (course.course_credit) info.push(`${course.course_credit}${credits}`);

    return info.join(' | ');
  }, [i18n.language]);

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

  // 🔄 v2.0：載入開課資料（依學期切換）
  useEffect(() => {
    // 等待學期設定載入完成
    if (semesterLoading || !selectedSemester) return;

    const fetchData = async () => {
      setIsLoading(true);

      // 解析學期格式 "114-1" -> year=114, sem=1
      const [year, sem] = selectedSemester.split('-');

      // 優先載入學期專屬檔案，fallback 到舊版
      const semesterFile = `/data/開課資訊_${year}_${sem}.json`;
      const legacyFile = '/data/本學期開課資訊API.json';

      try {
        console.log(`🔄 載入 ${selectedSemester} 開課資料...`);

        let courseRes;
        try {
          courseRes = await axios.get(semesterFile);
          console.log(`✅ 載入學期專屬檔案: ${semesterFile}`);
        } catch {
          console.log(`⚠️ 學期檔案不存在，使用舊版檔案`);
          courseRes = await axios.get(legacyFile);
        }

        const rawCourses = courseRes.data?.course_ncnu?.item || [];

        const normalizedCourses = rawCourses.map(course => {
          const normalized = normalizeCourseDepartment(course);
          if (!normalized.division || normalized.division.trim() === '') {
            normalized.division = '一般班';
          }
          return normalized;
        });

        console.log(`✅ ${selectedSemester} 開課資料載入完成，共`, normalizedCourses.length, '門課程');
        setStaticCourses(normalizedCourses);

        // 課程熱度資料載入
        try {
          console.log('🔄 載入課程熱度資料...');
          const hotnessResult = await robustRequest('get', '/api/courses/hotness');

          if (hotnessResult && typeof hotnessResult === 'object') {
            console.log('✅ 課程熱度資料載入成功，共', Object.keys(hotnessResult).length, '筆記錄');
            setHotnessData(hotnessResult);
          } else {
            setHotnessData({});
          }
        } catch (hotnessError) {
          console.warn('⚠️ 課程熱度載入失敗:', hotnessError.message);
          setHotnessData({});
        }

      } catch (error) {
        console.error("❌ 開課資料載入失敗:", error);
        setStaticCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [normalizeCourseDepartment, selectedSemester, semesterLoading]);

  // 🔄 v2.0：載入課表資料（依學期）
  useEffect(() => {
    // 等待學期設定載入完成
    if (semesterLoading || !selectedSemester) return;

    const loadScheduleForSemester = async () => {
      const localKey = `course-schedule-${selectedSemester}`;
      const localFlexibleKey = `flexible-courses-${selectedSemester}`;

      if (isLoggedIn && user?.google_id) {
        // 登入用戶：從雲端載入
        try {
          const data = await robustRequest('get', '/api/schedule', {
            params: { user_id: user.google_id, semester: selectedSemester }
          });
          setSchedule(data?.schedule_data || {});
          setFlexibleCourses(data?.flexible_courses || []);
        } catch (err) {
          console.error('雲端課表載入失敗:', err);
          // 雲端載入失敗時嘗試載入本地資料
          const localSchedule = localStorage.getItem(localKey);
          const localFlexible = localStorage.getItem(localFlexibleKey);
          setSchedule(localSchedule ? JSON.parse(localSchedule) : {});
          setFlexibleCourses(localFlexible ? JSON.parse(localFlexible) : []);
        }
      } else {
        // 未登入用戶：從本地載入
        const localSchedule = localStorage.getItem(localKey);
        const localFlexible = localStorage.getItem(localFlexibleKey);
        setSchedule(localSchedule ? JSON.parse(localSchedule) : {});
        setFlexibleCourses(localFlexible ? JSON.parse(localFlexible) : []);
      }
    };

    loadScheduleForSemester();
  }, [isLoggedIn, user, selectedSemester, semesterLoading]);

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
      const searchTerm = filters.courseName.toLowerCase();
      // 同時搜尋中文和英文課程名稱
      result = result.filter(c =>
        c.course_cname?.toLowerCase().includes(searchTerm) ||
        c.course_ename?.toLowerCase().includes(searchTerm)
      );
    }
    if (filters.courseId) {
      result = result.filter(c => c.course_id && c.course_id.includes(filters.courseId));
    }
    if (filters.teacher) {
      const searchTerm = filters.teacher.toLowerCase();
      // 同時搜尋中文和英文教師名稱
      result = result.filter(c =>
        c.teacher?.toLowerCase().includes(searchTerm) ||
        c.eteacher?.toLowerCase().includes(searchTerm)
      );
    }
    if (filters.department) {
      const searchTerm = filters.department.toLowerCase();
      // 同時比對中文和英文系所（大小寫不敏感）
      result = result.filter(c =>
        c.department?.toLowerCase().includes(searchTerm) ||
        c.edepartment?.toLowerCase().includes(searchTerm)
      );
    }
    if (filters.division) {
      const searchTerm = filters.division.toLowerCase();
      // 同時比對中文和英文班別（大小寫不敏感）
      result = result.filter(c =>
        c.division?.toLowerCase().includes(searchTerm) ||
        c.edivision?.toLowerCase().includes(searchTerm)
      );
    }
    if (filters.time) {
      result = result.filter(c => c.time && c.time.toLowerCase().includes(filters.time.toLowerCase()));
    }
    if (filters.conflictMode === 'hide') {
      // 完全隱藏衝堂課程
      result = result.filter(course => !hasTimeConflict(course));
    }
    // 'gray' 模式和 'show' 模式不在這裡過濾，在渲染時處理

    setFilteredCourses(result);
  }, [filters, staticCourses, hasTimeConflict]);

  // 🆕 系所列表（包含中英文）
  const uniqueDepartments = useMemo(() => {
    if (staticCourses.length === 0) return [];

    // 建立系所對應表（中文名 -> 英文名）
    const deptMap = new Map();
    staticCourses.forEach(c => {
      if (c.department && c.department.trim() !== '') {
        if (!deptMap.has(c.department)) {
          deptMap.set(c.department, c.edepartment || '');
        }
      }
    });

    // 轉為物件陣列
    const depts = Array.from(deptMap.entries())
      .map(([cname, ename]) => ({ cname, ename }))
      .sort((a, b) => a.cname.localeCompare(b.cname, 'zh-Hant'));

    console.log('📊 開課單位列表:', depts);
    return depts;
  }, [staticCourses]);

  // 🆕 班別列表（包含中英文）
  const uniqueDivisions = useMemo(() => {
    if (staticCourses.length === 0) return [];

    // 建立班別對應表（中文名 -> 英文名）
    const divMap = new Map();
    staticCourses.forEach(c => {
      if (c.division && c.division.trim() !== '' && c.division !== '通識') {
        if (!divMap.has(c.division)) {
          divMap.set(c.division, c.edivision || '');
        }
      }
    });

    // 轉為物件陣列
    const divs = Array.from(divMap.entries())
      .map(([cname, ename]) => ({ cname, ename }))
      .sort((a, b) => a.cname.localeCompare(b.cname, 'zh-Hant'));

    console.log('📊 班別列表:', divs);
    return divs;
  }, [staticCourses]);

  const showNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  // 🔄 v2.0：儲存課表（依學期）
  const saveSchedule = useCallback(async (newSchedule, newFlexibleCourses, actionType = 'update', courseName = '') => {
    setSchedule(newSchedule);
    setFlexibleCourses(newFlexibleCourses);

    // 🔄 儲存到本地（作為備份，key 包含學期）
    const localKey = `course-schedule-${selectedSemester}`;
    const localFlexibleKey = `flexible-courses-${selectedSemester}`;
    localStorage.setItem(localKey, JSON.stringify(newSchedule));
    localStorage.setItem(localFlexibleKey, JSON.stringify(newFlexibleCourses));

    if (isLoggedIn && user?.google_id) {
      // 🌐 登入用戶：同步到雲端
      setSaveStatus("saving");
      try {
        const response = await robustRequest('post', '/api/schedule', {
          params: { user_id: user.google_id, semester: selectedSemester },
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
  }, [isLoggedIn, user, showNotification, selectedSemester]);

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

      {/* ✅ v2.0：頁首區塊（標題 + 學期選擇器） */}
      <div className="planner-header">
        <div className="header-left">
          <h1>{t('coursePlanner.title')}</h1>
          <span className="header-credits">
            {t('coursePlanner.selectedCredits')}: {totalCredits} {t('coursePlanner.creditsUnit')}
            {totalCredits > 0 && `（${t('coursePlanner.fixed')} ${scheduledCredits} + ${t('coursePlanner.flexible')} ${flexibleCredits}）`}
          </span>
          {/* 學年設定 - 行內顯示 */}
          {availableSemesters.length > 0 && (
            <div className="header-year-settings">
              <span className="year-label">{t('coursePlanner.enrollmentYear', '入學年')}</span>
              <select
                value={enrollmentYear}
                onChange={(e) => {
                  const newEnrollment = parseInt(e.target.value);
                  saveYearSettings(newEnrollment, graduationYear);
                }}
                className="year-dropdown"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year} {t('coursePlanner.academicYear', '學年')}</option>
                ))}
              </select>
              <span className="year-separator">~</span>
              <select
                value={graduationYear}
                onChange={(e) => {
                  const newGraduation = parseInt(e.target.value);
                  saveYearSettings(enrollmentYear, newGraduation);
                }}
                className="year-dropdown"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year} {t('coursePlanner.academicYear', '學年')}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="header-right">
          {availableSemesters.length > 0 && (
            <div className="header-semester-selector">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="semester-dropdown"
              >
                {availableSemesters.map(sem => (
                  <option key={sem.id} value={sem.id}>
                    {sem.id}{sem.id === currentSemester ? ` (${t('coursePlanner.current', '當前')})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <span className="sync-status">{getSaveStatusMessage()}</span>
        </div>
      </div>

      {/* 🆕 v2.0：首次使用時顯示入學年設定 Modal */}
      {needsSetup && (
        <UserYearSettings
          enrollmentYear={enrollmentYear}
          graduationYear={graduationYear}
          yearOptions={yearOptions}
          onSave={saveYearSettings}
          isModal={true}
        />
      )}

      <div className="planner-content">
        {/* ✅ 左側：課表顯示區 + 彈性課程區 */}
        <div className="schedule-section">
          {/* 🆕 v3.0：畢業進度追蹤面板 */}
          <GraduationPanel
            selectedSemester={selectedSemester}
            onSearchCourseId={(courseId) => {
              // 設定 courseId 篩選器，讓用戶在課程搜尋區選擇班次
              setFilters(prev => ({ ...prev, courseId: courseId, courseName: '' }));
              // 展開篩選器
              setFiltersExpanded(true);
            }}
          />
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

          {/* 彈性/無固定時間課程區（在課表下方） */}
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
                      <strong>{getCourseName(fc)}</strong>
                      <small>
                        {(i18n.language === 'en' && fc.eteacher) ? fc.eteacher : fc.teacher} | {(i18n.language === 'en' && fc.edepartment && fc.edepartment !== '0') ? fc.edepartment : fc.department} | {fc.course_credit}{t('coursePlanner.creditsUnit')}
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

        {/* ✅ 右側：課程搜尋區（含可折疊篩選器） */}
        <div className="course-search-container">
          {/* 可折疊篩選器標題 */}
          <button
            className="filters-toggle-btn"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            <span>🔍 {t('coursePlanner.courseSearch', '課程搜尋區')}</span>
            <span className="toggle-icon">{filtersExpanded ? '▲' : '▼'}</span>
          </button>

          {/* 篩選器內容（可折疊） */}
          {filtersExpanded && (
            <div className="search-filters">
              <div className="search-filter-item">
                <label>{t('coursePlanner.courseName')}</label>
                <input
                  type="text"
                  name="courseName"
                  value={filters.courseName}
                  onChange={handleFilterChange}
                  placeholder={t('coursePlanner.searchCoursePlaceholder')}
                />
              </div>
              <div className="search-filter-item">
                <label>{t('coursePlanner.courseId', '課號')}</label>
                <input
                  type="text"
                  name="courseId"
                  value={filters.courseId}
                  onChange={handleFilterChange}
                  placeholder={t('coursePlanner.searchCourseIdPlaceholder', '例: 120134')}
                />
              </div>
              <div className="search-filter-item">
                <label>{t('coursePlanner.teacher')}</label>
                <input
                  type="text"
                  name="teacher"
                  value={filters.teacher}
                  onChange={handleFilterChange}
                  placeholder={t('coursePlanner.searchTeacherPlaceholder')}
                />
              </div>
              <div className="search-filter-item">
                <label>{t('coursePlanner.department', '開課')}</label>
                <input
                  type="text"
                  name="department"
                  list="department-list"
                  value={filters.department}
                  onChange={handleFilterChange}
                  placeholder={t('coursePlanner.selectDepartment', '搜尋科系')}
                />
                <datalist id="department-list">
                  <option value="">{t('coursePlanner.allDepartments', '全部')}</option>
                  {uniqueDepartments.map(dept => {
                    // 判斷是否使用英文名稱：英文模式 + ename 有值且不為空字串或 "0"
                    const isValidEname = dept.ename && dept.ename.trim() !== '' && dept.ename !== '0';
                    const displayName = (i18n.language === 'en' && isValidEname)
                      ? dept.ename
                      : dept.cname;
                    return <option key={dept.cname} value={displayName} />;
                  })}
                </datalist>
              </div>
              <div className="search-filter-item">
                <label>{t('coursePlanner.classTime')}</label>
                <input
                  type="text"
                  name="time"
                  value={filters.time}
                  onChange={handleFilterChange}
                  placeholder={t('coursePlanner.classTimePlaceholder')}
                />
              </div>
              <div className="search-filter-item conflict-mode">
                <label>{t('coursePlanner.conflictCourses', '衝堂課程')}</label>
                <div className="conflict-mode-buttons">
                  <button
                    type="button"
                    className={filters.conflictMode === 'show' ? 'active' : ''}
                    onClick={() => setFilters(prev => ({ ...prev, conflictMode: 'show' }))}
                  >
                    {t('coursePlanner.showAll', '顯示')}
                  </button>
                  <button
                    type="button"
                    className={filters.conflictMode === 'gray' ? 'active' : ''}
                    onClick={() => setFilters(prev => ({ ...prev, conflictMode: 'gray' }))}
                  >
                    {t('coursePlanner.showGray', '灰色')}
                  </button>
                  <button
                    type="button"
                    className={filters.conflictMode === 'hide' ? 'active' : ''}
                    onClick={() => setFilters(prev => ({ ...prev, conflictMode: 'hide' }))}
                  >
                    {t('coursePlanner.hideAll', '隱藏')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 搜尋結果分隔線 */}
          <div className="search-results-divider">
            <span>{t('coursePlanner.foundCourses', '共找到')} {filteredCourses.length} {t('coursePlanner.coursesUnit', '門課程')}</span>
          </div>

          {/* 課程列表 */}
          <div className="course-list-wrapper">
            {isLoading ? (
              <p>{t('coursePlanner.loading')}</p>
            ) : (
              <ul className="course-list">
                {filteredCourses.map((course, index) => {
                  const isConflicting = hasTimeConflict(course);
                  const isDisabled = filters.conflictMode === 'gray' && isConflicting;
                  return (
                    <li
                      key={`${course.course_id}-${course.time}-${index}`}
                      className={isDisabled ? 'course-disabled' : ''}
                    >
                      <div className="course-info">
                        <div className="course-title-container">
                          <strong>{getCourseName(course)}</strong>
                          {!course.time && <span className="course-type-badge flexible">{t('coursePlanner.flexible')}</span>}
                          {isDisabled && <span className="course-type-badge conflict">{t('coursePlanner.conflicting', '衝堂')}</span>}
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
                        className={`course-toggle-btn ${isCourseInSchedule(course) || isCourseInFlexible(course) ? 'remove' : 'add'}`}
                        onClick={() => handleCourseToggle(course)}
                        disabled={isDisabled}
                      >
                        {isCourseInSchedule(course) || isCourseInFlexible(course) ? '−' : '+'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 📱 手機版：課程搜尋浮動按鈕 */}
      <button
        className="mobile-search-fab"
        onClick={() => setMobileSearchOpen(true)}
        title={t('coursePlanner.courseSearch', '課程搜尋')}
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} />
      </button>

      {/* 📱 手機版：課程搜尋 BottomSheet */}
      <BottomSheet
        isVisible={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        title={t('coursePlanner.courseSearch', '課程搜尋區')}
        subtitle={`${t('coursePlanner.foundCourses', '共找到')} ${filteredCourses.length} ${t('coursePlanner.coursesUnit', '門課程')}`}
        maxHeight="85vh"
        className="course-search-bottom-sheet"
      >
        {/* 篩選器 */}
        <div className="mobile-search-filters">
          <input
            type="text"
            name="courseName"
            value={filters.courseName}
            onChange={handleFilterChange}
            placeholder={t('coursePlanner.searchCoursePlaceholder')}
          />
          <input
            type="text"
            name="teacher"
            value={filters.teacher}
            onChange={handleFilterChange}
            placeholder={t('coursePlanner.searchTeacherPlaceholder')}
          />
          <input
            type="text"
            name="department"
            list="mobile-department-list"
            value={filters.department}
            onChange={handleFilterChange}
            placeholder={t('coursePlanner.selectDepartment', '輸入或選擇開課單位')}
          />
          <datalist id="mobile-department-list">
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept} />
            ))}
          </datalist>
          <input
            type="text"
            name="time"
            value={filters.time}
            onChange={handleFilterChange}
            placeholder={t('coursePlanner.classTimePlaceholder')}
          />
          <div className="mobile-conflict-mode">
            <label>{t('coursePlanner.conflictCourses', '衝堂課程')}</label>
            <div className="conflict-mode-buttons">
              <button
                type="button"
                className={filters.conflictMode === 'show' ? 'active' : ''}
                onClick={() => setFilters(prev => ({ ...prev, conflictMode: 'show' }))}
              >
                {t('coursePlanner.showAll', '顯示')}
              </button>
              <button
                type="button"
                className={filters.conflictMode === 'gray' ? 'active' : ''}
                onClick={() => setFilters(prev => ({ ...prev, conflictMode: 'gray' }))}
              >
                {t('coursePlanner.showGray', '灰色')}
              </button>
              <button
                type="button"
                className={filters.conflictMode === 'hide' ? 'active' : ''}
                onClick={() => setFilters(prev => ({ ...prev, conflictMode: 'hide' }))}
              >
                {t('coursePlanner.hideAll', '隱藏')}
              </button>
            </div>
          </div>
        </div>

        {/* 課程列表 */}
        <ul className="mobile-course-list">
          {filteredCourses.map((course, index) => {
            const isConflicting = hasTimeConflict(course);
            const isDisabled = filters.conflictMode === 'gray' && isConflicting;
            return (
              <li
                key={`mobile-${course.course_id}-${course.time}-${index}`}
                className={isDisabled ? 'course-disabled' : ''}
              >
                <div className="course-info">
                  <strong>{getCourseName(course)}</strong>
                  {isDisabled && <span className="course-badge-conflict">{t('coursePlanner.conflicting', '衝堂')}</span>}
                  <small>{formatCourseInfo(course)}</small>
                </div>
                <button
                  className={`course-toggle-btn ${isCourseInSchedule(course) || isCourseInFlexible(course) ? 'remove' : 'add'}`}
                  onClick={() => handleCourseToggle(course)}
                  disabled={isDisabled}
                >
                  {isCourseInSchedule(course) || isCourseInFlexible(course) ? '−' : '+'}
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>
    </div>
  );
};

export default CoursePlanner;
