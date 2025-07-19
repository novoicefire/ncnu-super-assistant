import React, { useState, useEffect, useRef } from 'react';
import { robustRequest } from '../../apiHelper';
import './UniversityCalendar.css';

const UniversityCalendar = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [todayMarker, setTodayMarker] = useState(null);

    // --- 新增點：使用 useRef 來獲取 DOM 元素的參照 ---
    // eventRefs 將會是一個物件，用來存放每個事件 DOM 節點的參照
    // 鍵為事件的起始日期，值為該節點
    const eventRefs = useRef({});

    useEffect(() => {
        const fetchCalendar = async () => {
            try {
                setLoading(true);
                const data = await robustRequest('get', '/api/calendar');
                if (Array.isArray(data)) {
                    setEvents(data);
                    // --- 新增點：找到第一個未來或當天的事件 ---
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // 將時間設為午夜，只比較日期

                    // 尋找第一個開始日期 >= 今天 的事件
                    const firstUpcomingEvent = data.find(event => new Date(event.start) >= today);
                    if (firstUpcomingEvent) {
                        setTodayMarker(firstUpcomingEvent.start);
                    }

                } else {
                    setError('無法識別的行事曆資料格式');
                }
            } catch (err) {
                setError(`讀取行事曆失敗: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchCalendar();
    }, []);

    // --- 新增點：滾動到今日事件的函式 ---
    const scrollToToday = () => {
        if (todayMarker && eventRefs.current[todayMarker]) {
            eventRefs.current[todayMarker].scrollIntoView({
                behavior: 'smooth',
                block: 'center', // 將目標置於視窗中央，體驗更好
            });
        }
    };
    
    // --- 新增點：格式化日期的輔助函式 ---
    const formatDate = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        // 如果是全天事件，endDate 會是隔天 00:00，需減一天
        if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
           endDate.setDate(endDate.getDate() - 1);
        }

        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedStart = startDate.toLocaleDateString('zh-TW', options);
        const formattedEnd = endDate.toLocaleDateString('zh-TW', options);

        if (formattedStart === formattedEnd) {
            return formattedStart;
        }
        return `${formattedStart} - ${formattedEnd}`;
    };


    if (loading) return <div><p>正在載入暨大行事曆...</p></div>;
    if (error) return <div><p style={{ color: 'red' }}>{error}</p></div>;

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h2>暨大行事曆</h2>
                {/* --- 新增點：定位回當日的按鈕 --- */}
                <button onClick={scrollToToday} className="go-to-today-btn">
                    定位回當日
                </button>
            </div>
            
            {/* --- 修改點：從日曆格線改為事件列表 --- */}
            <div className="events-list-container">
                {events.length > 0 ? (
                    events.map(event => (
                        <div
                            key={event.start + event.summary}
                            // --- 新增點：為每個項目加上 ref 和特殊的 class ---
                            ref={el => (eventRefs.current[event.start] = el)}
                            className={`event-item ${todayMarker === event.start ? 'today-marker' : ''}`}
                        >
                            <p className="event-summary">{event.summary}</p>
                            <p className="event-date">{formatDate(event.start, event.end)}</p>
                        </div>
                    ))
                ) : (
                    <p>目前沒有任何行事曆事件。</p>
                )}
            </div>
        </div>
    );
};

export default UniversityCalendar;