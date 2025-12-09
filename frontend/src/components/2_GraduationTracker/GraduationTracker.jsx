// frontend/src/components/2_GraduationTracker/GraduationTracker.jsx (爬蟲適配版 + i18n)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './GraduationTracker.css';

const GraduationTracker = () => {
    const { t } = useTranslation();
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

    // 🎯 動態生成檔案路徑的函數
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
                const filePath = generateFilePath(selection.deptId, selection.classType);

                const response = await axios.get(filePath);
                const courses = response.data?.course_require_ncnu?.item || [];

                if (courses.length > 0) {
                    setRequiredCourses(courses.filter(c => c.course_id.trim() !== "必修課程"));
                    setError('');
                } else {
                    const selectedDept = departments.find(d => d.開課單位代碼 === selection.deptId);
                    const deptName = selectedDept ? selectedDept.單位中文名稱 : t('graduation.selectedDept');
                    const classTypeName = getClassTypeName(selection.classType);

                    setRequiredCourses([]);
                    setError(`📋 ${deptName}${classTypeName}${t('graduation.noDataMsg')}`);
                }

            } catch (err) {
                console.error('Failed to load required courses:', err);

                const selectedDept = departments.find(d => d.開課單位代碼 === selection.deptId);
                const deptName = selectedDept ? selectedDept.單位中文名稱 : t('graduation.selectedDept');
                const classTypeName = getClassTypeName(selection.classType);

                setRequiredCourses([]);
                setError(`📋 ${deptName}${classTypeName}${t('graduation.loadFailedMsg')}`);
            } finally {
                setIsLoading(false);
            }
        };

        if (departments.length > 0) {
            fetchRequiredCourses();
        }

        const key = `${selection.deptId}-${selection.classType}`;
        const saved = localStorage.getItem(key);
        setCompletedCourses(saved ? JSON.parse(saved) : {});
    }, [selection, departments, t]);

    useEffect(() => {
        const key = `${selection.deptId}-${selection.classType}`;
        localStorage.setItem(key, JSON.stringify(completedCourses));
    }, [completedCourses, selection]);

    // 🎯 班別名稱對應函數
    const getClassTypeName = (classType) => {
        const classTypes = {
            'B': t('graduation.bachelor'),
            'G': t('graduation.master'),
            'P': t('graduation.phd')
        };
        return classTypes[classType] || t('graduation.bachelor');
    };

    const handleSelectionChange = (e) => {
        const { name, value } = e.target;
        setSelection(prev => ({ ...prev, [name]: value }));
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
            <h2>{t('graduation.title')}</h2>
            <div className="tracker-controls">
                <div className="control-group">
                    <label>{t('graduation.selectDepartment')}：</label>
                    <select name="deptId" value={selection.deptId} onChange={handleSelectionChange}>
                        {departments.map(d => (
                            <option key={d.開課單位代碼} value={d.開課單位代碼}>
                                {d.單位中文名稱} ({d.開課單位代碼})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="control-group">
                    <label>{t('graduation.selectClass')}：</label>
                    <select name="classType" value={selection.classType} onChange={handleSelectionChange}>
                        <option value="B">{t('graduation.bachelor')}</option>
                        <option value="G">{t('graduation.master')}</option>
                        <option value="P">{t('graduation.phd')}</option>
                    </select>
                </div>
            </div>

            {isLoading && <div className="loading-message">{t('common.loading')}</div>}

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
                        <h3>{t('graduation.progressOverview')}</h3>
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{ width: `${Math.min(progress, 100)}%` }}>
                                {progress > 10 ? `${Math.round(progress)}%` : ''}
                            </div>
                        </div>
                        <p>{t('graduation.completed')}: {completedCredits} / {t('graduation.totalRequired')}: {totalCredits}</p>
                    </div>
                    <div className="courses-display">
                        <div className="course-column">
                            <h3>{t('graduation.incompleteRequired')} ({uncompleted.length})</h3>
                            <ul>
                                {uncompleted.map(c => (
                                    <li key={c.course_id} onClick={() => toggleCourseStatus(c.course_id)}>
                                        <span className="checkbox">☐</span>
                                        <div className="course-info">{c.course_cname}</div>
                                        <span className="course-credit">{c.course_credit}{t('graduation.credits')}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="course-column">
                            <h3>{t('graduation.completedRequired')} ({completed.length})</h3>
                            <ul>
                                {completed.map(c => (
                                    <li key={c.course_id} className="completed" onClick={() => toggleCourseStatus(c.course_id)}>
                                        <span className="checkbox checked">✓</span>
                                        <div className="course-info">{c.course_cname}</div>
                                        <span className="course-credit">{c.course_credit}{t('graduation.credits')}</span>
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
