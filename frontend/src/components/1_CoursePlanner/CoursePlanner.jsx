// frontend/src/components/1_CoursePlanner/CoursePlanner.jsx (修復課程熱度顯示版)
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
    const [saveStatus, setSaveStatus] = useState("idle"); // idle, saving, success, error
    const [filters, setFilters] = useState({
        courseName: '',
        teacher: '',
        department: '',
        division: ''
    });
    const [filteredCourses, setFilteredCourses] = useState([]);

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

    useEffect(() => {
        let result = staticCourses;
        if (filters.courseName) result = result.filter(c => c.course_cname.toLowerCase().includes(filters.courseName.toLowerCase()));
        if (filters.teacher) result = result.filter(c => c.teacher.toLowerCase().includes(filters.teacher.toLowerCase()));
        if (filters.department) result = result.filter(c => c.department === filters.department);
        if (filters.division) {
            // 🔧 修復：移除通識的特殊處理，統一使用 division 篩選
            result = result.filter(c => c.division === filters.division);
        }
        setFilteredCourses(result);
    }, [filters, staticCourses]);

    const uniqueDepartments = useMemo(() => {
        if (staticCourses.length === 0) return [];
        return [...new Set(staticCourses.map(c => c.department).filter(Boolean))].sort();
    }, [staticCourses]);

    // 🔧 修復：生成班別選單選項，排除「通識」
    const uniqueDivisions = useMemo(() => {
        if (staticCourses.length === 0) return [];
        return [...new Set(staticCourses.map(c => c.division).filter(division => division && division !== '通識'))].sort();
    }, [staticCourses]);

    const saveSchedule = useCallback(async (newSchedule) => {
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
                } else {
                    throw new Error(response.error || "Backend response did not indicate success.");
                }
            } catch (error) {
                setSaveStatus("error");
                console.error("Failed to save schedule to cloud:", error);
            } finally {
                setTimeout(() => setSaveStatus("idle"), 3000);
            }
        }
    }, [isLoggedIn, user]);

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
            alert('此課程無時間資訊，無法加入課表。');
            return;
        }
        for (let slot of slots) {
            if (schedule[slot]) {
                alert(`課程衝堂！\n時段 ${slot[0]} 的 ${slot.substring(1)} 節已被「${schedule[slot].course_cname}」佔用。`);
                return;
            }
        }
        const newSchedule = { ...schedule };
        slots.forEach(slot => {
            newSchedule[slot] = course;
        });
        saveSchedule(newSchedule);
    };

    const removeFromSchedule = (courseId, time) => {
        const slots = parseTimeSlots(time);
        const newSchedule = { ...schedule };
        slots.forEach(slot => {
            if (newSchedule[slot] && newSchedule[slot].course_id === courseId && newSchedule[slot].time === time) {
                delete newSchedule[slot];
            }
        });
        saveSchedule(newSchedule);
    };

    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const getSaveStatusMessage = () => {
        if (!isLoggedIn) return "登入後即可將課表儲存至雲端";
        switch (saveStatus) {
            case "saving": return "儲存中...";
            case "success": return "✔ 課表已同步至雲端！";
            case "error": return "❌ 儲存失敗，請檢查網路或稍後再試。";
            default: return "課表變動將自動同步";
        }
    };

    return (
        <div className="course-planner">
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
                    </div>

                    <div className="planner-content">
                        <div className="course-list-container">
                            <h3>課程列表 ({filteredCourses.length} 門課程)</h3>
                            <ul className="course-list">
                                {filteredCourses.map((course, index) => (
                                    <li key={index}>
                                        <div className="course-info">
                                            <strong>{course.course_cname}</strong>
                                            {/* 🔧 修復：正確的課程熱度顯示邏輯 */}
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
                                        <button onClick={() => addToSchedule(course)}>➕</button>
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
