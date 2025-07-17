// frontend/src/components/4_UniversityCalendar/UniversityCalendar.jsx (完整動態年份版)

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './UniversityCalendar.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const UniversityCalendar = () => {
    // 'allEvents' 存放從 API 獲取的所有事件
    const [allEvents, setAllEvents] = useState([]);
    // 'selectedYear' 存放用戶當前選擇的年份
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isLoading, setIsLoading] = useState(true);

    // 獲取所有事件，僅在組件初次加載時執行一次
    useEffect(() => {
        axios.get(`${API_URL}/api/calendar`)
            .then(res => {
                setAllEvents(res.data || []);
            })
            .catch(err => console.error("Error fetching calendar events:", err))
            .finally(() => setIsLoading(false));
    }, []);

    // 從所有事件中提取不重複的年份列表，並進行排序
    const availableYears = useMemo(() => {
        if (allEvents.length === 0) return [];
        
        // 使用 Set 來確保年份的唯一性
        const years = new Set(
            allEvents.map(event => new Date(event.start).getFullYear())
        );
        
        // 將 Set 轉換為陣列，並由新到舊排序
        return Array.from(years).sort((a, b) => b - a);
    }, [allEvents]);

    // 根據選擇的年份，過濾要顯示的事件
    const filteredEvents = useMemo(() => {
        if (!selectedYear) return [];
        return allEvents.filter(event => new Date(event.start).getFullYear() === selectedYear);
    }, [selectedYear, allEvents]);

    // 處理日期格式化的函數
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date)) return dateString;
            
            // 如果時間是午夜，通常代表是全天事件，只顯示日期
            if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0) {
                 const options = { month: 'long', day: 'numeric' };
                 return date.toLocaleDateString('zh-TW', options);
            }
            // 對於有特定時間的事件，顯示完整時間
            const options = { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return date.toLocaleString('zh-TW', options);
        } catch (e) {
            return dateString;
        }
    }

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h1>國立暨南國際大學 行事曆</h1>
                {/* 年份選擇下拉選單 */}
                <div className="year-selector">
                    <label htmlFor="year-select">選擇學年度：</label>
                    <select
                        id="year-select"
                        value={selectedYear}
                        onChange={e => setSelectedYear(parseInt(e.target.value))}
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            {isLoading ? (
                <p>載入行事曆中...</p>
            ) : (
                <div className="event-list">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map((event, index) => (
                            <div className="event-item" key={index}>
                                <div className="event-date">
                                    {formatDate(event.start)}
                                </div>
                                <div className="event-summary">
                                    {event.summary}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>該年度沒有任何事件。</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default UniversityCalendar;