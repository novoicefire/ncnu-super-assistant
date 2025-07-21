// frontend/src/components/2_GraduationTracker/GraduationTracker.jsx (爬蟲適配版)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GraduationTracker.css';

const GraduationTracker = () => {
    const [departments, setDepartments] = useState([]);
    const [requiredCourses, setRequiredCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [selection, setSelection] = useState({
        deptId: '12',
        classType: 'B'
    });

    const [completedCourses, setCompletedCourses] = useState(() => {
        const key = `${selection.deptId}-${selection.classType}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : {};
    });

    // 🎯 新增：動態生成檔案路徑的函數
    const generateFilePath = (deptId, classType, year = '114') => {
        return `/data/course_require_${year}_${deptId}_${classType}.json`;
    };

    useEffect(() => {
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
                // 🎯 動態生成檔案路徑
                const filePath = generateFilePath(selection.deptId, selection.classType);
                
                const response = await axios.get(filePath);
                const courses = response.data?.course_require_ncnu?.item || [];
                
                if (courses.length > 0) {
                    // 🎯 有資料：正常顯示課程
                    setRequiredCourses(courses.filter(c => c.course_id.trim() !== "必修課程"));
                    setError(''); // 清除錯誤訊息
                } else {
                    // 🎯 空資料：顯示無課程提示
                    const selectedDept = departments.find(d => d.開課單位代碼 === selection.deptId);
                    const deptName = selectedDept ? selectedDept.單位中文名稱 : '所選系所';
                    const classTypeName = getClassTypeName(selection.classType);
                    
                    setRequiredCourses([]);
                    setError(`📋 ${deptName}${classTypeName}目前無必修課程資料或該班別未開設課程`);
                }
                
            } catch (err) {
                // 🎯 檔案不存在或載入失敗
                console.error('Failed to load required courses:', err);
                
                const selectedDept = departments.find(d => d.開課單位代碼 === selection.deptId);
                const deptName = selectedDept ? selectedDept.單位中文名稱 : '所選系所';
                const classTypeName = getClassTypeName(selection.classType);
                
                setRequiredCourses([]);
                setError(`
                    📋 ${deptName}${classTypeName}的必修課程資料暫時無法載入
                    
                    可能原因：
                    • 該系所班別尚未建立必修課程資料
                    • 網路連線問題
                    • 資料檔案正在更新中
                    
                    📩 如持續無法載入，請聯繫系統管理員
                `);
            } finally {
                setIsLoading(false);
            }
        };

        if (departments.length > 0) {
            fetchRequiredCourses();
        }
        
        // 更新 localStorage
        const key = `${selection.deptId}-${selection.classType}`;
        const saved = localStorage.getItem(key);
        setCompletedCourses(saved ? JSON.parse(saved) : {});
    }, [selection, departments]);

    useEffect(() => {
        const key = `${selection.deptId}-${selection.classType}`;
        localStorage.setItem(key, JSON.stringify(completedCourses));
    }, [completedCourses, selection]);

    // 🎯 班別名稱對應函數
    const getClassTypeName = (classType) => {
        const classTypes = {
            'B': '學士班',
            'G': '碩士班', 
            'P': '博士班'
        };
        return classTypes[classType] || '學士班';
    };

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
            
            {error && (
                <div className="error-message">
                    {error.split('\n').map((line, index) => (
                        <div key={index}>{line}</div>
                    ))}
                </div>
            )}
            
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
        </div>
    );
};

export default GraduationTracker;
