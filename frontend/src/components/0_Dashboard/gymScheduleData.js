/**
 * gymScheduleData.js - 體育館開放時間資料
 * 資料來源：體育組網站 PDF 時間表
 * 包含游泳池、健身房、SPA 的開放時間規則
 */

// 可用資料的月份範圍（根據已下載的 PDF 時間表）
// 114年11月 = 2025-11, 114年12月 = 2025-12
export const AVAILABLE_DATA_RANGE = {
    start: new Date(2025, 10, 1),  // 2025年11月1日 (月份從0開始)
    end: new Date(2025, 11, 31),   // 2025年12月31日
};

/**
 * 檢查日期是否在可用資料範圍內
 */
export function isDateInAvailableRange(date) {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const start = new Date(AVAILABLE_DATA_RANGE.start);
    start.setHours(0, 0, 0, 0);

    const end = new Date(AVAILABLE_DATA_RANGE.end);
    end.setHours(23, 59, 59, 999);

    return checkDate >= start && checkDate <= end;
}

/**
 * 取得限制在可用範圍內的日期
 */
export function clampDateToAvailableRange(date) {
    const checkDate = new Date(date);

    if (checkDate < AVAILABLE_DATA_RANGE.start) {
        return new Date(AVAILABLE_DATA_RANGE.start);
    }
    if (checkDate > AVAILABLE_DATA_RANGE.end) {
        return new Date(AVAILABLE_DATA_RANGE.end);
    }
    return checkDate;
}

// 冬季休館期間（民國年轉西元年）
export const WINTER_CLOSURE = {
    start: new Date(2025, 11, 28), // 114/12/28 → 2025-12-28
    end: new Date(2026, 2, 16),    // 115/3/16 → 2026-03-16
    reopenDate: new Date(2026, 2, 17), // 115/3/17 開放售票
};

// 設施類型
export const FACILITY_TYPES = {
    POOL: 'pool',
    GYM: 'gym',
    SPA: 'spa',
};

// 設施資訊
export const FACILITIES = {
    [FACILITY_TYPES.POOL]: {
        id: FACILITY_TYPES.POOL,
        nameKey: 'gymSchedule.pool',
        icon: 'faSwimmer',
        color: '#00BCD4',
    },
    [FACILITY_TYPES.GYM]: {
        id: FACILITY_TYPES.GYM,
        nameKey: 'gymSchedule.gym',
        icon: 'faDumbbell',
        color: '#FF9800',
    },
    [FACILITY_TYPES.SPA]: {
        id: FACILITY_TYPES.SPA,
        nameKey: 'gymSchedule.spa',
        icon: 'faSpa',
        color: '#9C27B0',
    },
};

// 開放狀態
export const STATUS = {
    OPEN: 'open',           // 開放中
    UPCOMING: 'upcoming',   // 即將開放（1小時內）
    CLOSED: 'closed',       // 已關閉
    HOLIDAY: 'holiday',     // 休館日
    WINTER_CLOSED: 'winter_closed', // 冬季休館
};

/**
 * 標準開放時間表（依星期幾）
 * 0 = 週日, 1 = 週一, ..., 6 = 週六
 */
const WEEKLY_SCHEDULE = {
    [FACILITY_TYPES.POOL]: {
        0: null, // 週日休館
        1: null, // 週一休館
        2: { open: '13:00', close: '21:00' },
        3: { open: '13:00', close: '21:00' },
        4: { open: '13:00', close: '21:00' },
        5: { open: '13:00', close: '21:00' },
        6: { open: '14:00', close: '18:30' },
    },
    [FACILITY_TYPES.GYM]: {
        0: null, // 週日休館
        1: { open: '15:00', close: '21:30' },
        2: { open: '15:00', close: '21:30' },
        3: { open: '15:00', close: '21:30' },
        4: { open: '15:00', close: '21:30' },
        5: { open: '15:00', close: '21:30' },
        6: { open: '14:00', close: '18:30' },
    },
    [FACILITY_TYPES.SPA]: {
        // SPA 跟隨游泳池開放時間
        0: null,
        1: null,
        2: 'followPool',
        3: 'followPool',
        4: 'followPool',
        5: 'followPool',
        6: 'followPool',
    },
};

// 114年國定假日（西元2025年）
const HOLIDAYS_2025 = [
    '2025-01-01', // 元旦
    '2025-01-28', // 除夕
    '2025-01-29', // 春節
    '2025-01-30',
    '2025-01-31',
    '2025-02-01',
    '2025-02-28', // 和平紀念日
    '2025-04-04', // 兒童節
    '2025-04-05', // 清明節
    '2025-05-01', // 勞動節
    '2025-05-31', // 端午節
    '2025-10-10', // 國慶日
    '2025-10-25', // 中秋節
];

/**
 * 檢查是否為冬季休館期間
 */
