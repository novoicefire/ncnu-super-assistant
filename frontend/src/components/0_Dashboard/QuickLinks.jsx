// frontend/src/components/0_Dashboard/QuickLinks.jsx
// 橫向快速連結按鈕列 - 放置於 WelcomeBanner 下方，支援 i18n + 電腦版左右箭頭導航
import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faGraduationCap,
    faBook,
    faBuilding,
    faEnvelope,
    faUsers,
    faCheckCircle,
    faExternalLinkAlt,
    faQrcode,
    faChalkboardTeacher,
    faChevronLeft,
    faChevronRight
} from '@fortawesome/free-solid-svg-icons';

const QuickLinks = () => {
    const { t } = useTranslation();
    const scrollRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    // 連結資料
    const quickLinksData = [
        {
            id: 'moodle',
            nameKey: 'quickLinks.moodle',
            icon: faChalkboardTeacher,
            url: 'https://moodle.ncnu.edu.tw/',
            color: '#F57C00'
        },
        {
            id: 'portal',
            nameKey: 'quickLinks.portal',
            icon: faGraduationCap,
            url: 'https://sso.ncnu.edu.tw/',
            color: '#00796B'
        },
        {
            id: 'line',
            nameKey: 'quickLinks.studentLine',
            icon: faUsers,
            url: 'https://line.me/ti/g2/ZjOqtMz4xdB_W4_hig6PCfFItPfeWYuOLlMmGA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default',
            color: '#4CAF50'
        },
        {
            id: 'libraryQr',
            nameKey: 'quickLinks.libraryQr',
            icon: faQrcode,
            url: 'https://webdoor.lib.ncnu.edu.tw/',
            color: '#C62828'
        },
        {
            id: 'ncnu-line',
            nameKey: 'quickLinks.ncnuLine',
            icon: faCheckCircle,
            url: 'https://line.me/R/ti/p/@445dvnmk',
            color: '#00695C'
        },
        {
            id: 'course',
            nameKey: 'quickLinks.courseQuery',
            icon: faBook,
            url: 'https://coursemap.ncnu.edu.tw/index.php',
            color: '#1976D2'
        },
        {
            id: 'library',
            nameKey: 'quickLinks.library',
            icon: faBuilding,
            url: 'https://www.lib.ncnu.edu.tw/index.php/tw/',
            color: '#7B1FA2'
        },
        {
            id: 'mail',
            nameKey: 'quickLinks.email',
            icon: faEnvelope,
            url: 'https://cc.ncnu.edu.tw/p/404-1001-6149.php?Lang=zh-tw',
            color: '#D32F2F'
        }
    ];

    // 檢查滾動位置並更新箭頭顯示狀態
    const checkScrollPosition = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        const scrollEl = scrollRef.current;
        if (scrollEl) {
            checkScrollPosition();
            scrollEl.addEventListener('scroll', checkScrollPosition);
            window.addEventListener('resize', checkScrollPosition);
        }
        return () => {
            if (scrollEl) {
                scrollEl.removeEventListener('scroll', checkScrollPosition);
            }
            window.removeEventListener('resize', checkScrollPosition);
        };
    }, []);

    // 點擊箭頭滾動
    const scroll = (direction) => {
        if (!scrollRef.current) return;
        const scrollAmount = 200;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    const handleLinkClick = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="quick-links-wrapper">
            {/* 左箭頭 */}
            {showLeftArrow && (
                <button
                    className="quick-links-arrow left"
                    onClick={() => scroll('left')}
                    aria-label="向左滾動"
                >
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>
            )}

            {/* 按鈕列 */}
            <div className="quick-links-horizontal" ref={scrollRef}>
                {quickLinksData.map((link) => (
                    <button
                        key={link.id}
                        className="quick-link-btn"
                        onClick={() => handleLinkClick(link.url)}
                        style={{ '--link-color': link.color }}
                    >
                        <span
                            className="quick-link-icon"
                            style={{ backgroundColor: `${link.color}20`, color: link.color }}
                        >
                            <FontAwesomeIcon icon={link.icon} />
                        </span>
                        <span className="quick-link-label">{t(link.nameKey)}</span>
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="quick-link-external" />
                    </button>
                ))}
            </div>

            {/* 右箭頭 */}
            {showRightArrow && (
                <button
                    className="quick-links-arrow right"
                    onClick={() => scroll('right')}
                    aria-label="向右滾動"
                >
                    <FontAwesomeIcon icon={faChevronRight} />
                </button>
            )}
        </div>
    );
};

export default QuickLinks;
