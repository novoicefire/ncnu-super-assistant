// frontend/src/components/1_CoursePlanner/CoursePlanner.jsx (時間解析修正版)

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import CourseTable from './CourseTable.jsx';
import './CoursePlanner.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const CoursePlanner = () => {
    // ... (所有 state 宣告保持不變) ...
    const [allCourses, setAllCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [schedule, setSchedule] = useState({});
    const [totalCredits, setTotalCredits] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [searchParams, setSearchParams] = useState({ year: '113', semester: '2' });
    const [filters, setFilters] = useState({ courseName: '', teacher: '', department: '', division: '' });

    useEffect(() => {
        setIsLoading(true);
        axios.get(`${API_URL}/api/courses`, { params: { year: searchParams.year, semester: searchParams.semester, unitId: 'all' } })
            .then(response => setAllCourses(response.data || []))
            .catch(error => {
                console.error("Error fetching courses:", error);
                setAllCourses([]);
            })
            .finally(() => setIsLoading(false));
    }, [searchParams]);

    const uniqueDepartments = useMemo(() => {
        if (allCourses.length === 0) return [];
        return [...new Set(allCourses.map(c => c.department))].sort();
    }, [allCourses]);

    useEffect(() => {
        let result = allCourses;
        if (filters.courseName) result = result.filter(c => c.course_cname.toLowerCase().includes(filters.courseName.toLowerCase()));
        if (filters.teacher) result = result.filter(c => c.teacher.toLowerCase().includes(filters.teacher.toLowerCase()));
        if (filters.department) result = result.filter(c => c.department === filters.department);
        if (filters.division) {
             if (filters.division === '通識') result = result.filter(c => c.department === '通識');
             else result = result.filter(c => c.division === filters.division);
        }
        setFilteredCourses(result);
    }, [filters, allCourses]);

    const handleParamChange = (e) => setSearchParams(prev => ({...prev, [e.target.name]: e.target.value}));
    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

    /**
     * [核心修正] 全新的、強健的時間解析函數
     * @param {string} timeString - 原始時間字串，例如 "4i5bcd" 或 "3h5fg"
     * @returns {string[]} - 解析後的時間格陣列，例如 ['4i', '5b', '5c', '5d']
     */
    const parseTimeSlots = (timeString) => {
        if (!timeString || typeof timeString !== 'string') return [];
        
        // 使用正規表示式來切分時間字串
        // \d[a-zA-Z]+ 會匹配 "一個數字" 後面跟著 "一個或多個字母" 的模式
        // 例如 "4i5bcd" 會被切成 ["4i", "5bcd"]
        const timeGroups = timeString.match(/\d[a-zA-Z]+/g) || [];
        
        const slots = [];
        for (const group of timeGroups) {
            const day = group[0]; // 第一個字元是星期
            const periods = group.substring(1); // 後面的都是節次
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
        setSchedule(newSchedule);
        
        setTotalCredits(prev => prev + parseFloat(course.course_credit || 0));
    };

    const removeFromSchedule = (courseId, time) => {
        const slots = parseTimeSlots(time);
        
        const newSchedule = { ...schedule };
        let courseToRemove = null;
        slots.forEach(slot => {
            if(newSchedule[slot] && newSchedule[slot].course_id === courseId && newSchedule[slot].time === time) {
                if (!courseToRemove) courseToRemove = newSchedule[slot];
                delete newSchedule[slot];
            }
        });
        setSchedule(newSchedule);

        if (courseToRemove) {
            setTotalCredits(prev => prev - parseFloat(courseToRemove.course_credit || 0));
        }
    };

    return (
        <div className="course-planner">
            <h1>智慧化課程規劃與模擬排課系統</h1>
            <div className="filters">
                <input type="number" name="year" value={searchParams.year} onChange={handleParamChange} />
                <select name="semester" value={searchParams.semester} onChange={handleParamChange}>
                    <option value="1">第一學期</option>
                    <option value="2">第二學期</option>
                </select>
                <input type="text" name="courseName" placeholder="課程名稱" onChange={handleFilterChange} />
                <input type="text" name="teacher" placeholder="教師姓名" onChange={handleFilterChange} />
                <select name="department" onChange={handleFilterChange} value={filters.department}>
                    <option value="">所有系所</option>
                    {uniqueDepartments.map(dep => dep && <option key={dep} value={dep}>{dep}</option>)}
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
                                        <strong>{course.course_cname}</strong> ({course.course_credit}學分)<br/>
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