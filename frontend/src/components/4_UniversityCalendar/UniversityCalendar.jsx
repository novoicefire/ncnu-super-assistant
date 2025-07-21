// frontend/src/components/4_UniversityCalendar/UniversityCalendar.jsx (現代化版)
import React, { useState, useEffect, useRef } from 'react';
import { robustRequest } from '../../apiHelper';
import './UniversityCalendar.css';

const UniversityCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayMarker, setTodayMarker] = useState(null);

  const eventRefs = useRef({});

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setLoading(true);
        const data = await robustRequest('get', '/api/calendar');
        
        if (Array.isArray(data)) {
          setEvents(data);
          
          // 找到第一個未來或當天的事件
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
  
  const formatDate = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
      endDate.setDate(endDate.getDate() - 1);
    }

    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'short'
    };
    
    const formattedStart = startDate.toLocaleDateString('zh-TW', options);
    const formattedEnd = endDate.toLocaleDateString('zh-TW', options);

    if (formattedStart === formattedEnd) {
      return formattedStart;
    }
    return `${formattedStart} - ${formattedEnd}`;
  };

  if (loading) {
    return (
      <div className="calendar-container">
        <div className="loading">
          正在載入暨大行事曆...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-container">
        <div className="error-message">
          <h3>❌ 載入失敗</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>暨大行事曆</h2>
        <button onClick={scrollToToday} className="go-to-today-btn">
          📍 定位回當日
        </button>
      </div>
      
      <div className="events-list-container">
        {events.length > 0 ? (
          events.map(event => (
            <div
              key={event.start + event.summary}
              ref={el => (eventRefs.current[event.start] = el)}
              className={`event-item ${todayMarker === event.start ? 'today-marker' : ''}`}
            >
              <div className="event-content">
                <h3 className="event-summary">{event.summary}</h3>
                <p className="event-date">{formatDate(event.start, event.end)}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="no-events">
            <h3>📭 暫無行事曆事件</h3>
            <p>目前沒有任何行事曆事件資料</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversityCalendar;
