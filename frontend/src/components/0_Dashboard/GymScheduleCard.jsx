/**
 * GymScheduleCard.jsx - 體育館開放時間卡片元件
 * 顯示橫向日曆選擇器與各設施（游泳池、健身房、SPA）的當日開放時間
 * 包含實時進度條、剩餘時間計算與動態狀態動畫
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSwimmer,
    faDumbbell,
    faSpa,
    faChevronLeft,
    faChevronRight,
    faChevronDown,
    faChevronUp,
    faSnowflake,
    faClock,
    faCalendarAlt,
    faBan,
} from '@fortawesome/free-solid-svg-icons';
import {
    FACILITY_TYPES,
    FACILITIES,
    STATUS,
    AVAILABLE_DATA_RANGE,
    getCurrentStatus,
    formatRemainingTime,
    getDateRange,
    formatDate,
    isSameDay,
    isWinterClosure,
    isDateInAvailableRange,
    clampDateToAvailableRange,
} from './gymScheduleData';
import './GymScheduleCard.css';

// 設施圖標映射
const FACILITY_ICONS = {
    pool: faSwimmer,
    gym: faDumbbell,
    spa: faSpa,
};

const GymScheduleCard = () => {
    const { t, i18n } = useTranslation();
    // 初始日期限制在可用範圍內
    const [selectedDate, setSelectedDate] = useState(() => clampDateToAvailableRange(new Date()));
    const [facilityStatuses, setFacilityStatuses] = useState({});
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isCollapsed, setIsCollapsed] = useState(false);
    const dateScrollRef = useRef(null);
    const selectedDateRef = useRef(null);

    // 滾動到選取的日期位置（加入延遲確保元素已渲染）
    useEffect(() => {
        const timer = setTimeout(() => {
            if (selectedDateRef.current) {
                selectedDateRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center',
                });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [selectedDate]);


    // 更新設施狀態
    const updateStatuses = useCallback(() => {
        const now = new Date();
        setCurrentTime(now);

        // 如果選擇的是今天，使用當前時間計算狀態
        const isToday = isSameDay(selectedDate, now);
        const checkTime = isToday ? now : selectedDate;

        const statuses = {};
        Object.values(FACILITY_TYPES).forEach((type) => {
            statuses[type] = getCurrentStatus(type, checkTime);
        });
        setFacilityStatuses(statuses);
    }, [selectedDate]);

    // 每分鐘更新一次狀態
    useEffect(() => {
        updateStatuses();
        const interval = setInterval(updateStatuses, 60000);
        return () => clearInterval(interval);
    }, [updateStatuses]);

    // 計算導航按鈕是否可用
    const canNavigatePrev = useMemo(() => {
        const prevDate = new Date(selectedDate);
        prevDate.setDate(selectedDate.getDate() - 7);
        return prevDate >= AVAILABLE_DATA_RANGE.start;
    }, [selectedDate]);

    const canNavigateNext = useMemo(() => {
        const nextDate = new Date(selectedDate);
        nextDate.setDate(selectedDate.getDate() + 7);
        return nextDate <= AVAILABLE_DATA_RANGE.end;
    }, [selectedDate]);

    // 滑動動畫狀態
    const [slideDirection, setSlideDirection] = useState(null);

    // 日期導航（限制在可用範圍內）+ 滑動動畫
    const navigateDate = (direction) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + direction);
        // 限制在可用範圍內
        const clampedDate = clampDateToAvailableRange(newDate);

        // 觸發滑動動畫
        setSlideDirection(direction > 0 ? 'slide-left' : 'slide-right');
        setTimeout(() => {
            setSelectedDate(clampedDate);
            setSlideDirection(null);
        }, 300); // 配合 0.6s 動畫，在中點切換資料
    };

    // 點擊日期項目時的處理（帶動畫）
    const handleDateClick = (clickedDate) => {
        // 如果點擊的是已選擇的日期，不做任何事
        if (isSameDay(clickedDate, selectedDate)) return;

        // 計算點擊日期與當前選擇日期的差異
        const diff = clickedDate.getTime() - selectedDate.getTime();
        const direction = diff > 0 ? 'slide-left' : 'slide-right';

        // 觸發滑動動畫
        setSlideDirection(direction);
        setTimeout(() => {
            setSelectedDate(clickedDate);
            setSlideDirection(null);
        }, 300);
    };

    // 取得日期範圍（過濾出可用範圍內的日期）
    const dateRange = useMemo(() => {
        return getDateRange(selectedDate, 3).filter(date => isDateInAvailableRange(date));
    }, [selectedDate]);

    const locale = i18n.language === 'en' ? 'en' : 'zh-TW';

    // 判斷是否顯示冬季休館警告
    const showWinterWarning = isWinterClosure(selectedDate);

    // 渲染狀態標籤
    const renderStatusBadge = (status) => {
        const statusConfig = {
            [STATUS.OPEN]: { labelKey: 'gymSchedule.statusOpen', className: 'status-open' },
            [STATUS.UPCOMING]: { labelKey: 'gymSchedule.statusUpcoming', className: 'status-upcoming' },
            [STATUS.CLOSED]: { labelKey: 'gymSchedule.statusClosed', className: 'status-closed' },
            [STATUS.HOLIDAY]: { labelKey: 'gymSchedule.statusHoliday', className: 'status-holiday' },
            [STATUS.WINTER_CLOSED]: { labelKey: 'gymSchedule.statusWinterClosed', className: 'status-winter' },
        };

        const config = statusConfig[status] || statusConfig[STATUS.CLOSED];
        return (
            <span className={`facility-status-badge ${config.className}`}>
                {t(config.labelKey)}
            </span>
        );
    };

    // 渲染設施卡片
    const renderFacilityCard = (facilityType) => {
        const facility = FACILITIES[facilityType];
        const statusInfo = facilityStatuses[facilityType] || {};
        const { status, schedule, progress, remainingTime, timeUntilOpen, followsPool, message } = statusInfo;

        const remainingFormatted = formatRemainingTime(remainingTime);
        const upcomingFormatted = formatRemainingTime(timeUntilOpen);

        // 取得時間顯示
        let timeDisplay = '';
        if (schedule) {
            timeDisplay = `${schedule.open} - ${schedule.close}`;
        } else if (message) {
            timeDisplay = t(message);
        }

        // 動畫類別
        const animationClass = {
            [STATUS.OPEN]: 'animate-open',
            [STATUS.UPCOMING]: 'animate-upcoming',
            [STATUS.CLOSED]: 'animate-closed',
            [STATUS.HOLIDAY]: 'animate-holiday',
            [STATUS.WINTER_CLOSED]: 'animate-winter',
        }[status] || '';

        // 判斷選擇的日期是否為今天
        const isSelectedToday = isSameDay(selectedDate, new Date());

        // 非今日：簡化顯示（只有圖標、名稱、時間，無進度條無狀態）
        if (!isSelectedToday) {
            return (
                <div
                    key={facilityType}
                    className="facility-card-compact not-today"
                    style={{ '--facility-color': facility.color }}
                >
                    <div className="compact-card-content">
                        <div className="compact-icon">
                            <FontAwesomeIcon icon={FACILITY_ICONS[facilityType]} />
                        </div>
                        <span className="compact-name">{t(facility.nameKey)}</span>
                        <span className="compact-time">
                            {timeDisplay || t(message)}
                        </span>
                    </div>
                </div>
            );
        }

        // 今日：完整顯示（含進度條、狀態標籤）
        return (
            <div
                key={facilityType}
                className={`facility-card-compact ${animationClass}`}
                style={{
                    '--facility-color': facility.color,
                    '--progress': status === STATUS.OPEN ? `${progress}%` : '0%',
                }}
            >
                {/* 進度條背景填充 */}
                {status === STATUS.OPEN && (
                    <div className="card-progress-fill" style={{ width: `${progress}%` }} />
                )}

                {/* 冬季休館雪花動畫 */}
                {status === STATUS.WINTER_CLOSED && (
                    <div className="snowfall-container">
                        {[...Array(5)].map((_, i) => (
                            <FontAwesomeIcon
                                key={i}
                                icon={faSnowflake}
                                className="snowflake-particle"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 3}s`,
                                    animationDuration: `${2 + Math.random() * 2}s`,
                                }}
                            />
                        ))}
                    </div>
                )}

                <div className="compact-card-content">
                    <div className="compact-icon">
                        <FontAwesomeIcon icon={FACILITY_ICONS[facilityType]} />
                    </div>
                    <span className="compact-name">{t(facility.nameKey)}</span>
                    <span className="compact-time">
                        {timeDisplay || t(message)}
                    </span>
                    {status === STATUS.OPEN && remainingFormatted && (
                        <span className="compact-remaining">{remainingFormatted.text}</span>
                    )}
                    {status === STATUS.UPCOMING && upcomingFormatted && (
                        <span className="compact-countdown">{upcomingFormatted.text}</span>
                    )}
                    {/* 只在開放中、即將開放、休館日、冬季休館時顯示狀態標籤；已關閉不顯示 */}
                    {status !== STATUS.CLOSED && renderStatusBadge(status)}
                </div>
            </div>
        );
    };

    return (
        <div className={`gym-schedule-card ${showWinterWarning ? 'winter-theme' : ''}`}>
            {/* 卡片標題 */}
            <div className="gym-schedule-header">
                <div className="header-title">
                    <FontAwesomeIcon icon={faCalendarAlt} className="header-icon" />
                    <h3>{t('gymSchedule.title')}</h3>
                </div>
                <div className="header-actions">
                    {/* 回到今日按鈕 */}
                    {!isSameDay(selectedDate, new Date()) && (
                        <button
                            className="go-today-btn"
                            onClick={() => handleDateClick(clampDateToAvailableRange(new Date()))}
                            title={t('gymSchedule.today')}
                        >
                            <span className="month">{new Date().getMonth() + 1}/</span>
                            <span className="day">{new Date().getDate()}</span>
                        </button>
                    )}
                    {/* 收合按鈕 */}
                    <button
                        className="collapse-toggle modern"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? t('common.expand') : t('common.collapse')}
                    >
                        <FontAwesomeIcon icon={isCollapsed ? faChevronDown : faChevronUp} />
                    </button>
                </div>
            </div>

            {/* 可收合的內容區域 */}
            <div className={`gym-schedule-content ${isCollapsed ? 'collapsed' : ''}`}>
                {/* 橫向日曆選擇器 */}
                <div className="date-selector">
                    {/* 月份顯示 */}
                    <div className="month-display">
                        <span className="current-month">
                            {locale === 'zh-TW'
                                ? `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月`
                                : selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                            }
                        </span>
                    </div>

                    {/* 日期滾動區 */}
                    <div className="date-nav-row">
                        <button
                            className={`date-nav-btn ${!canNavigatePrev ? 'disabled' : ''}`}
                            onClick={() => navigateDate(-7)}
                            disabled={!canNavigatePrev}
                            aria-label={t('gymSchedule.prevWeek')}
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>

                        <div className={`date-scroll-container ${slideDirection || ''}`} ref={dateScrollRef}>
                            {dateRange.map((date) => {
                                const dateInfo = formatDate(date, locale);
                                const isSelected = isSameDay(date, selectedDate);
                                const isToday = dateInfo.isToday;
                                const showMonth = date.getDate() === 1 || dateRange.indexOf(date) === 0;

                                return (
                                    <button
                                        key={date.toISOString()}
                                        ref={isSelected ? selectedDateRef : null}
                                        className={`date-item ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                                        onClick={() => handleDateClick(date)}
                                    >
                                        <span className="date-weekday">{dateInfo.weekday}</span>
                                        <span className="date-day">
                                            {showMonth ? `${dateInfo.month}/${dateInfo.day}` : dateInfo.day}
                                        </span>
                                        {isToday && <span className="today-indicator">{t('gymSchedule.today')}</span>}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            className={`date-nav-btn ${!canNavigateNext ? 'disabled' : ''}`}
                            onClick={() => navigateDate(7)}
                            disabled={!canNavigateNext}
                            aria-label={t('gymSchedule.nextWeek')}
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                </div>

                {/* 冬季休館提示 */}
                {showWinterWarning && (
                    <div className="winter-closure-banner">
                        <FontAwesomeIcon icon={faSnowflake} className="winter-icon" />
                        <span>{t('gymSchedule.winterClosureNotice')}</span>
                    </div>
                )}

                {/* 設施列表 */}
                <div className="facilities-list">
                    {renderFacilityCard(FACILITY_TYPES.POOL)}
                    {renderFacilityCard(FACILITY_TYPES.GYM)}
                    {renderFacilityCard(FACILITY_TYPES.SPA)}
                </div>

                {/* 資料來源提示 */}
                <div className="schedule-footer">
                    <a
                        href="https://pe.ncnu.edu.tw/p/406-1040-592,r39.php?Lang=zh-tw"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="source-link"
                    >
                        {t('gymSchedule.dataSource')}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default GymScheduleCard;
