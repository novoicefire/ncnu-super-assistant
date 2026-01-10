/**
 * BottomNavBar.jsx - 手機版底部 Tab Bar + i18n
 * 參考 eMenu Tokyo 設計，毛玻璃效果
 * 使用統一的 BottomSheet 組件
 */
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHouse,
    faCalendarDays,
    faGraduationCap,
    faEllipsis,
    faCalendar,
    faClipboardList,
    faBook,
    faDownload,
    faFileContract
} from '@fortawesome/free-solid-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import { usePWA } from '../contexts/PWAContext';
import BottomSheet from './common/BottomSheet';
import './BottomNavBar.css';

const BottomNavBar = ({ onOpenTerms }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const [showMore, setShowMore] = useState(false);
    const { canShow: canShowPWA, openPrompt: openPWAPrompt } = usePWA();

    const handleMoreClick = () => {
        setShowMore(!showMore);
    };

    // 處理安裝 App 按鈕點擊
    const handleInstallClick = () => {
        setShowMore(false);
        openPWAPrompt();
    };

    // 主要 Tab 項目（使用翻譯 key）
    const mainTabs = [
        { path: '/', labelKey: 'nav.home', icon: faHouse },
        { path: '/course-planner', labelKey: 'nav.coursePlanner', icon: faCalendarDays },
        // IG 在中間
        { path: '/calendar', labelKey: 'nav.calendar', icon: faCalendar },
    ];

    // IG 連結設定
    const igLink = {
        path: 'https://www.instagram.com/ncnu_super_assistant/',
        labelKey: 'nav.contactIG',
        icon: faInstagram
    };

    // 更多選單項目 (移除 IG)
    const moreItems = [
        { path: '/updates', labelKey: 'nav.updateLog', icon: faClipboardList },
        {
            path: 'https://solar-tuesday-ad1.notion.site/edb276ef8b5c4d05983a4a27c841a989?v=0e56c1269fd149aebe113ddff1c49d73',
            labelKey: 'nav.ibsZone',
            icon: faBook,
            external: true
        }
    ];

    // 檢查更多選單中是否有 active 項目
    const isMoreActive = moreItems.some(item =>
        !item.external && location.pathname === item.path
    );

    return (
        <>
            {/* 使用統一的 BottomSheet 組件 */}
            <BottomSheet
                isVisible={showMore}
                onClose={() => setShowMore(false)}
                title={t('common.moreFeatures')}
                showCloseButton={true}
                maxHeight="50vh"
                className="more-menu-sheet"
            >
                <div className="more-menu-items">
                    {/* 安裝 App 按鈕（只在手機且可顯示時才顯示） */}
                    {canShowPWA && (
                        <button
                            className="more-menu-item install-app-btn"
                            onClick={handleInstallClick}
                        >
                            <FontAwesomeIcon icon={faDownload} className="more-icon" />
                            <span>{t('pwa.installAppBtn', '安裝 App')}</span>
                        </button>
                    )}
                    {/* 服務條款按鈕 */}
                    {onOpenTerms && (
                        <button
                            className="more-menu-item terms-btn"
                            onClick={() => {
                                setShowMore(false);
                                onOpenTerms();
                            }}
                        >
                            <FontAwesomeIcon icon={faFileContract} className="more-icon" />
                            <span>{t('nav.viewTerms')}</span>
                        </button>
                    )}
                    {moreItems.map((item) => (
                        item.external ? (
                            <a
                                key={item.path}
                                href={item.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="more-menu-item external"
                                onClick={() => setShowMore(false)}
                            >
                                <FontAwesomeIcon icon={item.icon} className="more-icon" />
                                <span>{t(item.labelKey)}</span>
                                <span className="external-badge">↗</span>
                            </a>
                        ) : (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `more-menu-item ${isActive ? 'active' : ''}`
                                }
                                onClick={() => setShowMore(false)}
                            >
                                <FontAwesomeIcon icon={item.icon} className="more-icon" />
                                <span>{t(item.labelKey)}</span>
                            </NavLink>
                        )
                    ))}
                </div>
            </BottomSheet>

            {/* 底部導航欄 */}
            <nav className="bottom-nav">
                {/* 1. 首頁 */}
                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        `bottom-nav-tab ${isActive ? 'active' : ''}`
                    }
                >
                    <FontAwesomeIcon icon={faHouse} className="tab-icon" />
                    <span className="tab-label">{t('nav.home')}</span>
                </NavLink>

                {/* 2. 排課 */}
                <NavLink
                    to="/course-planner"
                    className={({ isActive }) =>
                        `bottom-nav-tab ${isActive ? 'active' : ''}`
                    }
                >
                    <FontAwesomeIcon icon={faCalendarDays} className="tab-icon" />
                    <span className="tab-label">{t('nav.coursePlanner')}</span>
                </NavLink>

                {/* 3. IG (中央) - 外部連結 */}
                <a
                    href={igLink.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`bottom-nav-tab ig-highlight ${location.pathname === '/' ? 'bounce-active' : ''}`}
                >
                    <FontAwesomeIcon icon={igLink.icon} className="tab-icon" />
                    <span className="tab-label">IG</span>
                </a>

                {/* 4. 行事曆 */}
                <NavLink
                    to="/calendar"
                    className={({ isActive }) =>
                        `bottom-nav-tab ${isActive ? 'active' : ''}`
                    }
                >
                    <FontAwesomeIcon icon={faCalendar} className="tab-icon" />
                    <span className="tab-label">{t('nav.calendar')}</span>
                </NavLink>

                {/* 5. 更多按鈕 */}
                <button
                    className={`bottom-nav-tab more-btn ${showMore || isMoreActive ? 'active' : ''}`}
                    onClick={handleMoreClick}
                >
                    <FontAwesomeIcon icon={faEllipsis} className="tab-icon" />
                    <span className="tab-label">{t('nav.more')}</span>
                </button>
            </nav>
        </>
    );
};

export default BottomNavBar;
