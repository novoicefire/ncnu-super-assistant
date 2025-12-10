/**
 * BottomNavBar.jsx - 手機版底部 Tab Bar + i18n
 * 參考 eMenu Tokyo 設計，毛玻璃效果
 */
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHouse,
    faCalendarDays,
    faGraduationCap,
    faAddressBook,
    faEllipsis,
    faCalendar,
    faClipboardList,
    faBook,
    faXmark
} from '@fortawesome/free-solid-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import './BottomNavBar.css';

const BottomNavBar = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const [showMore, setShowMore] = useState(false);

    // 檢查用戶是否已經看過 IG 提示（從 localStorage 讀取）
    const [hasSeenIGHint, setHasSeenIGHint] = useState(() => {
        return localStorage.getItem('hasSeenIGHint') === 'true';
    });

    // 當用戶點開「其他」選單時，標記已看過
    const handleMoreClick = () => {
        if (!hasSeenIGHint) {
            localStorage.setItem('hasSeenIGHint', 'true');
            setHasSeenIGHint(true);
        }
        setShowMore(!showMore);
    };

    // 主要 Tab 項目（使用翻譯 key）
    const mainTabs = [
        { path: '/', labelKey: 'nav.home', icon: faHouse },
        { path: '/course-planner', labelKey: 'nav.coursePlanner', icon: faCalendarDays },
        { path: '/tracker', labelKey: 'nav.progress', icon: faGraduationCap },
        { path: '/calendar', labelKey: 'nav.calendar', icon: faCalendar },
    ];

    // 更多選單項目
    const moreItems = [
        { path: '/updates', labelKey: 'nav.updateLog', icon: faClipboardList },
        {
            path: 'https://solar-tuesday-ad1.notion.site/edb276ef8b5c4d05983a4a27c841a989?v=0e56c1269fd149aebe113ddff1c49d73',
            labelKey: 'nav.ibsZone',
            icon: faBook,
            external: true
        },
        {
            path: 'https://www.instagram.com/ncnu_super_assistant/',
            labelKey: 'nav.contactIG',
            icon: faInstagram,
            external: true
        },
    ];

    // 檢查更多選單中是否有 active 項目
    const isMoreActive = moreItems.some(item =>
        !item.external && location.pathname === item.path
    );

    return (
        <>
            {/* 更多選單彈出層 */}
            {showMore && (
                <div className="bottom-nav-overlay" onClick={() => setShowMore(false)}>
                    <div className="more-menu" onClick={(e) => e.stopPropagation()}>
                        <div className="more-menu-header">
                            <span>{t('common.moreFeatures')}</span>
                            <button
                                className="close-btn"
                                onClick={() => setShowMore(false)}
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <div className="more-menu-items">
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
                    </div>
                </div>
            )}

            {/* 底部導航欄 */}
            <nav className="bottom-nav">
                {mainTabs.map((tab) => (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                        className={({ isActive }) =>
                            `bottom-nav-tab ${isActive ? 'active' : ''}`
                        }
                    >
                        <FontAwesomeIcon icon={tab.icon} className="tab-icon" />
                        <span className="tab-label">{t(tab.labelKey)}</span>
                    </NavLink>
                ))}

                {/* 更多按鈕 */}
                <button
                    className={`bottom-nav-tab more-btn ${showMore || isMoreActive ? 'active' : ''}`}
                    onClick={handleMoreClick}
                >
                    <FontAwesomeIcon icon={faEllipsis} className="tab-icon" />
                    <span className="tab-label">{t('nav.more')}</span>
                    {/* IG 提示泡泡：只有在用戶尚未看過時才顯示 */}
                    {!hasSeenIGHint && <span className="ig-hint-bubble">IG</span>}
                </button>
            </nav>
        </>
    );
};

export default BottomNavBar;
