// frontend/src/components/1_CoursePlanner/CourseTable.jsx (課程名稱粗體綠色修復版)
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CourseTable = ({ schedule, onRemove }) => {
  const { t, i18n } = useTranslation();

  // 根據語言設定取得課程名稱
  const getCourseName = (course) => {
    if (!course) return '';
    if (i18n.language === 'en' && course.course_ename) {
      return course.course_ename;
    }
    return course.course_cname || '';
  };
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

  // 依據 114 年 7 月 22 日第 629 次行政會議通過的新時間表
  const periodTimes = {
    'a': '08:10 - 09:00',
    'b': '09:10 - 10:00',
    'c': '10:10 - 11:00',
    'd': '11:10 - 12:00',
    'z': '12:10 - 13:30',  // 午休
    'e': '13:30 - 14:20',  // 下午課程開始時間調整
    'f': '14:30 - 15:20',
    'g': '15:30 - 16:20',
    'h': '16:30 - 17:20',
    'i': '17:30 - 18:20',
    'j': '18:30 - 19:20',
    'k': '19:30 - 20:20',
    'l': '20:30 - 21:20',
  };

  const renderCell = (day, period) => {
    const dayIndex = days.indexOf(day) + 1;
    const slotId = `${dayIndex}${period}`;
    const course = schedule[slotId];

    if (period === 'z') {
      return (
        <td key={`${day}-${period}`} className="lunch-break-cell">
          {t('coursePlanner.lunchBreak')}
        </td>
      );
    }

    if (course) {
      // 根據語言取得教師名稱
      const teacher = (i18n.language === 'en' && course.eteacher) ? course.eteacher : course.teacher;

      return (
        <td
          key={`${day}-${period}`}
          className="course-cell-filled"
          onClick={() => {
            if (onRemove && window.confirm(t('coursePlanner.confirmRemove', { courseName: getCourseName(course) }))) {
              onRemove(course.course_id, course.time);
            }
          }}
          title={`${t('coursePlanner.courseLabel')}: ${getCourseName(course)}\n${t('coursePlanner.teacher')}: ${teacher}\n${t('coursePlanner.room')}: ${course.location}\n${t('coursePlanner.credits')}: ${course.course_credit}`}
        >
          <div className="course-name">{getCourseName(course)}</div>
          <div className="course-teacher">{teacher}</div>
          <div className="course-room">{course.location}</div>
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
            <th className="time-cell">{t('coursePlanner.time')}</th>
            {days.map(day => (
              <th key={day}>{t(`coursePlanner.weekday${day}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map(period => (
            <tr key={period}>
              <td className="time-cell">
                <div style={{ fontWeight: 'bold', fontSize: 'inherit' }}>
                  {period === 'z' ? t('coursePlanner.lunchBreak') : t('coursePlanner.period', { period: period.toUpperCase() })}
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
