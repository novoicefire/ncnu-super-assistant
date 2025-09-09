// frontend/src/components/4_UniversityCalendar/UniversityCalendar.jsx (新增載入動畫)
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import ICAL from 'ical.js';
import { useTheme } from '../../contexts/ThemeContext';
import { robustRequest } from '../../apiHelper';
import './UniversityCalendar.css';

const MAX_RETRIES = 3;

// 骨架屏載入動畫元件
const CalendarSkeleton = () => (
  <div className="calendar-container skeleton-container">
    <div className="calendar-header">
      <div className="header-title-group">
        <div className="skeleton skeleton-title"></div>
      </div>
      <div className="skeleton skeleton-button"></div>
    </div>
    <div className="calendar-main-content">
      <div className="calendar-grid-container">
        <div className="skeleton-calendar">
          <div className="skeleton-calendar-header"></div>
          <div className="skeleton-calendar-grid">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="skeleton-calendar-day"></div>
            ))}
          </div>
        </div>
      </div>
      <div className="events-list-container">
        <div className="skeleton skeleton-subtitle"></div>
        <div className="skeleton-event-item"></div>
        <div className="skeleton-event-item"></div>
        <div className="skeleton-event-item"></div>
      </div>
    </div>
  </div>
);

const UniversityCalendar = () => {
  const { theme } = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day');
  const [isFallback, setIsFallback] = useState(false);
  const retryCount = useRef(0);

  const fetchLocalCalendar = useCallback(async () => {
    try {
      const response = await fetch('/data/calendar.ics');
      if (!response.ok) throw new Error(`無法載入本地備援檔案: ${response.statusText}`);
      const icsText = await response.text();
      const jcalData = ICAL.parse(icsText);
      const vcalendar = new ICAL.Component(jcalData);
      const vevents = vcalendar.getAllSubcomponents('vevent');
      const parsedEvents = vevents.map(vevent => {
        const event = new ICAL.Event(vevent);
        return {
          summary: event.summary,
          start: event.startDate.toJSDate().toISOString(),
          end: event.endDate.toJSDate().toISOString(),
        };
      });
      setEvents(parsedEvents);
      setIsFallback(true);
      setError(null);
    } catch (localErr) {
      setError(`API 及本地備援檔案均載入失敗: ${localErr.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCalendar = useCallback(async () => {
    try {
      const data = await robustRequest('get', '/api/calendar');
      if (Array.isArray(data)) {
        setEvents(data);
        setError(null);
        setLoading(false);
      } else {
        throw new Error('無法識別的行事曆資料格式');
      }
    } catch (err) {
      retryCount.current += 1;
      if (retryCount.current >= MAX_RETRIES) {
        await fetchLocalCalendar();
      } else {
        setTimeout(() => fetchCalendar(), 1000);
      }
    }
  }, [fetchLocalCalendar]);

  useEffect(() => {
    setLoading(true);
    retryCount.current = 0;
    fetchCalendar();
  }, [fetchCalendar]);

  const eventDates = useMemo(() => {
    const dates = new Set();
    events.forEach(event => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.add(new Date(d).toDateString());
      }
    });
    return dates;
  }, [events]);

  const formatDate = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
      endDate.setDate(endDate.getDate() - 1);
    }
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
    const formattedStart = startDate.toLocaleDateString('zh-TW', options);
    const formattedEnd = endDate.toLocaleDateString('zh-TW', options);
    return formattedStart === formattedEnd ? formattedStart : `${formattedStart} - ${formattedEnd}`;
  };

  const filteredEvents = useMemo(() => {
    if (viewMode === 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return events.filter(event => new Date(event.end) >= today);
    }
    return events.filter(event => {
      const eventStart = new Date(event.start);
      eventStart.setHours(0, 0, 0, 0);
      const eventEnd = new Date(event.end);
      eventEnd.setHours(0, 0, 0, 0);
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      return selected >= eventStart && selected <= eventEnd;
    });
  }, [events, selectedDate, viewMode]);

  const renderTileContent = ({ date, view }) => {
    if (view === 'month' && eventDates.has(date.toDateString())) {
      return <div className="event-marker"></div>;
    }
    return null;
  };

  if (loading) return <CalendarSkeleton />;
  if (error) return <div className="calendar-container"><div className="error-message"><h3>❌ 載入失敗</h3><p>{error}</p></div></div>;

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="header-title-group">
          <h2>暨大行事曆</h2>
          {isFallback && <div className="fallback-notice">⚠️ 目前為離線備份資料</div>}
        </div>
        <button onClick={() => setViewMode(viewMode === 'day' ? 'all' : 'day')} className="view-toggle-btn">
          {viewMode === 'day' ? '📅 顯示所有事件' : '📄 僅顯示當日'}
        </button>
      </div>

      <div className="calendar-main-content">
        <div className="calendar-grid-container">
          <Calendar
            key={theme} // 確保主題切換時能重新渲染
            onChange={setSelectedDate}
            value={selectedDate}
            locale="zh-TW"
            tileContent={renderTileContent}
          />
        </div>
        
        <div className="events-list-container">
          <h3 className="events-list-header">
            {viewMode === 'day' ? selectedDate.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' }) : '所有即將到來的事件'}
          </h3>
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <div key={event.start + event.summary} className="event-item">
                <div className="event-content">
                  <h4 className="event-summary">{event.summary}</h4>
                  <p className="event-date">{formatDate(event.start, event.end)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="no-events">
              <p>{viewMode === 'day' ? '本日無任何事件' : '沒有即將到來的事件'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UniversityCalendar;
