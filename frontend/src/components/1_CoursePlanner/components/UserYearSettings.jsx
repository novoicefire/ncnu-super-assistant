/**
 * UserYearSettings.jsx - 入學/畢業年設定元件
 * 首次使用時顯示設定對話框，也可在頁底區域修改
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faCog, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import './UserYearSettings.css';

const UserYearSettings = ({
    enrollmentYear,
    graduationYear,
    yearOptions,
    onSave,
    isModal = false,
    onClose
}) => {
    const { t } = useTranslation();
    const [tempEnrollment, setTempEnrollment] = useState(enrollmentYear || '');
    const [tempGraduation, setTempGraduation] = useState(graduationYear || '');
    const [error, setError] = useState('');

    useEffect(() => {
        if (enrollmentYear) setTempEnrollment(enrollmentYear);
        if (graduationYear) setTempGraduation(graduationYear);
    }, [enrollmentYear, graduationYear]);

    const handleSave = () => {
        if (!tempEnrollment || !tempGraduation) {
            setError(t('coursePlanner.yearRequired', '請選擇入學年與預計畢業年'));
            return;
        }

        if (parseInt(tempGraduation) < parseInt(tempEnrollment)) {
            setError(t('coursePlanner.yearInvalid', '畢業年不能早於入學年'));
            return;
        }

        setError('');
        onSave(tempEnrollment, tempGraduation);
        if (onClose) onClose();
    };

    const content = (
        <div className={`year-settings-content ${isModal ? 'modal-content' : ''}`}>
            {isModal && (
                <div className="year-settings-header">
                    <FontAwesomeIcon icon={faGraduationCap} className="header-icon" />
                    <h3>{t('coursePlanner.setupTitle', '設定您的學年範圍')}</h3>
                    <p className="subtitle">
                        {t('coursePlanner.setupSubtitle', '這將決定您可以存取的課表學期範圍')}
                    </p>
                </div>
            )}

            <div className="year-inputs">
                <div className="year-input-group">
                    <label>{t('coursePlanner.enrollmentYear', '入學年')}</label>
                    <select
                        value={tempEnrollment}
                        onChange={(e) => setTempEnrollment(e.target.value)}
                    >
                        <option value="">{t('coursePlanner.selectYear', '請選擇')}</option>
                        {yearOptions.map(year => (
                            <option key={year} value={year}>{year} 學年</option>
                        ))}
                    </select>
                </div>

                <span className="year-separator">～</span>

                <div className="year-input-group">
                    <label>{t('coursePlanner.graduationYear', '預計畢業年')}</label>
                    <select
                        value={tempGraduation}
                        onChange={(e) => setTempGraduation(e.target.value)}
                    >
                        <option value="">{t('coursePlanner.selectYear', '請選擇')}</option>
                        {yearOptions.map(year => (
                            <option key={year} value={year}>{year} 學年</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <div className="year-error">{error}</div>}

            <div className="year-actions">
                {isModal && onClose && (
                    <button className="btn-cancel" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                        {t('common.cancel', '取消')}
                    </button>
                )}
                <button className="btn-save" onClick={handleSave}>
                    <FontAwesomeIcon icon={faSave} />
                    {t('common.save', '儲存')}
                </button>
            </div>
        </div>
    );

    if (isModal) {
        return (
            <div className="year-settings-modal-overlay">
                <div className="year-settings-modal">
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div className="year-settings-inline">
            <div className="year-settings-label">
                <FontAwesomeIcon icon={faCog} />
                <span>{t('coursePlanner.yearSettings', '學年設定')}</span>
            </div>
            {content}
        </div>
    );
};

export default UserYearSettings;
