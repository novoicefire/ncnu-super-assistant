// frontend/src/components/1_CoursePlanner/CoursePlanner.jsx (新增隱藏衝堂課程功能)
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
        hideConflicting: false // 🎯 新增：隱藏衝堂課程開關
    });
    const [filteredCourses, setFilteredCourses] = useState([]);
    
    // 🔔 通知系統狀態
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const coursePromise = axios.get('/data/本學期開課資訊API.json');
                const hotnessPromise = robustRequest('get', '/api/courses/hotness');
                const [courseRes, hotnessDataResult] = await Promise.all([coursePromise, hotnessPromise]);
                setStaticCourses(courseRes.data?.course_ncnu?.item || []);
                setHotnessData(hotnessDataResult || {});
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                if (staticCourses.length === 0) {
                    try {
                        const courseRes = await axios.get('/data/本學期開課資訊API.json');
                        setStaticCourses(courseRes.data?.course_ncnu?.item || []);
                    } catch (staticError) {
                        console.error("Failed to fetch static course data:", staticError);
                    }
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

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

    // 🎯 新增：時間衝突檢測函數
    const hasTimeConflict = useCallback((course) => {
        if (!course.time || Object.keys(schedule).length === 0) return false;
        
        const courseSlots = parseTimeSlots(course.time);
        if (courseSlots.length === 0) return false;
        
        // 檢查是否與已選課程時間衝突
        return courseSlots.some(slot => {
            return schedule[slot] && 
                   schedule[slot].course_id !== course.course_id; // 排除自己
        });
    }, [schedule]);

    // 🎯 修改：整合衝堂課程篩選邏輯
    useEffect(() => {
        let result = staticCourses;
        
        // 原有篩選邏輯
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
        
        // 🎯 新增：衝堂課程篩選
        if (filters.hideConflicting) {
            result = result.filter(course => !hasTimeConflict(course));
        }
        
        setFilteredCourses(result);
    }, [filters, staticCourses, hasTimeConflict]);

    const uniqueDepartments = useMemo(() => {
        if (staticCourses.length === 0) return [];
        return [...new Set(staticCourses.map(c => c.department).filter(Boolean))].sort();
    }, [staticCourses]);

    const uniqueDivisions = useMemo(() => {
        if (staticCourses.length === 0) return [];
        return [...new Set(staticCourses.map(c => c.division).filter(division => division && division !== '通識'))].sort();
    }, [staticCourses]);

    // 通知管理函數
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

    // 🎯 修改：處理篩選變更（包括新的衝堂開關）
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

    // 🎯 新增：計算被隱藏的衝堂課程數量
    const conflictingCoursesCount = useMemo(() => {
        if (!filters.hideConflicting) return 0;
        return staticCourses.filter(course => hasTimeConflict(course)).length;
    }, [staticCourses, hasTimeConflict, filters.hideConflicting]);

    return (
        <div className="course-planner">
            {/* 通知容器 */}
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
                            <label>所有系所</label>
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
                        {/* 🎯 新增：隱藏衝堂課程開關 */}
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
