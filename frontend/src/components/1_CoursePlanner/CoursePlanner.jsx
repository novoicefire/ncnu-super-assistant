// frontend/src/components/1_CoursePlanner/CoursePlanner.jsx (完整動態版)

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import CourseTable from './CourseTable.jsx';
import './CoursePlanner.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const CoursePlanner = () => {
    // 課程與排課狀態
    const [allCourses, setAllCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [schedule, setSchedule] = useState({});
    const [totalCredits, setTotalCredits] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // 搜尋條件狀態
    const [searchParams, setSearchParams] = useState({
        year: '113',
        semester: '2'
    });
    const [filters, setFilters] = useState({
        courseName: '',
        teacher: '',
        department: '',
        division: ''
    });

    // 動態獲取課程
    useEffect(() => {
        setIsLoading(true);
        axios.get(`${API_URL}/api/courses`, {
            params: {
                year: searchParams.year,
                semester: searchParams.semester,
                unitId: 'all'
            }
        })
        .then(response => {
            setAllCourses(response.data || []); // 確保是陣列
        })
        .catch(error => {
            console.error("Error fetching courses:", error);
            setAllCourses([]);
        })
        .finally(() => setIsLoading(false));
    }, [searchParams]);
    
    // 從所有課程中取得不重複的系所列表
    const uniqueDepartments = useMemo(() => {
        if (allCourses.length === 0) return [];
        return [...new Set(allCourses.map(c => c.department))].sort();
    }, [allCourses]);

    // 依篩選條件過濾課程
    useEffect(() => {
        let result = allCourses;
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
             if (filters.division === '通識') {
                result = result.filter(c => c.department === '通識');
             } else {
                result = result.filter(c => c.division === filters.division);
             }
        }
        setFilteredCourses(result);
    }, [filters, allCourses]);

    const handleParamChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({...prev, [name]: value}));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const parseTimeSlots = (timeString) => {
        if (!timeString || typeof timeString !== 'string') return [];
        const slots = [];
        const dayMappings = { '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6':'6', '7':'7' };
        const day = dayMappings[timeString[0]];
        if (!day) return [];

        const periods = timeString.substring(1);
        for (let period of periods) {
            slots.push(`${day}${period}`);
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
        const courseToRemove = schedule[slots[0]];
        if (!courseToRemove) return;

        const newSchedule = { ...schedule };
        Object.keys(newSchedule).forEach(slot => {
            if (newSchedule[slot] && newSchedule[slot].course_id === courseId && newSchedule[slot].time === time) {
                delete newSchedule[slot];
            }
        });
        setSchedule(newSchedule);

        setTotalCredits(prev => prev - parseFloat(courseToRemove.course_credit || 0));
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