// frontend/src/components/1_CoursePlanner/CoursePlanner.jsx (修復開課單位顯示問題)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
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
    const [filters, setFilters] = useState({
        courseName: '',
        teacher: '',
        department: '',
        division: '',
        hideConflicting: false
    });
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // 🎯 新增：課程資料清理與標準化函數
    const normalizeCourseDepartment = useCallback((course) => {
        // 處理「中文思辨與表達」課程
        if (course.course_cname && course.course_cname.includes('中文思辨與表達')) {
            return {
                ...course,
                department: '通識領域課程'
            };
        }
        
        // 處理其他空 department 的課程
        if (!course.department || course.department.trim() === '') {
            // 根據課程名稱推斷所屬單位
            if (course.course_cname) {
                const courseName = course.course_cname;
                
                // 通識課程關鍵詞檢測
                if (courseName.includes('通識') || 
                    courseName.includes('中文思辨') || 
                    courseName.includes('跨域專業學術英文')) {
                    return {
                        ...course,
                        department: '通識領域課程'
                    };
                }
                
                // 全校共同課程
                if (courseName.includes('服務學習') || 
                    courseName.includes('全校') ||
                    courseName.includes('共同')) {
                    return {
                        ...course,
                        department: '全校共同課程'
                    };
                }
            }
            
            // 預設分類
            return {
                ...course,
                department: '其他課程'
            };
        }
        
        return course;
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const coursePromise = axios.get('/data/本學期開課資訊API.json');
                const hotnessPromise = robustRequest('get', '/api/courses/hotness');
                const [courseRes, hotnessDataResult] = await Promise.all([coursePromise, hotnessPromise]);
                
                // 🎯 修改：清理和標準化課程資料
                const rawCourses = courseRes.data?.course_ncnu?.item || [];
                const normalizedCourses = rawCourses.map(course => normalizeCourseDepartment(course));
                
                console.log('🔍 中文思辨課程檢查:', normalizedCourses.filter(c => 
                    c.course_cname && c.course_cname.includes('中文思辨')
                ).map(c => ({ name: c.course_cname, dept: c.department })));
                
                setStaticCourses(normalizedCourses);
                setHotnessData(hotnessDataResult || {});
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                if (staticCourses.length === 0) {
                    try {
                        const courseRes = await axios.get('/data/本學期開課資訊API.json');
                        const rawCourses = courseRes.data?.course_ncnu?.item || [];
                        const normalizedCourses = rawCourses.map(course => normalizeCourseDepartment(course));
                        setStaticCourses(normalizedCourses);
                    } catch (staticError) {
                        console.error("Failed to fetch static course data:", staticError);
                    }
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
            return schedule[slot] && 
                   schedule[slot].course_id !== course.course_id;
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

    // 🎯 修改：改進 department 列表生成邏輯
    const uniqueDepartments = useMemo(() => {
        if (staticCourses.length === 0) return [];
        
        const departments = staticCourses
            .map(c => c.department)
            .filter(dept => dept && dept.trim() !== '')
            .filter(Boolean);
            
        const uniqueDepts = [...new Set(departments)].sort();
        
        console.log('📊 所有開課單位:', uniqueDepts);
        console.log('📊 通識課程數量:', staticCourses.filter(c => c.department === '通識領域課程').length);
        
        return uniqueDepts;
    }, [staticCourses]);

    const uniqueDivisions = useMemo(() => {
        if (staticCourses.length === 0) return [];
        return [...new Set(staticCourses.map(c => c.division).filter(division => division && division !== '通識'))].sort();
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
            <div className="notifications-container">
                {notifications.map(notification => (
                    <div 
                        key={notification.id} 
                        className={`notification notification-${notification.type}`}
                    >
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
                <h2>智慧排課系統</h2>
                <div className="save-status">{getSaveStatusMessage()}</div>
            </div>

            {isLoading && (
                <div className="loading-message">
                    載入課程中...有時候會等比較久，因為太久沒人用後端會自動休眠，大概一分鐘內就會醒來 😃
                </div>
            )}

            {!isLoading && (
                <>
                    <div className="filters">
                        <div className="filter-group">
                            <label>課程名稱</label>
                            <input
                                type="text"
                                name="courseName"
                                placeholder="搜尋課程名稱"
                                value={filters.courseName}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="filter-group">
                            <label>授課教師</label>
                            <input
                                type="text"
                                name="teacher"
                                placeholder="搜尋教師姓名"
                                value={filters.teacher}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="filter-group">
                            <label>開課系所</label>
                            <select name="department" value={filters.department} onChange={handleFilterChange}>
                                <option value="">所有系所</option>
                                {uniqueDepartments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>所有班別</label>
                            <select name="division" value={filters.division} onChange={handleFilterChange}>
                                <option value="">所有班別</option>
                                {uniqueDivisions.map(div => (
                                    <option key={div} value={div}>{div}</option>
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
                                <span className="conflict-checkbox-text">
                                    隱藏衝堂課程
                                    {filters.hideConflicting && conflictingCoursesCount > 0 && (
                                        <span className="conflict-count">
                                            （已隱藏 {conflictingCoursesCount} 門）
                                        </span>
                                    )}
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="planner-content">
                        <div className="course-list-container">
                            <h3>
                                課程列表 ({filteredCourses.length} 門課程)
                                {filters.hideConflicting && conflictingCoursesCount > 0 && (
                                    <span className="filter-info">
                                        ・已過濾 {conflictingCoursesCount} 門衝堂課程
                                    </span>
                                )}
                            </h3>
                            <ul className="course-list">
                                {filteredCourses.map((course, index) => (
                                    <li key={index}>
                                        <div className="course-info">
                                            <strong>{course.course_cname}</strong>
                                            <span className="hotness-indicator">
                                                🔥 {hotnessData.hasOwnProperty(course.course_id) 
                                                    ? hotnessData[course.course_id] 
                                                    : 0} 人已加入
                                            </span>
                                            <small>
                                                {course.teacher} | {course.department} | 
                                                {course.division} | {course.course_credit}學分 | {course.time}
                                            </small>
                                        </div>
                                        <button 
                                            className={`course-toggle-btn ${isCourseInSchedule(course) ? 'remove' : 'add'}`}
                                            onClick={() => handleCourseToggle(course)}
                                            title={isCourseInSchedule(course) ? '從課表移除' : '加入課表'}
                                        >
                                            {isCourseInSchedule(course) ? '−' : '+'}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="schedule-container">
                            <h3>我的課表 (共 {totalCredits} 學分)</h3>
                            <CourseTable schedule={schedule} onRemove={removeFromSchedule} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CoursePlanner;
