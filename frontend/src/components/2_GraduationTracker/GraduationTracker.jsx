// frontend/src/components/2_GraduationTracker/GraduationTracker.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GraduationTracker.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001';

const GraduationTracker = () => {
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState('12'); // 預設國企系
    const [selectedClass, setSelectedClass] = useState('B'); // 預設學士班
    const [requiredCourses, setRequiredCourses] = useState([]);
    const [completedCourses, setCompletedCourses] = useState(() => {
        const saved = localStorage.getItem('completedCourses');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        axios.get(`${API_URL}/api/departments`)
            .then(res => setDepartments(res.data))
            .catch(err => console.error("Error fetching depts:", err));
    }, []);

    useEffect(() => {
        axios.get(`${API_URL}/api/required_courses?deptId=${selectedDept}&class=${selectedClass}`)
            .then(res => {
                if (res.data.error) {
                    alert(res.data.error);
                    setRequiredCourses([]);
                } else {
                    setRequiredCourses(res.data.filter(c => c.course_id.trim() !== "必修課程"));
                }
            })
            .catch(err => {
                alert("獲取必修課程失敗，目前後端僅支援國企系學士班範例。");
                setRequiredCourses([]);
            });
    }, [selectedDept, selectedClass]);
    
    useEffect(() => {
        localStorage.setItem('completedCourses', JSON.stringify(completedCourses));
    }, [completedCourses]);

    const toggleCourseStatus = (courseId) => {
        setCompletedCourses(prev => {
            const newStatus = { ...prev };
            if (newStatus[courseId]) {
                delete newStatus[courseId];
            } else {
                newStatus[courseId] = true;
            }
            return newStatus;
        });
    };
    
    const uncompleted = requiredCourses.filter(c => !completedCourses[c.course_id]);
    const completed = requiredCourses.filter(c => completedCourses[c.course_id]);

    const totalCredits = requiredCourses.reduce((sum, c) => sum + parseFloat(c.course_credit || 0), 0);
    const completedCredits = completed.reduce((sum, c) => sum + parseFloat(c.course_credit || 0), 0);
    const progress = totalCredits > 0 ? (completedCredits / totalCredits) * 100 : 0;

    return (
        <div className="tracker-container">
            <h1>畢業學分進度追蹤器</h1>
            <div className="tracker-controls">
                <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                    {departments.map(d => (
                        <option key={d.開課單位代碼} value={d.開課單位代碼}>
                            {d.單位中文名稱}
                        </option>
                    ))}
                </select>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                    <option value="B">學士班</option>
                    <option value="G">碩士班</option>
                    <option value="P">博士班</option>
                </select>
                 <p>(註：後端目前僅有國企系學士班範例資料)</p>
            </div>
            
            <div className="progress-section">
                <h3>進度總覽</h3>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}>
                        {progress > 10 ? `${Math.round(progress)}%` : ''}
                    </div>
                </div>
                <p>已完成學分: {completedCredits} / 總必修學分: {totalCredits}</p>
            </div>

            <div className="courses-display">
                <div className="course-column">
                    <h3>未完成課程 ({uncompleted.length})</h3>
                    <ul>
                        {uncompleted.map(c => (
                            <li key={c.course_id} onClick={() => toggleCourseStatus(c.course_id)}>
                                <span className="checkbox"></span>
                                {c.course_cname} ({c.course_credit}學分)
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="course-column">
                    <h3>已完成課程 ({completed.length})</h3>
                    <ul>
                        {completed.map(c => (
                            <li key={c.course_id} className="completed" onClick={() => toggleCourseStatus(c.course_id)}>
                                <span className="checkbox checked">✓</span>
                                {c.course_cname} ({c.course_credit}學分)
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default GraduationTracker;