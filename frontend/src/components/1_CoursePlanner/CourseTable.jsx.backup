// frontend/src/components/1_CoursePlanner/CourseTable.jsx (無 rowSpan 修正版)

import React from 'react';

const CourseTable = ({ schedule, onRemove }) => {
    const days = ['一', '二', '三', '四', '五'];
    const periods = ['a', 'b', 'c', 'd', 'z', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
    const periodTimes = {
        'a': '08:00 - 09:00', 'b': '09:00 - 10:00', 'c': '10:00 - 11:00',
        'd': '11:00 - 12:00', 'z': '12:00 - 13:00', 'e': '13:00 - 14:00',
        'f': '14:00 - 15:00', 'g': '15:00 - 16:00', 'h': '16:00 - 17:00',
        'i': '17:00 - 18:00', 'j': '18:00 - 19:00', 'k': '19:00 - 20:00',
        'l': '20:00 - 21:00'
    };

    /**
     * [核心修正] 渲染單一儲存格的邏輯
     * 放棄 rowSpan，每個格子都獨立判斷和渲染
     */
    const renderCell = (day, period) => {
        const dayIndex = days.indexOf(day) + 1;
        const slotId = `${dayIndex}${period}`;
        const course = schedule[slotId];

        // 處理午休
        if (period === 'z' && !course) {
            return <td key={slotId} className="lunch-break">午休</td>;
        }

        // 如果該儲存格沒有課程，返回空白
        if (!course) {
            return <td key={slotId}></td>;
        }

        // 如果有課程，渲染課程資訊
        return (
            <td key={slotId} className="course-cell" onClick={() => onRemove(course.course_id, course.time)}>
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
                            {days.map(day => renderCell(day, period))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CourseTable;