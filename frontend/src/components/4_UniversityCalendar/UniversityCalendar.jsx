// frontend/src/components/4_UniversityCalendar/UniversityCalendar.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UniversityCalendar.css';

const API_URL = import.meta.env.VITE_API_URL;

const UniversityCalendar = () => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        axios.get(`${API_URL}/api/calendar`)
            .then(res => setEvents(res.data))
            .catch(err => console.error("Error fetching calendar events:", err));
    }, []);

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date)) return dateString; // 如果日期無效，返回原字串
            
            // 如果時間是午夜，只顯示日期
            if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) {
                 const options = { year: 'numeric', month: 'long', day: 'numeric' };
                 return date.toLocaleDateString('zh-TW', options);
            }
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return date.toLocaleString('zh-TW', options);
        } catch (e) {
            return dateString;
        }
    }

    return (
        <div className="calendar-container">
            <h1>國立暨南國際大學 行事曆</h1>
            <div className="event-list">
                {events.map((event, index) => (
                    <div className="event-item" key={index}>
                        <div className="event-date">
                            {formatDate(event.start)}
                        </div>
                        <div className="event-summary">
                            {event.summary}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UniversityCalendar;