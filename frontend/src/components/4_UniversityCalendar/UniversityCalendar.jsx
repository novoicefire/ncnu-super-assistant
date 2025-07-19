import React, { useState, useEffect, useRef } from 'react';
import { robustRequest } from '../../apiHelper';
import './UniversityCalendar.css';

const UniversityCalendar = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [todayMarker, setTodayMarker] = useState(null);

    // 新增：管理日期區間選擇的 state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const eventRefs = useRef({});

    useEffect(() => {
        const fetchCalendar = async () => {
            try {
                setLoading(true);
                const data = await robustRequest('get', '/api/calendar');
                if (Array.isArray(data)) {
                    setEvents(data);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
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

    const scrollToToday = () => {
        if (todayMarker && eventRefs.current[todayMarker]) {
            eventRefs.current[todayMarker].scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    };

    // 新增：處理日期區間定位的函式
    const scrollToDateRange = () => {
        if (!startDate || !endDate) {
            alert('請選擇起始與結束日期。');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start > end) {
            alert('起始日期不能晚於結束日期。');
            return;
        }

        // 尋找在區間內的第一個事件
        const targetEvent = events.find(event => {
            const eventStart = new Date(event.start);
            return eventStart >= start && eventStart <= end;
        });

        if (targetEvent) {
            eventRefs.current[targetEvent.start].scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        } else {
            alert('您選擇的日期區間內沒有找到任何行事曆事件。');
        }
    };
    
    // 格式化日期的輔助函式
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
                <div className="calendar-controls">
                    {/* 日期區間選擇器 */}
                    <div className="date-range-selector">
                        <input 
                            type="date" 
                            className="date-input"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span>-</span>
                        <input 
                            type="date"
                            className="date-input"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        <button onClick={scrollToDateRange} className="calendar-btn">
                            定位至區間
                        </button>
                    </div>
                    
                    <button onClick={scrollToToday} className="calendar-btn today-btn">
                        定位回當日
                    </button>
                </div>
            </div>
            
            <div className="events-list-container">
                {events.length > 0 ? (
                    events.map(event => (
                        <div
                            key={event.start + event.summary}
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