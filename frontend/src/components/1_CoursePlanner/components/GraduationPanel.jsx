/**
 * GraduationPanel.jsx - 畢業追蹤面板（整合於 CoursePlanner）
 * 顯示必修課程進度、已完成/未完成清單
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSquare, faChevronDown, faChevronUp, faSearch, faGraduationCap, faSync, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { useCourseData } from '../hooks/useCourseData.js';
import { useAuth } from '../../../AuthContext.jsx';

const GraduationPanel = ({ selectedSemester, onSearchCourseId }) => {
    const { t, i18n } = useTranslation();

    // 根據語言設定取得課程名稱
    const getCourseName = (course) => {
        if (!course) return '';
        if (i18n.language === 'en' && course.course_ename) {
            return course.course_ename;
        }
        return course.course_cname || '';
    };
    const [departments, setDepartments] = useState([]);
    const [deptId, setDeptId] = useState('12'); // 預設國企系
    const [classType, setClassType] = useState('B'); // 預設學士班
    const [isExpanded, setIsExpanded] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');
    const { isLoggedIn } = useAuth();

    // 載入系所列表
    useEffect(() => {
        axios.get('/data/開課單位代碼API.json')
            .then(res => {
                setDepartments(res.data?.course_deptId?.item || []);
            })
            .catch(err => console.error("Error fetching departments:", err));
    }, []);

    // 使用統一課程資料 Hook
    const {
        unifiedRequiredCourses,
        graduationProgress,
        isLoading,
        toggleCourseCompletion,
        syncFromSchedules,
        resetAndSync
    } = useCourseData(selectedSemester, deptId, classType);

    // 同步課表
    const handleSync = async () => {
        setIsSyncing(true);
        setSyncMessage('');
        const result = await syncFromSchedules();
        setIsSyncing(false);
        if (result?.synced_count > 0) {
            setSyncMessage(`✅ 已同步 ${result.synced_count} 門課程`);
        } else if (result?.success) {
            setSyncMessage('ℹ️ 沒有新課程需要同步');
        } else {
            setSyncMessage('❌ 同步失敗');
        }
        setTimeout(() => setSyncMessage(''), 3000);
    };

    // 重置並同步
    const handleReset = async () => {
        if (!window.confirm(t('graduation.confirmReset', '確定要清除所有已完成標記並重新同步？'))) {
            return;
        }
        setIsSyncing(true);
        setSyncMessage('');
        const result = await resetAndSync();
        setIsSyncing(false);
        if (result?.success) {
            setSyncMessage(`🔄 ${result.message}`);
        } else {
            setSyncMessage('❌ 重置失敗');
        }
        setTimeout(() => setSyncMessage(''), 3000);
    };

    // 分類課程
    const uncompleted = useMemo(() =>
        unifiedRequiredCourses.filter(c => !c.isCompleted),
        [unifiedRequiredCourses]
    );
    const completed = useMemo(() =>
        unifiedRequiredCourses.filter(c => c.isCompleted),
        [unifiedRequiredCourses]
    );

    // 班別名稱
    const getClassTypeName = (type) => {
        const names = { 'B': t('graduation.bachelor'), 'G': t('graduation.master'), 'P': t('graduation.phd') };
        return names[type] || t('graduation.bachelor');
    };

    return (
        <div className="graduation-panel">
            <div className="graduation-panel-header" onClick={() => setIsExpanded(!isExpanded)}>
                <h3>
                    <FontAwesomeIcon icon={faGraduationCap} className="panel-icon" />
                    {t('graduation.title')}
                </h3>
                <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
            </div>

            {isExpanded && (
                <div className="graduation-panel-content">
                    {/* 系所/班別選擇 */}
                    <div className="graduation-selectors">
                        <select value={deptId} onChange={(e) => setDeptId(e.target.value)}>
                            {departments.map(d => (
                                <option key={d.開課單位代碼} value={d.開課單位代碼}>
                                    {d.單位中文簡稱 || d.單位中文名稱}
                                </option>
                            ))}
                        </select>
                        <select value={classType} onChange={(e) => setClassType(e.target.value)}>
                            <option value="B">{t('graduation.bachelor')}</option>
                            <option value="G">{t('graduation.master')}</option>
                            <option value="P">{t('graduation.phd')}</option>
                        </select>
                        {isLoggedIn && (
                            <>
                                <button
                                    className="sync-btn"
                                    onClick={handleSync}
                                    disabled={isSyncing || isLoading}
                                    title={t('graduation.syncFromSchedules', '從課表同步')}
                                >
                                    <FontAwesomeIcon icon={faSync} spin={isSyncing} />
                                </button>
                                <button
                                    className="sync-btn reset-btn"
                                    onClick={handleReset}
                                    disabled={isSyncing || isLoading}
                                    title={t('graduation.resetAndSync', '重置並同步')}
                                >
                                    <FontAwesomeIcon icon={faRotateLeft} />
                                </button>
                            </>
                        )}
                    </div>
                    {syncMessage && <div className="sync-message">{syncMessage}</div>}

                    {/* 進度條 */}
                    {!isLoading && unifiedRequiredCourses.length > 0 && (
                        <div className="graduation-progress">
                            <div className="progress-bar-wrapper">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${Math.min(graduationProgress.percentage, 100)}%` }}
                                />
                            </div>
                            <div className="progress-text">
                                <span>{graduationProgress.completedCredits} / {graduationProgress.totalCredits} {t('graduation.credits')}</span>
                                <span>{Math.round(graduationProgress.percentage)}%</span>
                            </div>
                        </div>
                    )}

                    {isLoading && <div className="loading-text">{t('common.loading')}</div>}

                    {/* 未完成必修清單 */}
                    {!isLoading && uncompleted.length > 0 && (
                        <div className="required-courses-section">
                            <h4>{t('graduation.incompleteRequired')} ({uncompleted.length})</h4>
                            <ul className="required-courses-list">
                                {uncompleted.map(course => (
                                    <li key={course.course_id} className="required-course-item">
                                        <button
                                            className="course-checkbox"
                                            onClick={() => toggleCourseCompletion(course.course_id)}
                                        >
                                            <FontAwesomeIcon icon={faSquare} />
                                        </button>
                                        <div className="course-details">
                                            <span className="course-name">{getCourseName(course)}</span>
                                            <span className="course-credit">{course.course_credit}{t('graduation.credits')}</span>
                                        </div>
                                        {course.isOfferedThisSemester && course.offerings.length > 0 && (
                                            <button
                                                className="add-to-schedule-btn"
                                                onClick={() => onSearchCourseId && onSearchCourseId(course.course_id)}
                                                title={t('coursePlanner.searchThisCourse', '搜尋課程')}
                                            >
                                                <FontAwesomeIcon icon={faSearch} />
                                            </button>
                                        )}
                                        {course.isOfferedThisSemester && (
                                            <span className="offered-badge">{t('graduation.offeredThisSemester') || '本學期有開'}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 已完成必修清單（可收合） */}
                    {!isLoading && completed.length > 0 && (
                        <details className="completed-courses-section">
                            <summary>{t('graduation.completedRequired')} ({completed.length})</summary>
                            <ul className="required-courses-list completed">
                                {completed.map(course => (
                                    <li key={course.course_id} className="required-course-item completed">
                                        <button
                                            className="course-checkbox checked"
                                            onClick={() => toggleCourseCompletion(course.course_id)}
                                        >
                                            <FontAwesomeIcon icon={faCheck} />
                                        </button>
                                        <div className="course-details">
                                            <span className="course-name">{getCourseName(course)}</span>
                                            <span className="course-credit">{course.course_credit}{t('graduation.credits')}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </details>
                    )}

                    {!isLoading && unifiedRequiredCourses.length === 0 && (
                        <div className="no-data-message">
                            {t('graduation.noDataMsg') || '此系所班別尚無必修課程資料'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GraduationPanel;
