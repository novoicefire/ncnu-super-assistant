import React from 'react';

const CourseTable = ({ schedule, onRemove }) => {
    const days = ['一', '二', '三', '四', '五', '六', '七'];
    const periods = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
    const periodTimes = {
        'a': '07:10-08:00', 'b': '08:10-09:00', 'c': '09:10-10:00', 'd': '10:10-11:00',
        'e': '11:10-12:00', 'f': '13:10-14:00', 'g': '14:10-15:00', 'h': '15:10-16:00',
        'i': '16:10-17:00', 'j': '17:10-18:00', 'k': '18:10-19:00', 'l': '19:10-20:00'
    };

    const getCell = (day, period) => {
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
                        {days.slice(0, 5).map(day => <th key={day}>星期{day}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {periods.map(period => (
                        <tr key={period}>
                            <td>
                                <strong>{period.toUpperCase()}</strong>
                                <br/>
                                <small>{periodTimes[period]}</small>
                            </td>
                            {days.slice(0, 5).map(day => getCell(day, period))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CourseTable;