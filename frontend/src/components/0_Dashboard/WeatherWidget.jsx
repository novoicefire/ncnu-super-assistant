/**
 * WeatherWidget.jsx - 現代化天氣小部件
 * 接入真實天氣 API、動畫效果、詳細天氣資訊
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSun,
    faCloud,
    faCloudSun,
    faCloudRain,
    faCloudShowersHeavy,
    faSnowflake,
    faBolt,
    faSmog,
    faWind,
    faDroplet,
    faTemperatureHigh,
    faSun as faUV,
    faLocationDot,
    faSync
} from '@fortawesome/free-solid-svg-icons';
import { fetchWeather } from '../../services/weatherService';
import './WeatherWidget.css';

// 天氣圖標映射
const getWeatherIcon = (icon, isDay) => {
    const icons = {
        'sunny': faSun,
        'partly-cloudy': faCloudSun,
        'cloudy': faCloud,
        'fog': faSmog,
        'drizzle': faCloudRain,
        'rain': faCloudRain,
        'heavy-rain': faCloudShowersHeavy,
        'snow': faSnowflake,
        'thunderstorm': faBolt,
    };
    return icons[icon] || faSun;
};

const WeatherWidget = () => {
    const { t } = useTranslation();
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        loadWeather();
    }, []);

    const loadWeather = async () => {
        setLoading(true);
        const data = await fetchWeather();
        setWeather(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="weather-widget-v2 loading">
                <div className="weather-loading-spinner"></div>
            </div>
        );
    }

    if (!weather) return null;

    return (
        <div
            className={`weather-widget-v2 ${weather.condition} ${expanded ? 'expanded' : ''}`}
            onClick={() => setExpanded(!expanded)}
        >
            {/* 天氣動畫背景 */}
            <div className="weather-animation-layer">
                {weather.condition === 'rain' || weather.condition === 'drizzle' ? (
                    <div className="rain-animation">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="rain-drop" style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${0.5 + Math.random() * 0.5}s`
                            }}></div>
                        ))}
                    </div>
                ) : weather.condition === 'snow' ? (
                    <div className="snow-animation">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className="snowflake" style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                            }}>❄</div>
                        ))}
                    </div>
                ) : weather.condition === 'clear' && weather.isDay ? (
                    <div className="sun-rays">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="ray" style={{
                                transform: `rotate(${i * 45}deg)`
                            }}></div>
                        ))}
                    </div>
                ) : null}
            </div>

            {/* 主要天氣資訊 */}
            <div className="weather-main">
                <div className="weather-icon-wrapper">
                    <FontAwesomeIcon
                        icon={getWeatherIcon(weather.icon, weather.isDay)}
                        className="weather-main-icon"
                    />
                </div>
                <div className="weather-temp-section">
                    <span className="weather-temp">{weather.temperature}°</span>
                    <span className="weather-desc">{t(weather.descKey)}</span>
                </div>
            </div>

            {/* 展開的詳細資訊 */}
            <div className={`weather-details ${expanded ? 'show' : ''}`}>
                <div className="weather-detail-item">
                    <FontAwesomeIcon icon={faTemperatureHigh} />
                    <span className="detail-label">{t('weather.feelsLike')}</span>
                    <span className="detail-value">{weather.feelsLike}°</span>
                </div>
                <div className="weather-detail-item">
                    <FontAwesomeIcon icon={faDroplet} />
                    <span className="detail-label">{t('weather.humidity')}</span>
                    <span className="detail-value">{weather.humidity}%</span>
                </div>
                <div className="weather-detail-item">
                    <FontAwesomeIcon icon={faWind} />
                    <span className="detail-label">{t('weather.wind')}</span>
                    <span className="detail-value">{weather.windSpeed} km/h</span>
                </div>
                <div className="weather-detail-item">
                    <FontAwesomeIcon icon={faUV} />
                    <span className="detail-label">{t('weather.uvIndex')}</span>
                    <span className="detail-value">{weather.uvIndex}</span>
                </div>
            </div>

            {/* 位置標籤 */}
            <div className="weather-location">
                <FontAwesomeIcon icon={faLocationDot} />
                <span>{t('weather.ncnuLocation')}</span>
            </div>

            {/* 刷新按鈕 */}
            <button
                className="weather-refresh-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    loadWeather();
                }}
                title={t('weather.refresh')}
            >
                <FontAwesomeIcon icon={faSync} className={loading ? 'spinning' : ''} />
            </button>

            {/* 資料來源提示 */}
            {!weather.success && (
                <div className="weather-fallback-notice">
                    {t('weather.usingFallback')}
                </div>
            )}
        </div>
    );
};

export default WeatherWidget;
