// frontend/src/components/1_CoursePlanner/CoursePlanner.jsx (修復課程資訊顯示格式問題)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import CourseTable from './CourseTable.jsx';
import './CoursePlanner.css';
import { useAuth } from '../../AuthContext.jsx';
import { robustRequest } from '../../apiHelper.js';

const CoursePlanner = () => {
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
    hideConflicting: false
  });
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // 課程資料清理與標準化函數
  const normalizeCourseDepartment = useCallback((course) => {
    // 處理「中文思辨與表達」課程
    if (course.course_cname && course.course_cname.includes('中文思辨與表達')) {
      return { ...course, department: '通識領域課程' };
    }

    // 處理其他空 department 的課程
    if (!course.department || course.department.trim() === '') {
      // 根據課程名稱推斷所屬單位
      if (course.course_cname) {
        const courseName = course.course_cname;
        // 通識課程關鍵詞檢測
        if (courseName.includes('通識') || courseName.includes('中文思辨') || 
            courseName.includes('跨域專業學術英文')) {
          return { ...course, department: '通識領域課程' };
        }
        // 全校共同課程
        if (courseName.includes('服務學習') || courseName.includes('全校') || 
            courseName.includes('共同')) {
          return { ...course, department: '全校共同課程' };
        }
      }
      // 預設分類
      return { ...course, department: '其他課程' };
    }
    return course;
  }, []);

  // 🎯 新增：格式化課程資訊顯示函數
  const formatCourseInfo = useCallback((course) => {
    const info = [];
    
    if (course.teacher) info.push(course.teacher);
    if (course.department) info.push(course.department);
    if (course.division) info.push(course.division);
    if (course.time) info.push(course.time);
    if (course.classroom && course.classroom.trim() !== '') info.push(course.classroom);
    if (course.course_credit) info.push(`${course.course_credit}學分`);
    
    return info.join(' | ');
  }, []);

  // 截圖功能
  const captureScheduleImage = useCallback(async () => {
    const tableElement = document.getElementById('course-schedule-table');
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 載入課程資料
        console.log('🔄 開始載入課程資料...');
        const courseRes = await axios.get('/data/本學期開課資訊API.json');
        const rawCourses = courseRes.data?.course_ncnu?.item || [];
        
        // 確保所有原始資料欄位都保留，包括 division
        const normalizedCourses = rawCourses.map(course => {
          const normalized = normalizeCourseDepartment(course);
          // 確保 division 欄位存在且有預設值
          if (!normalized.division || normalized.division.trim() === '') {
            normalized.division = '一般班';
          }
          return normalized;
        });
        
        console.log('✅ 課程資料載入完成，共', normalizedCourses.length, '門課程');
        console.log('🔍 Division 欄位檢查:', 
          [...new Set(normalizedCourses.map(c => c.division))].filter(Boolean)
        );
        
        setStaticCourses(normalizedCourses);

        // 改善課程熱度資料載入邏輯
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

  useEffect(() => {
    if (isLoggedIn && user?.google_id) {
      robustRequest('get', '/api/schedule', { params: { user_id: user.google_id } })
        .then(data => setSchedule(data || {}))
        .catch(err => setSchedule({}));
    } else {
      setSchedule({});
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    const uniqueCourses = [...new Map(Object.values(schedule).map(item => [item['course_id'], item])).values()];
    const total = uniqueCourses.reduce((sum, course) => sum + parseFloat(course.course_credit || 0), 0);
    setTotalCredits(total);
  }, [schedule]);

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

  const saveSchedule = useCallback(async (newSchedule, actionType = 'update', courseName = '') => {
    setSchedule(newSchedule);
    
    if (isLoggedIn && user?.google_id) {
      setSaveStatus("saving");
      try {
        const response = await robustRequest('post', '/api/schedule', {
          params: { user_id: user.google_id },
          data: newSchedule
        });
        
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
        showNotification('❌ 儲存失敗，請檢查網路連線或稍後再試', 'error');
      } finally {
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } else if (!isLoggedIn) {
      if (actionType === 'add') {
        showNotification(`📝 「${courseName}」已加入本地課表，登入後可同步至雲端`, 'warning');
      } else if (actionType === 'remove') {
        showNotification(`📝 「${courseName}」已從本地課表移除`, 'warning');
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
      showNotification('⚠️ 此課程無時間資訊，無法加入課表', 'warning');
      return;
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

    saveSchedule(newSchedule, 'add', course.course_cname);
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

    saveSchedule(newSchedule, 'remove', courseName);
  };

  const isCourseInSchedule = (course) => {
    const slots = parseTimeSlots(course.time);
    return slots.some(slot => 
      schedule[slot] && 
      schedule[slot].course_id === course.course_id && 
      schedule[slot].time === course.time
    );
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
    if (!isLoggedIn) return "登入後即可將課表儲存至雲端";
    
    switch (saveStatus) {
      case "saving": return "儲存中...";
      case "success": return "✔ 課表已同步至雲端！";
      case "error": return "❌ 儲存失敗，請檢查網路或稍後再試。";
      default: return "課表變動將自動同步";
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
          <select name="department" value={filters.department} onChange={handleFilterChange}>
            <option value="">所有單位</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
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
                    {/* 🔧 修正：使用新的格式化函數，避免空欄位產生多餘分隔符 */}
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
      </div>
    </div>
  );
};

export default CoursePlanner;
