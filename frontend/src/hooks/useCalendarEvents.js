// frontend/src/hooks/useCalendarEvents.js
import { useState, useEffect, useRef, useCallback } from 'react';
import ICAL from 'ical.js';
import { robustRequest } from '../apiHelper';

const MAX_RETRIES = 3;

export const useCalendarEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const retryCount = useRef(0);

  const fetchLocalCalendar = useCallback(async () => {
    try {
      console.log('API fetch failed, attempting to load local calendar.ics');
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
      // 改為讀取靜態 JSON 檔案
      const response = await fetch('/data/calendar.json');
      if (!response.ok) {
        throw new Error('無法載入行事曆資料');
      }
      const data = await response.json();

      if (Array.isArray(data)) {
        setEvents(data);
        setError(null);
        setLoading(false);
      } else {
        throw new Error('無法識別的行事曆資料格式');
      }
    } catch (err) {
      console.warn('Static calendar fetch failed:', err);
      // 如果 JSON 載入失敗，嘗試載入本地 ICS (作為最後備援)
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

  return { events, loading, error, isFallback };
};
