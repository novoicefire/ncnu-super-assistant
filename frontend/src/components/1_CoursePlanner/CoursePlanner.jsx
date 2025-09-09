// frontend/src/components/1_CoursePlanner/CoursePlanner.jsx (移除樣式衝突版)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import CourseTable from './CourseTable.jsx';
import './CoursePlanner.css';
import { useAuth } from '../../AuthContext.jsx';
import SpecialBanner from '../0_Dashboard/SpecialBanner.jsx'; // ✅ 新增：引入特殊橫幅組件
import { robustRequest } from '../../apiHelper.js';

const CoursePlanner = () => {
  const { user, isLoggedIn } = useAuth();
  const [staticCourses, setStaticCourses] = useState([]);
  const [hotnessData, setHotnessData] = useState({});
  const [schedule, setSchedule] = useState({});
  const [timelessCourses, setTimelessCourses] = useState([]); // ✅ 新增：無時間課程的狀態
  const [totalCredits, setTotalCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [isCapturing, setIsCapturing] = useState(false);
  const [filters, setFilters] = useState({
    courseName: '',
    teacher: '',
    department: '',
    division: '',
    hideConflicting: false
  });
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);

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
      showNotification('❌ 找不到課表元素，無法截圖', 'error');
      return;
    }

    setIsCapturing(true);
    try {
      showNotification('📸 正在生成課表圖片...', 'info');
      
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
          link.download = `暨大課表_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          showNotification('✅ 課表圖片下載成功！', 'success');
        } else {
          throw new Error('無法生成圖片檔案');
        }
      }, 'image/png');

    } catch (error) {
      console.error('截圖失敗:', error);
      showNotification('❌ 截圖失敗，請稍後再試', 'error');
    } finally {
      setIsCapturing(false);
    }
  }, []);

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
          // ✅ 更新：同時設定 schedule 和 timelessCourses
          setSchedule(data?.schedule || {});
          setTimelessCourses(data?.timelessCourses || []);
        })
        .catch(err => {
          console.error('雲端課表載入失敗:', err);
          // 雲端載入失敗時嘗試載入本地資料
          const localData = localStorage.getItem('course-schedule');
          if (localData) {
            const parsedData = JSON.parse(localData);
            setSchedule(parsedData.schedule || {});
            setTimelessCourses(parsedData.timelessCourses || []);
          }
        });
    } else {
      // 未登入用戶：從本地載入
      const localData = localStorage.getItem('course-schedule');
      if (localData) {
        const parsedData = JSON.parse(localData);
        setSchedule(parsedData.schedule || {});
        setTimelessCourses(parsedData.timelessCourses || []);
      }
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    const uniqueCourses = [...new Map(Object.values(schedule).map(item => [item['course_id'], item])).values()];
    const scheduleCredits = uniqueCourses.reduce((sum, course) => sum + parseFloat(course.course_credit || 0), 0);
    const timelessCredits = timelessCourses.reduce((sum, course) => sum + parseFloat(course.course_credit || 0), 0);
    setTotalCredits(scheduleCredits + timelessCredits);
  }, [schedule, timelessCourses]);

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
  const saveSchedule = useCallback(async (newSchedule, newTimelessCourses, actionType = 'update', courseName = '') => {
    setSchedule(newSchedule); // 更新有時間的課表狀態
    setTimelessCourses(newTimelessCourses); // 更新無時間的課程狀態
    
    // 準備要儲存的完整資料結構
    const dataToSave = {
      schedule: newSchedule,
      timelessCourses: newTimelessCourses,
    };
    
    // 🔄 總是先儲存到本地（作為備份）
    localStorage.setItem('course-schedule', JSON.stringify(dataToSave));
    
    if (isLoggedIn && user?.google_id) {
      // 🌐 登入用戶：同步到雲端
      setSaveStatus("saving");
      try {
        const response = await robustRequest('post', '/api/schedule', { params: { user_id: user.google_id }, data: dataToSave });
        
        if (response && response.success) {
          setSaveStatus("success");
          if (actionType === 'add') {
            showNotification(`✅ 「${courseName}」已成功加入課表並同步至雲端`, 'success');
          } else if (actionType === 'remove') {
            showNotification(`🗑️ 「${courseName}」已從課表移除並同步至雲端`, 'success');
          } else {
            showNotification('✔ 課表已同步至雲端', 'success');
          }
        } else {
          throw new Error(response.error || "Backend response did not indicate success.");
        }
      } catch (error) {
        setSaveStatus("error");
        console.error("Failed to save schedule to cloud:", error);
        showNotification('❌ 雲端同步失敗，但已保存到本地。請檢查網路連線', 'warning');
      } finally {
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } else {
      // 💾 未登入用戶：只存本地
      if (actionType === 'add') {
        showNotification(`✅ 「${courseName}」已加入課表，登入後可同步至雲端`, 'success');
      } else if (actionType === 'remove') {
        showNotification(`🗑️ 「${courseName}」已從課表移除`, 'success');
      }
    }
  }, [isLoggedIn, user, showNotification]);

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
      // ✅ 處理無時間課程
      if (timelessCourses.some(c => c.course_id === course.course_id && c.class === course.class)) {
        showNotification(`⚠️ 「${course.course_cname}」已在無時間課程列表中`, 'warning');
        return;
      }
      const newTimelessCourses = [...timelessCourses, course];
      saveSchedule(schedule, newTimelessCourses, 'add', course.course_cname);
      return;
    }

    if (isCourseInSchedule(course)) {
      showNotification(`⚠️ 「${course.course_cname}」已在課表中`, 'warning');
    }

    for (let slot of slots) {
      if (schedule[slot]) {
        showNotification(
          `⚠️ 課程時間衝突！時段 ${slot[0]} 的 ${slot.substring(1)} 節已被「${schedule[slot].course_cname}」佔用`,
          'warning'
        );
        return;
      }
    }

    const newSchedule = { ...schedule };
    slots.forEach(slot => {
      newSchedule[slot] = course;
    });

    saveSchedule(newSchedule, timelessCourses, 'add', course.course_cname);
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

    saveSchedule(newSchedule, timelessCourses, 'remove', courseName);
  };

  // ✅ 新增：從無時間課程列表中移除
  const removeFromTimeless = (courseId, courseClass) => {
    const courseToRemove = timelessCourses.find(c => c.course_id === courseId && c.class === courseClass);
    const newTimelessCourses = timelessCourses.filter(c => !(c.course_id === courseId && c.class === courseClass));
    saveSchedule(schedule, newTimelessCourses, 'remove', courseToRemove?.course_cname || '課程');
  };

  const isCourseInSchedule = (course) => {
    const slots = parseTimeSlots(course.time);
    if (slots.length > 0) {
      return slots.some(slot => 
        schedule[slot] && 
        schedule[slot].course_id === course.course_id && 
        schedule[slot].time === course.time
      );
    } else {
      // ✅ 檢查是否在無時間課程列表中
      return timelessCourses.some(c => c.course_id === course.course_id && c.class === course.class);
    }
  };

  const handleCourseToggle = (course) => {
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

  const getSaveStatusMessage = () => {
    if (!isLoggedIn) return "登入後即可將課表同步至雲端";
    
    switch (saveStatus) {
      case "saving": return "同步中...";
      case "success": return "✔ 課表已同步至雲端！";
      case "error": return "❌ 雲端同步失敗，已保存到本地";
      default: return "課表變動將自動同步";
    }
  };

  const conflictingCoursesCount = useMemo(() => {
    if (!filters.hideConflicting) return 0;
    return staticCourses.filter(course => hasTimeConflict(course)).length;
  }, [staticCourses, hasTimeConflict, filters.hideConflicting]);

  return (
    <div className="course-planner">
      {/* ✅ 新增：在頁面頂部顯示特殊橫幅 */}
      <SpecialBanner />

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
        <h1>智慧排課系統</h1>
        <div className="header-info">
          <span>已選學分: {totalCredits} 學分</span>
          <span>{getSaveStatusMessage()}</span>
        </div>
      </div>

      {/* 篩選器區域 */}
      <div className="filters">
        <div className="filter-group">
          <label>課程名稱</label>
          <input 
            type="text"
            name="courseName"
            value={filters.courseName}
            onChange={handleFilterChange}
            placeholder="搜尋課程名稱..."
          />
        </div>
        
        <div className="filter-group">
          <label>授課教師</label>
          <input 
            type="text"
            name="teacher"
            value={filters.teacher}
            onChange={handleFilterChange}
            placeholder="搜尋教師姓名..."
          />
        </div>
        
        <div className="filter-group">
          <label>開課單位</label>
          <input 
            type="text" 
            name="department" 
            list="department-list"
            value={filters.department} 
            onChange={handleFilterChange}
            placeholder="輸入或選擇開課單位"
            autoComplete="off"
          />
          <datalist id="department-list">
            <option value="">所有開課單位</option>

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
          <label>班別</label>
          <select name="division" value={filters.division} onChange={handleFilterChange}>
            <option value="">所有班別</option>
            {uniqueDivisions.map(division => (
              <option key={division} value={division}>{division}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group conflict-filter-group">
          <label className="conflict-filter-label">
            <input 
              type="checkbox"
              name="hideConflicting"
              checked={filters.hideConflicting}
              onChange={handleFilterChange}
              className="conflict-checkbox"
            />
            <div className="conflict-checkbox-text">
              <span>隱藏衝堂課程</span>
              {conflictingCoursesCount > 0 && (
                <span className="conflict-count">({conflictingCoursesCount}門課程)</span>
              )}
            </div>
          </label>
          <div className="filter-info">
            避免顯示與已選課程時間衝突的課程
          </div>
        </div>
      </div>

      <div className="planner-content">
        {/* 課程列表 */}
        <div className="course-list-container">
          <h3>課程列表 ({filteredCourses.length})</h3>
          {isLoading ? (
            <p>載入課程資料中...</p>
          ) : (
            <ul className="course-list">
              {filteredCourses.map((course, index) => (
                <li key={`${course.course_id}-${course.time}-${index}`}>
                  <div className="course-info">
                    <strong>{course.course_cname}</strong>
                    {hotnessData && hotnessData[course.course_id] && (
                      <span className="hotness-indicator">
                        🔥 {hotnessData[course.course_id]}人
                      </span>
                    )}
                    <small>
                      {formatCourseInfo(course)}
                    </small>
                  </div>
                  <button 
                    className={`course-toggle-btn ${isCourseInSchedule(course) ? 'remove' : 'add'}`}
                    onClick={() => handleCourseToggle(course)}
                  >
                    {isCourseInSchedule(course) ? '−' : '+'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 課表顯示區域 */}
        <div className="schedule-container">
          <div className="schedule-header">
            <h3>我的課表</h3>
            <button 
              className="save-image-btn"
              onClick={captureScheduleImage}
              disabled={isCapturing}
              title="下載課表圖片"
            >
              {isCapturing ? '📸 生成中...' : '📷 保存圖片'}
            </button>
          </div>
          <CourseTable 
            schedule={schedule} 
            onRemove={removeFromSchedule} 
          />
        </div>

        {/* ✅ 新增：無時間課程列表 */}
        <div className="timeless-courses-container">
          <div className="schedule-header">
            <h3>無時間課程</h3>
          </div>
          <div className="course-list-container timeless-list">
            {timelessCourses.length > 0 ? (
              <ul className="course-list">
                {timelessCourses.map((course, index) => (
                  <li key={`${course.course_id}-${index}`}>
                    <div className="course-info">
                      <strong>{course.course_cname}</strong>
                      <small>
                        {formatCourseInfo(course)}
                      </small>
                    </div>
                    <button 
                      className="course-toggle-btn remove"
                      onClick={() => removeFromTimeless(course.course_id, course.class)}
                      title={`移除 ${course.course_cname}`}
                    >
                      −
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-timeless-msg">此處會顯示您加入的無固定時間課程，例如專題、實習等。</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlanner;
