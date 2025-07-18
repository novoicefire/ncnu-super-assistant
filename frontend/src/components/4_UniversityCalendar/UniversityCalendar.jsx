// frontend/src/components/4_UniversityCalendar/UniversityCalendar.jsx (日曆版)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import ical from 'ical.js'; 

// 導入 react-calendar 的基礎樣式，這是讓日曆正常顯示的關鍵
import 'react-calendar/dist/Calendar.css';
// 導入我們自己的客製化樣式
import './UniversityCalendar.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const UniversityCalendar = () => {
    const [allEvents, setAllEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    // 使用 'value' 來追蹤日曆上被點擊或正在顯示的月份
    const [value, setValue] = useState(new Date());

    // 從 API 獲取所有事件資料，只在初次載入時執行
    useEffect(() => {
        const fetchCalendar = async () => {
            setIsLoading(true);
            try {
                // [核心修正] 讀取本地的 ICS 檔案
                const response = await axios.get('/data/calendar.ics');
                const jcalData = ical.parse(response.data);
                const vcalendar = new ical.Component(jcalData);
                const vevents = vcalendar.getAllSubcomponents('vevent');

                const events = vevents.map(vevent => {
                    const event = new ical.Event(vevent);
                    return {
                        summary: event.summary,
                        start: event.startDate.toJSDate().toISOString(),
                        end: event.endDate.toJSDate().toISOString(),
                    };
                });
                setAllEvents(events);
            } catch (error) {
                console.error("Error fetching or parsing calendar:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCalendar();
    }, []);

    /**
     * 檢查兩個日期是否為同一天（忽略時間）
     * @param {Date} d1 - 日期一
     * @param {Date} d2 - 日期二
     * @returns {boolean}
     */
    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    /**
     * 這是 react-calendar 的核心功能，用來自訂每個日期格子的內容
     * @param {object} param0 - 包含 date 和 view 的物件
     * @returns JSX 或 null
     */
    const tileContent = ({ date, view }) => {
        // 我們只在「月」視圖下顯示事件
        if (view === 'month') {
            // 找出所有在 'date' 這一天發生的事件
            const eventsOnThisDay = allEvents.filter(event => 
                isSameDay(new Date(event.start), date)
            );

            // 如果這天有事件，就渲染它們
            if (eventsOnThisDay.length > 0) {
                return (
                    <div className="event-list-in-tile">
                        {eventsOnThisDay.map((event, index) => (
                            <div key={index} className="event-item-in-tile">
                                {event.summary}
                            </div>
                        ))}
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <div className="calendar-container">
            <h1>國立暨南國際大學 行事曆</h1>
            {isLoading ? (
                <p>載入行事曆中...</p>
            ) : (
                <div className="calendar-wrapper">
                    <Calendar
                        onChange={setValue}
                        value={value}
                        tileContent={tileContent} // 使用我們的自訂函數來渲染事件
                        locale="zh-TW" // 將日曆設定為中文（星期一、星期二...）
                    />
                </div>
            )}
        </div>
    );
};

export default UniversityCalendar;