export function isWinterClosure(date) {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const start = new Date(WINTER_CLOSURE.start);
    start.setHours(0, 0, 0, 0);

    const end = new Date(WINTER_CLOSURE.end);
    end.setHours(23, 59, 59, 999);

    return checkDate >= start && checkDate <= end;
}

/**
 * 檢查是否為國定假日
 */
export function isHoliday(date) {
    const dateStr = date.toISOString().split('T')[0];
    return HOLIDAYS_2025.includes(dateStr);
}

/**
 * 取得指定日期的設施開放時間
 */
export function getFacilitySchedule(facilityType, date) {
    const targetDate = new Date(date);

    // 檢查冬季休館（游泳池和SPA）
    if ((facilityType === FACILITY_TYPES.POOL || facilityType === FACILITY_TYPES.SPA) && isWinterClosure(targetDate)) {
        return {
            status: STATUS.WINTER_CLOSED,
            schedule: null,
            message: 'gymSchedule.winterClosed',
        };
    }

    // 檢查國定假日
    if (isHoliday(targetDate)) {
        return {
            status: STATUS.HOLIDAY,
            schedule: null,
            message: 'gymSchedule.holidayClosed',
        };
    }

    const dayOfWeek = targetDate.getDay();
    const schedule = WEEKLY_SCHEDULE[facilityType][dayOfWeek];

    // 休館日
    if (schedule === null) {
        return {
            status: STATUS.HOLIDAY,
            schedule: null,
            message: 'gymSchedule.regularClosed',
        };
    }

    // SPA 跟隨游泳池
    if (schedule === 'followPool') {
        const poolSchedule = getFacilitySchedule(FACILITY_TYPES.POOL, date);
        return {
            ...poolSchedule,
            followsPool: true,
            message: 'gymSchedule.followsPool',
        };
    }

    return {
        status: STATUS.CLOSED, // 初始狀態，會由 getCurrentStatus 更新
        schedule: schedule,
        message: null,
    };
}

/**
 * 解析時間字串為今日的 Date 物件
 */
function parseTimeToDate(timeStr, baseDate) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
}

/**
 * 計算目前的開放狀態與剩餘時間
 */
export function getCurrentStatus(facilityType, date = new Date()) {
    const info = getFacilitySchedule(facilityType, date);

    // 如果是特殊狀態（休館、冬季休館），直接返回
    if (info.status === STATUS.HOLIDAY || info.status === STATUS.WINTER_CLOSED) {
        return {
            ...info,
            progress: 0,
            remainingTime: null,
            timeUntilOpen: null,
        };
    }

    const now = new Date(date);
    const schedule = info.schedule;

    const openTime = parseTimeToDate(schedule.open, now);
    const closeTime = parseTimeToDate(schedule.close, now);

    // 計算狀態
    if (now >= openTime && now < closeTime) {
        // 開放中
        const totalDuration = closeTime - openTime;
        const elapsed = now - openTime;
        const remaining = closeTime - now;
        const progress = (elapsed / totalDuration) * 100;

        return {
            ...info,
            status: STATUS.OPEN,
            progress: Math.min(100, Math.max(0, progress)),
            remainingTime: remaining,
            timeUntilOpen: null,
        };
    } else if (now < openTime) {
        // 尚未開放
        const timeUntilOpen = openTime - now;
        const isUpcoming = timeUntilOpen <= 60 * 60 * 1000; // 1小時內

        return {
            ...info,
            status: isUpcoming ? STATUS.UPCOMING : STATUS.CLOSED,
            progress: 0,
            remainingTime: null,
            timeUntilOpen: timeUntilOpen,
        };
    } else {
        // 已關閉
        return {
            ...info,
            status: STATUS.CLOSED,
            progress: 100,
            remainingTime: null,
            timeUntilOpen: null,
        };
    }
}

/**
 * 格式化剩餘時間
 */
export function formatRemainingTime(milliseconds) {
    if (!milliseconds || milliseconds <= 0) return null;

    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
        return { hours, minutes, text: `${hours}h ${minutes}m` };
    }
    return { hours: 0, minutes, text: `${minutes}m` };
}

/**
 * 取得指定日期範圍的日期陣列
 */
export function getDateRange(centerDate, range = 3) {
    const dates = [];
    const center = new Date(centerDate);

    for (let i = -range; i <= range; i++) {
        const date = new Date(center);
        date.setDate(center.getDate() + i);
        dates.push(date);
    }

    return dates;
}

/**
 * 格式化日期顯示
 */
export function formatDate(date, locale = 'zh-TW') {
    const weekdays = locale === 'zh-TW'
        ? ['日', '一', '二', '三', '四', '五', '六']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return {
        month: date.getMonth() + 1,
        day: date.getDate(),
        weekday: weekdays[date.getDay()],
        isToday: isSameDay(date, new Date()),
    };
}

/**
 * 判斷是否為同一天
 */
export function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
}
