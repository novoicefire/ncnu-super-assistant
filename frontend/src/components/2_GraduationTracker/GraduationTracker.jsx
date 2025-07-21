// frontend/src/components/2_GraduationTracker/GraduationTracker.jsx (僅移除學年度版)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GraduationTracker.css';

const GraduationTracker = () => {
    const [departments, setDepartments] = useState([]);
    const [requiredCourses, setRequiredCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // 🔧 修復：移除 year 欄位，只保留 deptId 和 classType
    const [selection, setSelection] = useState({
        deptId: '12',
        classType: 'B'
    });

    // 🔧 修復：localStorage key 不再包含年度
    const [completedCourses, setCompletedCourses] = useState(() => {
        const key = `${selection.deptId}-${selection.classType}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        // [保持原有邏輯] 直接讀取靜態 JSON 檔案來獲取系所列表
        axios.get('/data/開課單位代碼API.json')
            .then(res => {
                setDepartments(res.data?.course_deptId?.item || []);
            })
            .catch(err => console.error("Error fetching departments from static file:", err));
    }, []);
    
    useEffect(() => {
        const fetchRequiredCourses = async () => {
            setIsLoading(true);
            setError('');
            try {
                // [保持原有邏輯] 直接讀取靜態的範例必修課 JSON 檔案
                // 注意：這意味著無論使用者選擇哪個系，目前都只會顯示國企系的資料
                // 這是因為我們只有這一個範例檔案
                const response = await axios.get('/data/本學年某系所必修課資訊API(以國企系大學班為範例).json');
                
                // 模擬 API 行為，檢查選擇是否符合範例檔
                if (selection.deptId === '12' && selection.classType === 'B') {
                    const courses = response.data?.course_require_ncnu?.item || [];
                    setRequiredCourses(courses.filter(c => c.course_id.trim() !== "必修課程"));
                } else {
                    setError('注意：目前範例資料庫僅支援顯示「國企系學士班」的必修課程。');
                    setRequiredCourses([]);
                }
            } catch (err) {
                setError('無法獲取必修課程資料，可能是範例檔案遺失。');
                setRequiredCourses([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRequiredCourses();

        // 🔧 修復：localStorage key 不再包含年度
        const key = `${selection.deptId}-${selection.classType}`;
        const saved = localStorage.getItem(key);
        setCompletedCourses(saved ? JSON.parse(saved) : {});
    }, [selection]);

    useEffect(() => {
        // 🔧 修復：localStorage key 不再包含年度
        const key = `${selection.deptId}-${selection.classType}`;
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
            <h2>畢業學分進度追蹤器</h2>
            <div className="tracker-controls">
                {/* 🔧 修復：移除學年度輸入格，只保留系所和班別選單 */}
                <div className="control-group">
                    <label>系所：</label>
                    <select name="deptId" value={selection.deptId} onChange={handleSelectionChange}>
                        {departments.map(d => (
                            <option key={d.開課單位代碼} value={d.開課單位代碼}>
                                {d.單位中文名稱} ({d.開課單位代碼})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="control-group">
                    <label>班別：</label>
                    <select name="classType" value={selection.classType} onChange={handleSelectionChange}>
                        <option value="B">學士班</option>
                        <option value="G">碩士班</option>
                        <option value="P">博士班</option>
                    </select>
                </div>
            </div>
            
            {isLoading && <div className="loading-message">載入中...</div>}
            {error && <div className="error-message">{error}</div>}
            
            {!isLoading && requiredCourses.length > 0 && (
                <>
                    <div className="progress-section">
                        <h3>學分進度總覽</h3>
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{ width: `${Math.min(progress, 100)}%` }}>
                                {progress > 10 ? `${Math.round(progress)}%` : ''}
                            </div>
                        </div>
                        <p>已完成學分: {completedCredits} / 總必修學分: {totalCredits}</p>
                    </div>
                    <div className="courses-display">
                        <div className="course-column">
                            <h3>未完成必修課程 ({uncompleted.length})</h3>
                            <ul>
                                {uncompleted.map(c => (
                                    <li key={c.course_id} onClick={() => toggleCourseStatus(c.course_id)}>
                                        <span className="checkbox">☐</span>
                                        <div className="course-info">{c.course_cname}</div>
                                        <span className="course-credit">{c.course_credit}學分</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="course-column">
                            <h3>已完成必修課程 ({completed.length})</h3>
                            <ul>
                                {completed.map(c => (
                                    <li key={c.course_id} className="completed" onClick={() => toggleCourseStatus(c.course_id)}>
                                        <span className="checkbox checked">✓</span>
                                        <div className="course-info">{c.course_cname}</div>
                                        <span className="course-credit">{c.course_credit}學分</span>
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
