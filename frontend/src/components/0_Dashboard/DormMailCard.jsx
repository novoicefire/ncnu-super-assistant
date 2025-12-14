/**
 * DormMailCard.jsx - 宿舍包裹查詢卡片元件
 * 提供學系與姓名兩種查詢方式，即時查詢宿舍未領取包裹
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBox,
    faSearch,
    faChevronDown,
    faChevronUp,
    faSpinner,
    faTruck,
    faCalendarAlt,
    faUser,
    faHashtag,
    faExclamationCircle,
    faClock,
    faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import './DormMailCard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const DormMailCard = () => {
    const { t } = useTranslation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [queryMode, setQueryMode] = useState('department'); // 'department' 或 'name'
    const [department, setDepartment] = useState('');
    const [name, setName] = useState('');
    const [departments, setDepartments] = useState([]);
    const [mailList, setMailList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState(null);

    // 載入系所清單
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/departments`);
                if (response.ok) {
                    const data = await response.json();
                    // API 回傳格式: {course_deptId: {item: [...]}} 或直接是陣列
                    let deptList = [];
                    if (data?.course_deptId?.item) {
                        deptList = data.course_deptId.item;
                    } else if (Array.isArray(data)) {
                        deptList = data;
                    }
                    setDepartments(deptList);
                }
            } catch (err) {
                console.error('Failed to fetch departments:', err);
            }
        };
        fetchDepartments();
    }, []);

    // 查詢包裹
    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const params = new URLSearchParams();
            if (queryMode === 'department' && department) {
                params.append('department', department);
            } else if (queryMode === 'name' && name) {
                params.append('name', name);
            }

            const response = await fetch(`${API_BASE_URL}/api/dorm-mail?${params}`);
            const result = await response.json();

            if (result.success) {
                setMailList(result.data);
            } else {
                setError(result.error || t('dormMail.queryFailed'));
                setMailList([]);
            }
        } catch (err) {
            console.error('Failed to fetch dorm mail:', err);
            setError(t('dormMail.networkError'));
            setMailList([]);
        } finally {
            setLoading(false);
        }
    };

    // 切換查詢模式時重置輸入
    const handleModeChange = (mode) => {
        setQueryMode(mode);
        setDepartment('');
        setName('');
        setHasSearched(false);
        setMailList([]);
        setError(null);
    };

    /**
     * 計算剩餘可領取天數
     * 學校規定：逾期未領(5日內)一律退件
     * @param {string} daysStr - 從 API 返回的天數字串（如 "3.17" 表示已過 3.17 天）
     * @returns {object} { days: 剩餘天數, urgency: 緊急程度, label: 顯示文字 }
     */
    const getRemainingDays = (daysStr) => {
        const daysSinceArrival = parseFloat(daysStr) || 0;
        const remainingDays = Math.max(0, 5 - Math.floor(daysSinceArrival));

        let urgency = 'safe'; // 綠色：≥3 天
        if (remainingDays <= 0) {
            urgency = 'expired'; // 紅色：已逾期
        } else if (remainingDays <= 1) {
            urgency = 'danger'; // 紅色：≤1 天
        } else if (remainingDays <= 2) {
            urgency = 'warning'; // 黃色：2 天
        }

        let label = '';
        if (remainingDays <= 0) {
            label = t('dormMail.expired');
        } else if (remainingDays === 1) {
            label = t('dormMail.lastDay');
        } else {
            label = t('dormMail.daysRemaining', { days: remainingDays });
        }

        return { days: remainingDays, urgency, label };
    };

    return (
        <div className="dorm-mail-card">
            {/* 卡片標題 */}
            <div className="dorm-mail-header">
                <div className="header-content">
                    <div className="header-title-row">
                        <FontAwesomeIcon icon={faBox} className="header-icon" />
                        <h3>{t('dormMail.title')}</h3>
                    </div>
                    <span className="header-subtitle">{t('dormMail.subtitle')}</span>
                </div>
                <button
                    className="collapse-toggle modern"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? t('common.expand') : t('common.collapse')}
                >
                    <FontAwesomeIcon icon={isCollapsed ? faChevronDown : faChevronUp} />
                </button>
            </div>

            {/* 可收合的內容區域 */}
            <div className={`dorm-mail-content ${isCollapsed ? 'collapsed' : ''}`}>
                {/* 查詢模式切換 */}
                <div className="query-mode-tabs">
                    <button
                        className={`mode-tab ${queryMode === 'department' ? 'active' : ''}`}
                        onClick={() => handleModeChange('department')}
                    >
                        {t('dormMail.queryByDept')}
                    </button>
                    <button
                        className={`mode-tab ${queryMode === 'name' ? 'active' : ''}`}
                        onClick={() => handleModeChange('name')}
                    >
                        {t('dormMail.queryByName')}
                    </button>
                </div>

                {/* 查詢輸入區 */}
                <div className="query-input-section">
                    {queryMode === 'department' ? (
                        <div className="input-group">
                            <label htmlFor="department-select">{t('dormMail.selectDepartment')}</label>
                            <select
                                id="department-select"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className="department-select"
                            >
                                <option value="">{t('dormMail.selectDepartmentPlaceholder')}</option>
                                {departments.map((dept, index) => (
                                    <option
                                        key={`${dept['單位中文簡稱'] || dept['單位中文名稱'] || index}-${index}`}
                                        value={dept['單位中文簡稱'] || dept['單位中文名稱']}
                                    >
                                        {dept['單位中文簡稱'] || dept['單位中文名稱']}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="input-group">
                            <label htmlFor="name-input">{t('dormMail.enterName')}</label>
                            <input
                                id="name-input"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('dormMail.namePlaceholder')}
                                className="name-input"
                            />
                            <small className="input-hint">
                                <FontAwesomeIcon icon={faExclamationCircle} />
                                {t('dormMail.nameFormatHint')}
                            </small>
                        </div>
                    )}

                    <button
                        className="search-btn"
                        onClick={handleSearch}
                        disabled={loading || (queryMode === 'department' && !department) || (queryMode === 'name' && !name)}
                    >
                        {loading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin />
                                {t('dormMail.searching')}
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faSearch} />
                                {t('dormMail.search')}
                            </>
                        )}
                    </button>
                </div>

                {/* 錯誤訊息 */}
                {error && (
                    <div className="error-message">
                        <FontAwesomeIcon icon={faExclamationCircle} />
                        {error}
                    </div>
                )}

                {/* 查詢結果 */}
                {hasSearched && !loading && !error && (
                    <div className="mail-results">
                        {mailList.length === 0 ? (
                            <div className="no-results">
                                <FontAwesomeIcon icon={faBox} />
                                <p>{t('dormMail.noResults')}</p>
                            </div>
                        ) : (
                            <>
                                <div className="results-header">
                                    <span>{t('dormMail.foundCount', { count: mailList.length })}</span>
                                </div>
                                <div className="mail-list">
                                    {mailList.map((mail, index) => {
                                        const remaining = getRemainingDays(mail.days_since_arrival);
                                        return (
                                            <div key={index} className={`mail-item ${remaining.urgency}`}>
                                                <div className="mail-item-header">
                                                    <span className="mail-id">
                                                        <FontAwesomeIcon icon={faHashtag} />
                                                        {mail.id}
                                                    </span>
                                                    <div className="mail-badges">
                                                        <span className={`remaining-badge ${remaining.urgency}`}>
                                                            <FontAwesomeIcon
                                                                icon={remaining.urgency === 'safe' ? faClock : faExclamationTriangle}
                                                            />
                                                            {remaining.label}
                                                        </span>
                                                        <span className={`mail-type ${mail.type === '包裹' ? 'package' : 'registered'}`}>
                                                            {mail.type}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mail-item-details">
                                                    <div className="detail-row">
                                                        <FontAwesomeIcon icon={faUser} className="detail-icon" />
                                                        <span className="detail-label">{t('dormMail.recipient')}:</span>
                                                        <span className="detail-value">{mail.recipient}</span>
                                                    </div>
                                                    <div className="detail-row">
                                                        <FontAwesomeIcon icon={faCalendarAlt} className="detail-icon" />
                                                        <span className="detail-label">{t('dormMail.arrivalTime')}:</span>
                                                        <span className="detail-value">{mail.arrival_time}</span>
                                                    </div>
                                                    <div className="detail-row">
                                                        <FontAwesomeIcon icon={faTruck} className="detail-icon" />
                                                        <span className="detail-label">{t('dormMail.carrier')}:</span>
                                                        <span className="detail-value">{mail.carrier}</span>
                                                    </div>
                                                    {mail.tracking_number && (
                                                        <div className="detail-row">
                                                            <span className="detail-label">{t('dormMail.trackingNumber')}:</span>
                                                            <span className="detail-value tracking-number">{mail.tracking_number}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* 資料來源 */}
                <div className="dorm-mail-footer">
                    <a
                        href="https://ccweb.ncnu.edu.tw/dormmail/Default.asp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="source-link"
                    >
                        {t('dormMail.dataSource')}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default DormMailCard;
