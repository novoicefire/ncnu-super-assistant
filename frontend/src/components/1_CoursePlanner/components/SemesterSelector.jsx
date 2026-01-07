/**
 * SemesterSelector.jsx - 學期選擇器元件
 * 顯示在篩選器區域，讓使用者選擇要編輯的學期課表
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import './SemesterSelector.css';

const SemesterSelector = ({
    selectedSemester,
    onSemesterChange,
    availableSemesters,
    currentSemester
}) => {
    const { t } = useTranslation();

    if (!availableSemesters || availableSemesters.length === 0) {
        return null;
    }

    return (
        <div className="semester-selector">
            <label className="semester-label">
                <FontAwesomeIcon icon={faCalendarAlt} />
                <span>{t('coursePlanner.semester', '學期')}</span>
            </label>
            <select
                value={selectedSemester}
                onChange={(e) => onSemesterChange(e.target.value)}
                className="semester-select"
            >
                {availableSemesters.map(sem => (
                    <option key={sem.id} value={sem.id}>
                        {sem.label}
                        {sem.id === currentSemester ? ` (${t('coursePlanner.current', '當前')})` : ''}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default SemesterSelector;
