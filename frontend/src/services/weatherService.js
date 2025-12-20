/**
 * weatherService.js - 天氣服務
 * 使用 Open-Meteo API（免費，無需 API Key）
 * 暨南大學位置：23.9559° N, 120.9279° E
 */

const NCNU_LATITUDE = 23.9559;
const NCNU_LONGITUDE = 120.9279;

// WMO 天氣代碼對應
const WMO_CODES = {
    0: { condition: 'clear', icon: 'sunny', descKey: 'weather.clear' },
    1: { condition: 'clear', icon: 'sunny', descKey: 'weather.mainlyClear' },
    2: { condition: 'partly-cloudy', icon: 'partly-cloudy', descKey: 'weather.partlyCloudy' },
    3: { condition: 'cloudy', icon: 'cloudy', descKey: 'weather.overcast' },
    45: { condition: 'fog', icon: 'fog', descKey: 'weather.fog' },
    48: { condition: 'fog', icon: 'fog', descKey: 'weather.depositingRimeFog' },
    51: { condition: 'drizzle', icon: 'drizzle', descKey: 'weather.lightDrizzle' },
    53: { condition: 'drizzle', icon: 'drizzle', descKey: 'weather.moderateDrizzle' },
    55: { condition: 'drizzle', icon: 'drizzle', descKey: 'weather.denseDrizzle' },
    61: { condition: 'rain', icon: 'rain', descKey: 'weather.slightRain' },
    63: { condition: 'rain', icon: 'rain', descKey: 'weather.moderateRain' },
    65: { condition: 'rain', icon: 'heavy-rain', descKey: 'weather.heavyRain' },
    66: { condition: 'freezing-rain', icon: 'rain', descKey: 'weather.freezingRain' },
    67: { condition: 'freezing-rain', icon: 'rain', descKey: 'weather.heavyFreezingRain' },
    71: { condition: 'snow', icon: 'snow', descKey: 'weather.slightSnow' },
    73: { condition: 'snow', icon: 'snow', descKey: 'weather.moderateSnow' },
    75: { condition: 'snow', icon: 'snow', descKey: 'weather.heavySnow' },
    77: { condition: 'snow', icon: 'snow', descKey: 'weather.snowGrains' },
    80: { condition: 'rain', icon: 'rain', descKey: 'weather.slightShowers' },
    81: { condition: 'rain', icon: 'rain', descKey: 'weather.moderateShowers' },
    82: { condition: 'rain', icon: 'heavy-rain', descKey: 'weather.violentShowers' },
    85: { condition: 'snow', icon: 'snow', descKey: 'weather.slightSnowShowers' },
    86: { condition: 'snow', icon: 'snow', descKey: 'weather.heavySnowShowers' },
    95: { condition: 'thunderstorm', icon: 'thunderstorm', descKey: 'weather.thunderstorm' },
    96: { condition: 'thunderstorm', icon: 'thunderstorm', descKey: 'weather.thunderstormWithHail' },
    99: { condition: 'thunderstorm', icon: 'thunderstorm', descKey: 'weather.thunderstormWithHeavyHail' },
};

/**
 * 獲取暨大當前天氣
 * @returns {Promise<Object>} 天氣資料
 */
const CACHE_KEY = 'ncnu_weather_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes from TODO list

/**
 * 獲取暨大當前天氣
 * @returns {Promise<Object>} 天氣資料
 */
export const fetchWeather = async () => {
    try {
        // 1. 檢查快取
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const isCacheValid = (Date.now() - timestamp) < CACHE_DURATION;

            if (isCacheValid) {
                // 回傳快取資料，但更新 isDay 狀態（因為可能過了很久變成晚上）
                return {
                    ...data,
                    isDay: isCurrentlyDay(),
                    lastUpdated: new Date(timestamp), // 這裡保留原始更新時間，或者也可以更新為現在
                    fromCache: true
                };
            }
        }

        // 2. 呼叫 API
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${NCNU_LATITUDE}&longitude=${NCNU_LONGITUDE}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index&timezone=Asia%2FTaipei`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();
        const current = data.current;

        const weatherCode = current.weather_code;
        const weatherInfo = WMO_CODES[weatherCode] || WMO_CODES[0];

        const weatherData = {
            temperature: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            humidity: current.relative_humidity_2m,
            windSpeed: Math.round(current.wind_speed_10m),
            uvIndex: current.uv_index,
            condition: weatherInfo.condition,
            icon: weatherInfo.icon,
            descKey: weatherInfo.descKey,
            isDay: isCurrentlyDay(),
            lastUpdated: new Date(),
            success: true
        };

        // 3. 寫入快取
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data: weatherData,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Failed to save weather cache:', e);
        }

        return weatherData;
    } catch (error) {
        console.error('Failed to fetch weather:', error);
        // 如果 API 失敗，嘗試回傳過期快取
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data } = JSON.parse(cached);
            return {
                ...data,
                descKey: data.descKey + ' (Offline)', // 標記為離線數據
                success: true,
                isDay: isCurrentlyDay()
            };
        }

        // 返回備用天氣資料
        return {
            temperature: 22,
            feelsLike: 23,
            humidity: 65,
            windSpeed: 8,
            uvIndex: 5,
            condition: 'partly-cloudy',
            icon: 'partly-cloudy',
            descKey: 'weather.partlyCloudy',
            isDay: isCurrentlyDay(),
            lastUpdated: new Date(),
            success: false
        };
    }
};

/**
 * 判斷當前是否為白天
 */
const isCurrentlyDay = () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
};

export default fetchWeather;
