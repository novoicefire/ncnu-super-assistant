/**
 * useSemester.js - 學期管理 Hook
 * 管理學期選擇、入學/畢業年設定、可用學期計算
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../AuthContext.jsx';
import { robustRequest } from '../../../apiHelper.js';

/**
 * 計算當前學期（與後端邏輯一致）
 */
function getCurrentSemester() {
    const now = new Date();
    const year = now.getMonth() > 5 ? now.getFullYear() - 1911 : now.getFullYear() - 1912;
    const semester = (now.getMonth() >= 7 || now.getMonth() < 1) ? '1' : '2';
    return `${year}-${semester}`;
}

/**
 * 根據入學年和畢業年計算可用學期列表
 */
function calculateSemesterRange(enrollmentYear, graduationYear) {
    if (!enrollmentYear || !graduationYear) return [];

    const startYear = parseInt(enrollmentYear);
    const endYear = parseInt(graduationYear);
    const semesters = [];

    for (let year = endYear; year >= startYear; year--) {
        semesters.push({ id: `${year}-2`, label: `${year} 學年第 2 學期` });
        semesters.push({ id: `${year}-1`, label: `${year} 學年第 1 學期` });
    }

    return semesters;
}

export function useSemester() {
    const { user, isLoggedIn } = useAuth();
    const [selectedSemester, setSelectedSemester] = useState(getCurrentSemester());
    const [enrollmentYear, setEnrollmentYear] = useState(null);
    const [graduationYear, setGraduationYear] = useState(null);
    const [availableSemesters, setAvailableSemesters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [needsSetup, setNeedsSetup] = useState(false);

    // 載入使用者的入學/畢業年設定
    useEffect(() => {
        const loadUserYears = async () => {
            if (!isLoggedIn || !user?.google_id) {
                // 未登入：從 localStorage 讀取
                const savedEnrollment = localStorage.getItem('enrollment_year');
                const savedGraduation = localStorage.getItem('graduation_year');

                if (savedEnrollment && savedGraduation) {
                    setEnrollmentYear(savedEnrollment);
                    setGraduationYear(savedGraduation);
                    setNeedsSetup(false);
                } else {
                    setNeedsSetup(true);
                }
                setIsLoading(false);
                return;
            }

            try {
                const response = await robustRequest('get', '/api/user/years', {
                    params: { user_id: user.google_id }
                });

                if (response.enrollment_year && response.graduation_year) {
                    setEnrollmentYear(response.enrollment_year);
                    setGraduationYear(response.graduation_year);
                    setNeedsSetup(false);
                } else {
                    setNeedsSetup(true);
                }
            } catch (error) {
                console.error('Failed to load user years:', error);
                setNeedsSetup(true);
            } finally {
                setIsLoading(false);
            }
        };

        loadUserYears();
    }, [isLoggedIn, user]);

    // 計算可用學期列表
    useEffect(() => {
        if (enrollmentYear && graduationYear) {
            const semesters = calculateSemesterRange(enrollmentYear, graduationYear);
            setAvailableSemesters(semesters);

            // 如果當前選擇的學期不在範圍內，切換到最新學期
            const current = getCurrentSemester();
            const isCurrentInRange = semesters.some(s => s.id === current);
            if (isCurrentInRange) {
                setSelectedSemester(current);
            } else if (semesters.length > 0) {
                setSelectedSemester(semesters[0].id);
            }
        }
    }, [enrollmentYear, graduationYear]);

    // 儲存入學/畢業年設定
    const saveYearSettings = useCallback(async (newEnrollmentYear, newGraduationYear) => {
        setEnrollmentYear(newEnrollmentYear);
        setGraduationYear(newGraduationYear);

        // 儲存到 localStorage
        localStorage.setItem('enrollment_year', newEnrollmentYear);
        localStorage.setItem('graduation_year', newGraduationYear);

        // 登入用戶同步到雲端
        if (isLoggedIn && user?.google_id) {
            try {
                await robustRequest('post', '/api/user/years', {
                    params: { user_id: user.google_id },
                    data: {
                        enrollment_year: newEnrollmentYear,
                        graduation_year: newGraduationYear
                    }
                });
            } catch (error) {
                console.error('Failed to save year settings:', error);
            }
        }

        setNeedsSetup(false);
    }, [isLoggedIn, user]);

    // 產生可選的年份列表（當今 ±4 年）
    const yearOptions = useMemo(() => {
        const now = new Date();
        const currentYear = now.getMonth() > 5 ? now.getFullYear() - 1911 : now.getFullYear() - 1912;
        const years = [];
        for (let y = currentYear + 4; y >= currentYear - 4; y--) {
            years.push(y.toString());
        }
        return years;
    }, []);

    return {
        selectedSemester,
        setSelectedSemester,
        enrollmentYear,
        graduationYear,
        availableSemesters,
        yearOptions,
        isLoading,
        needsSetup,
        saveYearSettings,
        currentSemester: getCurrentSemester()
    };
}

export default useSemester;
