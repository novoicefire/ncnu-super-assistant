// frontend/src/components/1_CoursePlanner/CoursePlanner.jsx (整合 react-hot-toast 的最终版)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast'; // [核心修改] 1. 导入 toast 函数
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
    // [核心修改] 2. 移除了 isSaving 和 saveStatus 状态，因为 toast 会自己处理
    const [filters, setFilters] = useState({ courseName: '', teacher: '', department: '', division: '' });
    const [filteredCourses, setFilteredCourses] = useState([]);

    // --- useEffects (所有 useEffect 逻辑都不变) ---
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
                    } catch (staticError) { console.error("Failed to fetch even static course data:", staticError); }
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

    // [核心修改] 3. 重写 saveSchedule 函数，使用 toast 来提供反馈
    const saveSchedule = useCallback(async (newSchedule) => {
        setSchedule(newSchedule);
        if (isLoggedIn && user?.google_id) {
            const toastId = toast.loading('儲存中...'); // 显示“载入中”的 toast
            try {
                const response = await robustRequest('post', '/api/schedule', { 
                    params: { user_id: user.google_id },
                    data: newSchedule 
                });
                if (response && response.success) {
                    toast.success('课表已同步至云端！', { id: toastId }); // 成功后，更新同一个 toast
                } else {
                    throw new Error(response.error || "Backend response did not indicate success.");
                }
            } catch (error) {
                toast.error('储存失败，请检查网路或稍后再试。', { id: toastId }); // 失败后，更新同一个 toast
                console.error("Failed to save schedule to cloud:", error);
            }
        }
    }, [isLoggedIn, user]);

    // ... (parseTimeSlots, addToSchedule, removeFromSchedule 的逻辑完全不变) ...
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
        if (!isLoggedIn) {
            toast.error("请先登入才能儲存課表！");
            return;
        }
        const slots = parseTimeSlots(course.time);
        if (slots.length === 0) { alert('此课程无时间资讯，无法加入课表。'); return; }
        for (let slot of slots) {
            if (schedule[slot]) {
                alert(`课程冲堂！\n时段 ${slot[0]} 的 ${slot.substring(1)} 节已被「${schedule[slot].course_cname}」占用。`);
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

    return (
        <div className="course-planner">
            <div className="planner-header">
                <h1>智慧化課程規劃與模擬排課系統</h1>
                {/* [核心修改] 4. 移除了旧的 save-status div */}
            </div>
            
            <div className="filters">
                <input type="text" name="courseName" placeholder="课程名称" onChange={handleFilterChange} />
                <input type="text" name="teacher" placeholder="教师姓名" onChange={handleFilterChange} />
                <select name="department" onChange={handleFilterChange} value={filters.department}>
                    <option value="">所有系所</option>
                    {uniqueDepartments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
                <select name="division" onChange={handleFilterChange} value={filters.division}>
                    <option value="">所有班别</option>
                    <option value="學士班">學士班</option>
                    <option value="碩士班">碩士班</option>
                    <option value="博士班">博士班</option>
                    <option value="通識">通識</option>
                </select>
                <h3>總學分數: {totalCredits}</h3>
            </div>

            <div className="planner-content">
                <div className="course-list-container">
                    <h3>课程列表 ({filteredCourses.length})</h3>
                    {isLoading ? <p>载入课程中...</p> : (
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
                            {filteredCourses.length > 200 && <li>...仅显示前200笔结果...</li>}
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