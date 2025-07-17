// frontend/src/components/1_CoursePlanner/CourseTable.jsx (時間修正版)

import React from 'react';

const CourseTable = ({ schedule, onRemove }) => {
    const days = ['一', '二', '三', '四', '五'];

    // 更新後的正確時段代號順序，加入了中午的 'z'
    const periods = ['a', 'b', 'c', 'd', 'z', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
    
    // 更新後的正確時段對應表
    const periodTimes = {
        'a': '08:00 - 09:00',
        'b': '09:00 - 10:00',
        'c': '10:00 - 11:00',
        'd': '11:00 - 12:00',
        'z': '12:00 - 13:00', // 午休時段
        'e': '13:00 - 14:00',
        'f': '14:00 - 15:00',
        'g': '15:00 - 16:00',
        'h': '16:00 - 17:00',
        'i': '17:00 - 18:00',
        'j': '18:00 - 19:00',
        'k': '19:00 - 20:00',
        'l': '20:00 - 21:00'
    };

    // 這個函數的邏輯不需要改變，它會自動適應新的 periods 陣列
    const getCell = (day, period) => {
        // 午休時段 'z' 特別標示
        if (period === 'z') {
            const slotId = `${days.indexOf(day) + 1}${period}`;
            const course = schedule[slotId];
            if (course) {
                 // 如果有課程排在午休，正常顯示
                 return getStandardCell(day, period);
            }
            // 如果沒有課程，顯示為午休
            return <td key={slotId} className="lunch-break">午休</td>;
        }
        return getStandardCell(day, period);
    };

    const getStandardCell = (day, period) => {
        const slotId = `${days.indexOf(day) + 1}${period}`;
        const course = schedule[slotId];
        
        if (!course) return <td key={slotId}></td>;

        const firstPeriodOfCourse = course.time.substring(1)[0];
        if (firstPeriodOfCourse !== period) return null;

        const duration = course.time.length - 1;

        return (
            <td key={slotId} rowSpan={duration} className="course-cell" onClick={() => onRemove(course.course_id, course.time)}>
                <strong>{course.course_cname}</strong>
                <br />
                <span>{course.teacher}</span>
                <br />
                <small>{course.location}</small>
            </td>
        );
    };

    return (
        <div className="course-table">
            <h3>我的課表 (點擊課程可移除)</h3>
            <table>
                <thead>
                    <tr>
                        <th>時間</th>
                        {days.map(day => <th key={day}>星期{day}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {periods.map(period => (
                        <tr key={period}>
                            <td>
                                <strong>第 {period.toUpperCase()} 節</strong>
                                <br/>
                                <small>{periodTimes[period]}</small>
                            </td>
                            {days.map(day => getCell(day, period))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CourseTable;