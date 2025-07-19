// frontend/src/components/1_CoursePlanner/CoursePlanner.jsx (最終反饋優化版)

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
    const [filters, setFilters] = useState({ courseName: '', teacher: '', department: '', division: '' });
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
                    } catch (staticError) { console.error("Failed to fetch static course data:", staticError); }
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
             if (filters.division === '通識') result = result.filter(c => c.department === '通識');
             else result = result.filter(c => c.division === filters.division);
        }
        setFilteredCourses(result);
    }, [filters, staticCourses]);

    const uniqueDepartments = useMemo(() => {
        if (staticCourses.length === 0) return [];
        return [...new Set(staticCourses.map(c => c.department).filter(Boolean))].sort();
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
        if (slots.length === 0) { alert('此課程無時間資訊，無法加入課表。'); return; }
        for (let slot of slots) {
            if (schedule[slot]) {
                alert(`課程衝堂！\n時段 ${slot[0]} 的 ${slot.substring(1)} 節已被「${schedule[slot].course_cname}」佔用。`);
                return;
            }
        }
        const newSchedule = { ...schedule };
        slots.forEach(slot => { newSchedule[slot] = course; });
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
                <h1>智慧化課程規劃與模擬排課系統</h1>
                <div className={`save-status ${saveStatus}`}>
                    {getSaveStatusMessage()}
                </div>
            </div>
            
            <div className="filters">
                <input type="text" name="courseName" placeholder="課程名稱" onChange={handleFilterChange} />
                <input type="text" name="teacher" placeholder="教師姓名" onChange={handleFilterChange} />
                <select name="department" onChange={handleFilterChange} value={filters.department}>
                    <option value="">所有系所</option>
                    {uniqueDepartments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
                <select name="division" onChange={handleFilterChange} value={filters.division}>
                    <option value="">所有班別</option>
                    <option value="學士班">學士班</option>
                    <option value="碩士班">碩士班</option>
                    <option value="博士班">博士班</option>
                    <option value="通識">通識</option>
                </select>
                <h3>總學分數: {totalCredits}</h3>
            </div>

            <div className="planner-content">
                <div className="course-list-container">
                    <h3>課程列表 ({filteredCourses.length})</h3>
                    {isLoading ? <p>載入課程中...</p> : (
                        <ul className="course-list">
                            {filteredCourses.slice(0, 200).map((course, index) => (
                                <li key={`${course.course_id}-${course.time}-${index}`}>
                                    <div className='course-info'>
                                        <strong>{course.course_cname}</strong> ({course.course_credit}學分)
                                        <div className="hotness-indicator">
                                            🔥 {hotnessData[course.course_id] || 0} 人已加入
                                        </div>
                                        <small>{course.teacher} | {course.department} {course.division} | 時間: {course.time || '未定'} | 地點: {course.location || '未定'}</small>
                                    </div>
                                    <button onClick={() => addToSchedule(course)} disabled={!course.time}>+</button>
                                </li>
                            ))}
                            {filteredCourses.length > 200 && <li>...僅顯示前200筆結果...</li>}
                        </ul>
                    )}
                </div>
                <div className="schedule-container">
                    <CourseTable schedule={schedule} onRemove={removeFromSchedule} />
                </div>
            </div>
        </div>
    );
};

export default CoursePlanner;