// frontend/src/components/1_CoursePlanner/CourseTable.jsx (課程名稱粗體綠色修復版)
import React, { useEffect } from 'react';

const CourseTable = ({ schedule, onRemove }) => {
  useEffect(() => {
    const courseTableIsolatedStyles = `
      /* ✅ 基礎表格樣式 */
      #course-schedule-table-isolated {
        width: 100% !important;
        border-collapse: collapse !important;
        table-layout: fixed !important;
        background-color: white !important;
        border-radius: 8px !important;
        overflow: hidden !important;
      }
      
      #course-schedule-table-isolated th,
      #course-schedule-table-isolated td {
        border: 1px solid #ddd !important;
        padding: 8px !important;
        text-align: center !important;
        height: 50px !important;
        font-size: 0.8rem !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        vertical-align: middle !important;
      }
      
      #course-schedule-table-isolated th {
        background-color: #e0f2f1 !important;
        color: #333 !important;
        font-weight: 600 !important;
      }
      
      /* ✅ 課程格子樣式 */
      #course-schedule-table-isolated .course-cell-filled {
        background: #b2dfdb !important;
        color: #004d40 !important;
        cursor: pointer !important;
        transition: all 0.3s ease !important;
        line-height: 1.4 !important;
        white-space: normal !important;
        vertical-align: middle !important;
      }
      
      #course-schedule-table-isolated .course-cell-filled:hover {
        background: #ffcdd2 !important;
        color: #c62828 !important;
        transform: scale(1.02) !important;
      }
      
      /* ✅ 修復：課程名稱 - 粗體 + 綠色 */
      #course-schedule-table-isolated .course-name {
        font-weight: bold !important; /* ✅ 粗體 */
        font-size: 0.8rem !important;
        line-height: 1.3 !important;
        margin-bottom: 2px !important;
        color: #004d40 !important; /* ✅ 明確指定綠色 */
        display: block !important;
      }
      
      /* ✅ 教師名稱 - 正常字重 + 綠色 */
      #course-schedule-table-isolated .course-teacher {
        font-weight: normal !important;
        font-size: 0.7rem !important;
        line-height: 1.2 !important;
        margin-bottom: 1px !important;
        color: #004d40 !important; /* ✅ 明確指定綠色 */
        opacity: 0.9 !important;
        display: block !important;
      }
      
      /* ✅ 教室資訊 - 正常字重 + 綠色 */
      #course-schedule-table-isolated .course-room {
        font-weight: normal !important;
        font-size: 0.7rem !important;
        line-height: 1.2 !important;
        color: #004d40 !important; /* ✅ 明確指定綠色 */
        opacity: 0.8 !important;
        display: block !important;
      }
      
      /* ✅ 深色模式課程格子 */
      [data-theme="dark"] #course-schedule-table-isolated {
        background-color: var(--theme-bg-card) !important;
      }
      
      [data-theme="dark"] #course-schedule-table-isolated th {
        background-color: var(--theme-bg-tertiary) !important;
        color: var(--theme-text-primary) !important;
        border-color: var(--theme-border-primary) !important;
      }
      
      [data-theme="dark"] #course-schedule-table-isolated td {
        border-color: var(--theme-border-secondary) !important;
      }
      
      [data-theme="dark"] #course-schedule-table-isolated .course-cell-filled {
        background: #004c40 !important;
        color: #b2dfdb !important;
      }
      
      [data-theme="dark"] #course-schedule-table-isolated .course-cell-filled:hover {
        background: #d32f2f !important;
        color: #ffcdd2 !important;
      }
      
      /* ✅ 深色模式課程內容顏色 */
      [data-theme="dark"] #course-schedule-table-isolated .course-name {
        color: #b2dfdb !important; /* ✅ 深色模式淺綠色 */
      }
      
      [data-theme="dark"] #course-schedule-table-isolated .course-teacher {
        color: #b2dfdb !important; /* ✅ 深色模式淺綠色 */
      }
      
      [data-theme="dark"] #course-schedule-table-isolated .course-room {
        color: #b2dfdb !important; /* ✅ 深色模式淺綠色 */
      }
      
      /* ✅ 時間欄樣式 */
      #course-schedule-table-isolated .time-cell {
        background-color: #e0f2f1 !important;
        color: #333 !important;
        font-weight: 600 !important;
      }
      
      [data-theme="dark"] #course-schedule-table-isolated .time-cell {
        background-color: var(--theme-bg-tertiary) !important;
        color: var(--theme-text-primary) !important;
      }
      
      /* ✅ 午休時間樣式 */
      #course-schedule-table-isolated .lunch-break-cell {
        background-color: #f0f0f0 !important;
        color: #aaa !important;
        font-style: italic !important;
        font-size: 0.8rem !important;
        text-align: center !important;
        vertical-align: middle !important;
      }
      
      [data-theme="dark"] #course-schedule-table-isolated .lunch-break-cell {
        background-color: var(--theme-bg-tertiary) !important;
        color: var(--theme-text-secondary) !important;
      }
      
      /* ✅ 空堂格子 */
      #course-schedule-table-isolated .empty-cell {
        background-color: white !important;
      }
      
      [data-theme="dark"] #course-schedule-table-isolated .empty-cell {
        background-color: var(--theme-bg-secondary) !important;
      }
      
      /* ✅ 手機版響應式設計 */
      @media (max-width: 768px) {
        #course-schedule-table-isolated th,
        #course-schedule-table-isolated td {
          font-size: 0.7rem !important;
          padding: 4px !important;
        }
        
        #course-schedule-table-isolated .course-cell-filled {
          line-height: 1.2 !important;
        }
        
        #course-schedule-table-isolated .course-name {
          font-size: 0.7rem !important;
          margin-bottom: 1px !important;
        }
        
        #course-schedule-table-isolated .course-teacher,
        #course-schedule-table-isolated .course-room {
          font-size: 0.6rem !important;
          margin-bottom: 0 !important;
        }
        
        #course-schedule-table-isolated .lunch-break-cell {
          font-size: 0.7rem !important;
        }
      }
    `;

    // 移除舊樣式並注入新樣式
    const existingStyle = document.getElementById('course-table-isolated-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'course-table-isolated-styles';
    styleElement.textContent = courseTableIsolatedStyles;
    document.head.appendChild(styleElement);

    return () => {
      const styleToRemove = document.getElementById('course-table-isolated-styles');
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);

  const days = ['一', '二', '三', '四', '五'];
  const periods = ['a', 'b', 'c', 'd', 'z', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
  
  const periodTimes = {
    'a': '08:00 - 09:00',
    'b': '09:00 - 10:00', 
    'c': '10:00 - 11:00',
    'd': '11:00 - 12:00',
    'z': '12:00 - 13:00',
    'e': '13:00 - 14:00',
    'f': '14:00 - 15:00',
    'g': '15:00 - 16:00',
    'h': '16:00 - 17:00',
    'i': '17:00 - 18:00',
    'j': '18:00 - 19:00',
    'k': '19:00 - 20:00',
    'l': '20:00 - 21:00'
  };

  const renderCell = (day, period) => {
    const dayIndex = days.indexOf(day) + 1;
    const slotId = `${dayIndex}${period}`;
    const course = schedule[slotId];

    if (period === 'z') {
      return (
        <td key={`${day}-${period}`} className="lunch-break-cell">
          午休時間
        </td>
      );
    }

    if (course) {
      return (
        <td 
          key={`${day}-${period}`} 
          className="course-cell-filled"
          onClick={() => onRemove && onRemove(course.course_id, course.time)}
          title={`課程：${course.course_cname}\n教師：${course.teacher}\n教室：${course.classroom}\n學分：${course.course_credit}`}
        >
          <div className="course-name">{course.course_cname}</div>
          <div className="course-teacher">{course.teacher}</div>
          <div className="course-room">{course.classroom}</div>
        </td>
      );
    }

    return (
      <td key={`${day}-${period}`} className="empty-cell"></td>
    );
  };

  return (
    <div className="course-table">
      <table id="course-schedule-table-isolated">
        <thead>
          <tr>
            <th className="time-cell">時間</th>
            {days.map(day => (
              <th key={day}>星期{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map(period => (
            <tr key={period}>
              <td className="time-cell">
                <div style={{ fontWeight: 'bold', fontSize: 'inherit' }}>
                  {period === 'z' ? '午休' : `第${period.toUpperCase()}節`}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#666', lineHeight: '1.0' }}>
                  {periodTimes[period]}
                </div>
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
