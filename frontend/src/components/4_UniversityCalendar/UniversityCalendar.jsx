// frontend/src/components/4_UniversityCalendar/UniversityCalendar.jsx (Refactored with Hook)
import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useTheme } from '../../contexts/ThemeContext';
import { useCalendarEvents } from '../../hooks/useCalendarEvents'; // 導入新的 Hook
import './UniversityCalendar.css';

// 骨架屏載入動畫元件 (保持不變)
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
  const { events, loading, error, isFallback } = useCalendarEvents(); // 使用 Hook 獲取資料

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day');

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
            key={theme}
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
