// frontend/src/components/4_UniversityCalendar/UniversityCalendar.jsx (Refactored with Hook + i18n)
import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import './UniversityCalendar.css';

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
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { events, loading, error, isFallback } = useCalendarEvents();

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
    const locale = i18n.language === 'en' ? 'en-US' : 'zh-TW';
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
    const formattedStart = startDate.toLocaleDateString(locale, options);
    const formattedEnd = endDate.toLocaleDateString(locale, options);
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
  if (error) return (
    <div className="calendar-container">
      <div className="error-message">
        <h3>❌ {t('calendar.loadFailed')}</h3>
        <p>{error}</p>
      </div>
    </div>
  );

  const locale = i18n.language === 'en' ? 'en-US' : 'zh-TW';

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="header-title-group">
          <h2>{t('calendar.title')}</h2>
          {isFallback && <div className="fallback-notice">⚠️ {t('calendar.fallbackNotice')}</div>}
        </div>
        <button onClick={() => setViewMode(viewMode === 'day' ? 'all' : 'day')} className="view-toggle-btn">
          {viewMode === 'day' ? `📅 ${t('calendar.showAll')}` : `📄 ${t('calendar.showToday')}`}
        </button>
      </div>

      <div className="calendar-main-content">
        <div className="calendar-grid-container">
          <Calendar
            key={theme}
            onChange={setSelectedDate}
            value={selectedDate}
            locale={locale}
            tileContent={renderTileContent}
          />
        </div>

        <div className="events-list-container">
          <h3 className="events-list-header">
            {viewMode === 'day'
              ? selectedDate.toLocaleDateString(locale, { month: 'long', day: 'numeric' })
              : t('calendar.upcomingEvents')}
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
              <p>{viewMode === 'day' ? t('calendar.noEventsToday') : t('calendar.noUpcomingEvents')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UniversityCalendar;
