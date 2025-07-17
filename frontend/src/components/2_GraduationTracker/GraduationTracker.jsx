// frontend/src/components/2_GraduationTracker/GraduationTracker.jsx (完整動態版)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GraduationTracker.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const GraduationTracker = () => {
    // 狀態管理
    const [departments, setDepartments] = useState([]);
    const [requiredCourses, setRequiredCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // 使用者選擇的條件
    const [selection, setSelection] = useState({
        year: '113',
        deptId: '12',
        classType: 'B'
    });

    // 從 localStorage 讀取/寫入已完成課程
    // Key 會根據 selection 動態變化
    const [completedCourses, setCompletedCourses] = useState(() => {
        const key = `${selection.year}-${selection.deptId}-${selection.classType}`;
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    // 載入系所列表 (只在初次渲染時執行一次)
    useEffect(() => {
        axios.get(`${API_URL}/api/departments`)
            .then(res => setDepartments(res.data))
            .catch(err => console.error("Error fetching depts:", err));
    }, []);
    
    // 當使用者選擇變更時，觸發 API 請求
    useEffect(() => {
        const fetchRequiredCourses = async () => {
            if (!selection.year || !selection.deptId || !selection.classType) return;
            
            setIsLoading(true);
            setError('');
            try {
                const response = await axios.get(`${API_URL}/api/required_courses`, {
                    params: {
                        year: selection.year,
                        deptId: selection.deptId,
                        class: selection.classType
                    }
                });
                
                if (response.data.error) {
                    setError(response.data.error);
                    setRequiredCourses([]);
                } else {
                    setRequiredCourses(response.data.filter(c => c.course_id.trim() !== "必修課程"));
                }
            } catch (err) {
                setError('無法獲取必修課程資料，請確認選擇的條件是否正確，或學校 API 是否可用。');
                setRequiredCourses([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequiredCourses();

        // 同時，更新已完成課程的狀態，從 localStorage 讀取新 key 的資料
        const key = `${selection.year}-${selection.deptId}-${selection.classType}`;
        const saved = localStorage.getItem(key);
        setCompletedCourses(saved ? JSON.parse(saved) : {});

    }, [selection]);

    // 當完成課程列表變更時，儲存到 localStorage
    useEffect(() => {
        const key = `${selection.year}-${selection.deptId}-${selection.classType}`;
        localStorage.setItem(key, JSON.stringify(completedCourses));
    }, [completedCourses, selection]);

    const handleSelectionChange = (e) => {
        const { name, value } = e.target;
        setSelection(prev => ({...prev, [name]: value}));
    };

    const toggleCourseStatus = (courseId) => {
        setCompletedCourses(prev => {
            const newStatus = { ...prev };
            if (newStatus[courseId]) delete newStatus[courseId];
            else newStatus[courseId] = true;
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
                <input type="number" name="year" value={selection.year} onChange={handleSelectionChange} placeholder="學年度" />
                <select name="deptId" value={selection.deptId} onChange={handleSelectionChange}>
                    {departments.map(d => (
                        <option key={d.開課單位代碼} value={d.開課單位代碼}>
                            {d.單位中文名稱} ({d.開課單位代碼})
                        </option>
                    ))}
                </select>
                <select name="classType" value={selection.classType} onChange={handleSelectionChange}>
                    <option value="B">學士班</option>
                    <option value="G">碩士班</option>
                    <option value="P">博士班</option>
                </select>
            </div>
            
            {isLoading && <p>載入中...</p>}
            {error && <p className="error-message">{error}</p>}
            
            {!isLoading && !error && requiredCourses.length > 0 && (
                <>
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
                </>
            )}
             {!isLoading && !error && requiredCourses.length === 0 && (
                <p>找不到此條件下的必修課程資料。</p>
            )}
        </div>
    );
};

export default GraduationTracker;