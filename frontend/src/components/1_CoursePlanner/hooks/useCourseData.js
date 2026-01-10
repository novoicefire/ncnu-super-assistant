/**
 * useCourseData.js - 統一課程資料載入與匹配 Hook
 * 結合開課資訊與必修課程，提供統一的課程資料介面
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../AuthContext.jsx';
import { robustRequest } from '../../../apiHelper.js';

/**
 * 統一課程資料 Hook
 * @param {string} selectedSemester - 當前選擇的學期，如 "114-2"
 * @param {string} deptId - 系所代碼，如 "12"
 * @param {string} classType - 班別：B/G/P
 */
export function useCourseData(selectedSemester, deptId, classType) {
    const { user, isLoggedIn } = useAuth();

    // 開課資訊
    const [semesterCourses, setSemesterCourses] = useState([]);
    const [isLoadingSemester, setIsLoadingSemester] = useState(false);

    // 必修課程
    const [requiredCourses, setRequiredCourses] = useState([]);
    const [isLoadingRequired, setIsLoadingRequired] = useState(false);

    // 已完成課程 ID 列表
    const [completedCourseIds, setCompletedCourseIds] = useState([]);
    const [isLoadingProgress, setIsLoadingProgress] = useState(false);

    // 載入本學期開課資訊
    useEffect(() => {
        if (!selectedSemester) return;

        const loadSemesterCourses = async () => {
            setIsLoadingSemester(true);
            const [year, sem] = selectedSemester.split('-');
            const semesterFile = `/data/開課資訊_${year}_${sem}.json`;
            const legacyFile = '/data/本學期開課資訊API.json';

            try {
                let response;
                try {
                    response = await axios.get(semesterFile);
                } catch {
                    response = await axios.get(legacyFile);
                }
                const courses = response.data?.course_ncnu?.item || [];
                setSemesterCourses(courses);
            } catch (error) {
                console.error('載入開課資訊失敗:', error);
                setSemesterCourses([]);
            } finally {
                setIsLoadingSemester(false);
            }
        };

        loadSemesterCourses();
    }, [selectedSemester]);

    // 載入必修課程
    useEffect(() => {
        if (!deptId || !classType) return;

        const loadRequiredCourses = async () => {
            setIsLoadingRequired(true);
            const filePath = `/data/course_require_114_${deptId}_${classType}.json`;

            try {
                const response = await axios.get(filePath);
                const courses = response.data?.course_require_ncnu?.item || [];
                // 過濾掉標題行
                const filtered = courses.filter(c => c.course_id.trim() !== '必修課程');
                setRequiredCourses(filtered);
            } catch (error) {
                console.error('載入必修課程失敗:', error);
                setRequiredCourses([]);
            } finally {
                setIsLoadingRequired(false);
            }
        };

        loadRequiredCourses();
    }, [deptId, classType]);

    // 載入畢業進度（已完成課程）
    useEffect(() => {
        if (!deptId || !classType) return;

        const loadProgress = async () => {
            setIsLoadingProgress(true);
            const localKey = `graduation-${deptId}-${classType}`;

            if (isLoggedIn && user?.google_id) {
                // 從雲端載入
                try {
                    const response = await robustRequest('get', '/api/graduation-progress', {
                        params: {
                            user_id: user.google_id,
                            dept_id: deptId,
                            class_type: classType
                        }
                    });
                    setCompletedCourseIds(response?.completed_courses || []);
                } catch (error) {
                    console.error('載入畢業進度失敗:', error);
                    // Fallback 到本地
                    const local = localStorage.getItem(localKey);
                    setCompletedCourseIds(local ? JSON.parse(local) : []);
                }
            } else {
                // 從本地載入
                const local = localStorage.getItem(localKey);
                setCompletedCourseIds(local ? JSON.parse(local) : []);
            }

            setIsLoadingProgress(false);
        };

        loadProgress();
    }, [deptId, classType, isLoggedIn, user]);

    // 儲存畢業進度
    const saveCompletedCourses = useCallback(async (newCompletedIds) => {
        setCompletedCourseIds(newCompletedIds);

        const localKey = `graduation-${deptId}-${classType}`;
        localStorage.setItem(localKey, JSON.stringify(newCompletedIds));

        if (isLoggedIn && user?.google_id) {
            try {
                await robustRequest('post', '/api/graduation-progress', {
                    params: { user_id: user.google_id },
                    data: {
                        dept_id: deptId,
                        class_type: classType,
                        completed_courses: newCompletedIds
                    }
                });
            } catch (error) {
                console.error('儲存畢業進度失敗:', error);
            }
        }
    }, [deptId, classType, isLoggedIn, user]);

    // 切換課程完成狀態
    const toggleCourseCompletion = useCallback((courseId) => {
        const newCompleted = completedCourseIds.includes(courseId)
            ? completedCourseIds.filter(id => id !== courseId)
            : [...completedCourseIds, courseId];
        saveCompletedCourses(newCompleted);
    }, [completedCourseIds, saveCompletedCourses]);

    // 🆕 從用戶課表自動同步已完成課程
    const syncFromSchedules = useCallback(async () => {
        if (!isLoggedIn || !user?.google_id || requiredCourses.length === 0) {
            return { success: false, message: '需要登入且有必修課程資料' };
        }

        try {
            const requiredCourseIds = requiredCourses.map(c => c.course_id);

            const response = await robustRequest('post', '/api/graduation-progress/sync', {
                data: {
                    user_id: user.google_id,
                    dept_id: deptId,
                    class_type: classType,
                    required_course_ids: requiredCourseIds
                }
            });

            if (response?.success && response?.synced_count > 0) {
                // 重新載入已完成課程
                const progressResponse = await robustRequest('get', '/api/graduation-progress', {
                    params: {
                        user_id: user.google_id,
                        dept_id: deptId,
                        class_type: classType
                    }
                });
                setCompletedCourseIds(progressResponse?.completed_courses || []);
            }

            return response;
        } catch (error) {
            console.error('同步課表失敗:', error);
            return { success: false, message: error.message };
        }
    }, [isLoggedIn, user, requiredCourses, deptId, classType]);

    // 🆕 重置並同步：清空已完成列表後重新同步
    const resetAndSync = useCallback(async () => {
        if (!isLoggedIn || !user?.google_id || requiredCourses.length === 0) {
            return { success: false, message: '需要登入且有必修課程資料' };
        }

        try {
            // 1. 先清空已完成課程
            await saveCompletedCourses([]);

            // 2. 重新同步
            const requiredCourseIds = requiredCourses.map(c => c.course_id);

            const response = await robustRequest('post', '/api/graduation-progress/sync', {
                data: {
                    user_id: user.google_id,
                    dept_id: deptId,
                    class_type: classType,
                    required_course_ids: requiredCourseIds
                }
            });

            // 3. 重新載入已完成課程
            const progressResponse = await robustRequest('get', '/api/graduation-progress', {
                params: {
                    user_id: user.google_id,
                    dept_id: deptId,
                    class_type: classType
                }
            });
            setCompletedCourseIds(progressResponse?.completed_courses || []);

            return {
                success: true,
                synced_count: response?.synced_count || 0,
                message: `已重置並同步 ${response?.synced_count || 0} 門課程`
            };
        } catch (error) {
            console.error('重置同步失敗:', error);
            return { success: false, message: error.message };
        }
    }, [isLoggedIn, user, requiredCourses, deptId, classType, saveCompletedCourses]);

    // 統一課程資料：將必修課程與開課資訊匹配
    const unifiedRequiredCourses = useMemo(() => {
        return requiredCourses.map(req => {
            // 以 course_id 為主鍵匹配開課資訊
            const matchingOfferings = semesterCourses.filter(
                sem => sem.course_id === req.course_id
            );

            // 🆕 從開課資訊取得英文名稱（必修資料沒有 course_ename）
            const course_ename = matchingOfferings.length > 0
                ? matchingOfferings[0].course_ename
                : null;

            return {
                ...req,
                course_ename,  // 🆕 附加英文名稱
                isRequired: true,
                isCompleted: completedCourseIds.includes(req.course_id),
                isOfferedThisSemester: matchingOfferings.length > 0,
                offerings: matchingOfferings.map(m => ({
                    time: m.time,
                    location: m.location,
                    teacher: m.teacher,
                    class: m.class
                }))
            };
        });
    }, [requiredCourses, semesterCourses, completedCourseIds]);

    // 計算畢業進度
    const graduationProgress = useMemo(() => {
        const totalCredits = requiredCourses.reduce(
            (sum, c) => sum + parseFloat(c.course_credit || 0), 0
        );
        const completedCredits = requiredCourses
            .filter(c => completedCourseIds.includes(c.course_id))
            .reduce((sum, c) => sum + parseFloat(c.course_credit || 0), 0);

        return {
            totalCourses: requiredCourses.length,
            completedCourses: completedCourseIds.filter(
                id => requiredCourses.some(c => c.course_id === id)
            ).length,
            totalCredits,
            completedCredits,
            percentage: totalCredits > 0 ? (completedCredits / totalCredits) * 100 : 0
        };
    }, [requiredCourses, completedCourseIds]);

    return {
        // 原始資料
        semesterCourses,
        requiredCourses,
        completedCourseIds,

        // 統一資料
        unifiedRequiredCourses,
        graduationProgress,

        // 載入狀態
        isLoading: isLoadingSemester || isLoadingRequired || isLoadingProgress,

        // 操作方法
        toggleCourseCompletion,
        saveCompletedCourses,
        syncFromSchedules,
        resetAndSync
    };
}

export default useCourseData;
