// frontend/src/components/0_Dashboard/QuickLinks.jsx (常用連結卡片 + i18n)
import React, { useState } from 'react';
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
    faChevronDown,
    faChevronUp,
    faLink,
    faQrcode
} from '@fortawesome/free-solid-svg-icons';

const QuickLinks = () => {
    const { t } = useTranslation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // 使用翻譯的連結資料
    const quickLinksData = [
        {
            id: 'portal',
            nameKey: 'quickLinks.portal',
            icon: faGraduationCap,
            url: 'https://sis.ncnu.edu.tw/',
            color: '#00796B',
            descKey: 'quickLinks.portalDesc'
        },
        {
            id: 'course',
            nameKey: 'quickLinks.courseQuery',
            icon: faBook,
            url: 'https://coursemap.ncnu.edu.tw/index.php',
            color: '#1976D2',
            descKey: 'quickLinks.courseQueryDesc'
        },
        {
            id: 'ncnu-line',
            nameKey: 'quickLinks.ncnuLine',
            icon: faCheckCircle,
            url: 'https://line.me/R/ti/p/@445dvnmk',
            color: '#00695C',
            descKey: 'quickLinks.ncnuLineDesc'
        },
        {
            id: 'library',
            nameKey: 'quickLinks.library',
            icon: faBuilding,
            url: 'https://www.lib.ncnu.edu.tw/index.php/tw/',
            color: '#7B1FA2',
            descKey: 'quickLinks.libraryDesc'
        },
        {
            id: 'libraryQr',
            nameKey: 'quickLinks.libraryQr',
            icon: faQrcode,
            url: 'https://webdoor.lib.ncnu.edu.tw/',
            color: '#C62828',
            descKey: 'quickLinks.libraryQrDesc'
        },
        {
            id: 'mail',
            nameKey: 'quickLinks.email',
            icon: faEnvelope,
            url: 'https://cc.ncnu.edu.tw/p/404-1001-6149.php?Lang=zh-tw',
            color: '#D32F2F',
            descKey: 'quickLinks.emailDesc'
        },
        {
            id: 'line',
            nameKey: 'quickLinks.studentLine',
            icon: faUsers,
            url: 'https://line.me/ti/g2/ZjOqtMz4xdB_W4_hig6PCfFItPfeWYuOLlMmGA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default',
            color: '#4CAF50',
            descKey: 'quickLinks.studentLineDesc'
        }
    ];

    const handleLinkClick = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="quick-links-card">
            {/* 標題列 */}
            <div className="quick-links-header">
                <div className="header-content">
                    <div className="header-title-row">
                        <FontAwesomeIcon icon={faLink} className="header-icon" />
                        <h3>{t('quickLinks.title')}</h3>
                    </div>
                    <span className="header-subtitle">{t('quickLinks.subtitle')}</span>
                </div>
                <button
                    className="collapse-toggle modern"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? t('common.expand') : t('common.collapse')}
                >
                    <FontAwesomeIcon icon={isCollapsed ? faChevronDown : faChevronUp} />
                </button>
            </div>

            {/* 連結格子 */}
            <div className={`quick-links-content ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="links-grid">
                    {quickLinksData.map((link) => (
                        <div
                            key={link.id}
                            className="link-card"
                            onClick={() => handleLinkClick(link.url)}
                            style={{ '--link-color': link.color }}
                        >
                            <div className="link-icon" style={{ backgroundColor: `${link.color}15` }}>
                                <FontAwesomeIcon icon={link.icon} style={{ color: link.color }} />
                            </div>
                            <div className="link-info">
                                <span className="link-name">{t(link.nameKey)}</span>
                                <span className="link-desc">{t(link.descKey)}</span>
                            </div>
                            <FontAwesomeIcon icon={faExternalLinkAlt} className="external-icon" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuickLinks;
