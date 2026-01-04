// frontend/src/components/DisclaimerModal.jsx
// 服務條款與免責聲明彈窗組件 - 使用統一 BottomSheet 規範
// 佈局：標題+語言切換 固定 | 條款內容 可滾動 | 按鈕 固定底部

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faCheck,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import BottomSheet from './common/BottomSheet';
import './DisclaimerModal.css';

const DisclaimerModal = ({ isVisible, onAccept, onDecline, isFirstVisit = true }) => {
  const { t, i18n } = useTranslation();
  const bottomSheetRef = React.useRef(null);

  // 處理同意按鈕（帶動畫）
  const handleAcceptAnimated = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close(() => {
        onAccept();
      });
    } else {
      onAccept();
    }
  };

  // 處理不同意按鈕
  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    } else {
      const closed = window.close();
      if (!closed) {
        window.location.href = 'about:blank';
      }
    }
  };

  // 8 個章節配置
  const sections = [
    { titleKey: 'disclaimer.section1Title', contentKey: 'disclaimer.section1Content' },
    { titleKey: 'disclaimer.section2Title', contentKey: 'disclaimer.section2Content' },
    { titleKey: 'disclaimer.section3Title', contentKey: 'disclaimer.section3Content' },
    { titleKey: 'disclaimer.section4Title', contentKey: 'disclaimer.section4Content' },
    { titleKey: 'disclaimer.section5Title', contentKey: 'disclaimer.section5Content' },
    { titleKey: 'disclaimer.section6Title', contentKey: 'disclaimer.section6Content' },
    { titleKey: 'disclaimer.section7Title', contentKey: 'disclaimer.section7Content' },
    { titleKey: 'disclaimer.section8Title', contentKey: 'disclaimer.section8Content' },
  ];

  // 語言切換元件（嵌入標題區）
  const languageSwitch = (
    <div
      className="terms-lang-switch"
      onClick={() => i18n.changeLanguage(i18n.language === 'zh-TW' ? 'en' : 'zh-TW')}
    >
      <div className={`lang-slider ${i18n.language === 'en' ? 'right' : 'left'}`}></div>
      <span className={`lang-label ${i18n.language === 'zh-TW' ? 'active' : ''}`}>🇹🇼 中文</span>
      <span className={`lang-label ${i18n.language === 'en' ? 'active' : ''}`}>🇺🇸 EN</span>
    </div>
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      isVisible={isVisible}
      onClose={isFirstVisit ? null : onAccept}
      title={t('disclaimer.title')}
      subtitle={t('disclaimer.lastUpdate')}
      headerExtra={languageSwitch}
      showCloseButton={!isFirstVisit}
      maxHeight="90vh"
      className="disclaimer-sheet"
    >
      {/* 可滾動條款內容區（帶漸層遮罩） */}
      <div className="terms-scroll-wrapper">
        <div className="terms-scrollable">
          {/* 開場白 */}
          <p className="terms-intro">{t('disclaimer.intro')}</p>

          {/* 8 個章節 */}
          {sections.map((section, index) => (
            <div key={index} className="terms-section">
              <h3 className="terms-section-title">{t(section.titleKey)}</h3>
              <p className="terms-section-content">
                {t(section.contentKey).split('\n\n').map((paragraph, pIndex, arr) => (
                  <span key={pIndex}>
                    {paragraph}
                    {pIndex < arr.length - 1 && <><br /><br /></>}
                  </span>
                ))}
              </p>
            </div>
          ))}

          {/* 聯絡資訊 */}
          <div className="terms-contact">
            <a
              href={`https://www.instagram.com/${t('disclaimer.contactInstagram')}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-link"
            >
              <FontAwesomeIcon icon={faInstagram} />
              <span>{t('disclaimer.contactInstagram')}</span>
            </a>
            <a
              href={`mailto:${t('disclaimer.contactEmail')}`}
              className="contact-link"
            >
              <FontAwesomeIcon icon={faEnvelope} />
              <span>{t('disclaimer.contactEmail')}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 固定底部區域 */}
      <div className="terms-fixed-bottom">
        {/* 紅底警語區塊 / 同意日期提示 */}
        <div className="warning-banner">
          {isFirstVisit ? (
            <p>{t('disclaimer.warningText')}</p>
          ) : (
            <p style={{ color: 'var(--theme-text-secondary, #666)' }}>
              {t('disclaimer.acceptedDate', {
                date: (() => {
                  try {
                    const dateStr = localStorage.getItem('disclaimer_accepted_date');
                    if (!dateStr) return 'Unknown Date';
                    const date = new Date(dateStr);
                    return date.toLocaleString(i18n.language, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  } catch {
                    return 'Unknown Date';
                  }
                })()
              })}
            </p>
          )}
        </div>

        {/* 雙按鈕區域 */}
        <div className="button-group">
          {isFirstVisit ? (
            <>
              <button className="decline-btn" onClick={handleDecline}>
                <FontAwesomeIcon icon={faTimes} />
                <span>{t('disclaimer.declineBtn')}</span>
              </button>
              <button className="accept-btn" onClick={handleAcceptAnimated}>
                <FontAwesomeIcon icon={faCheck} />
                <span>{t('disclaimer.acceptBtn')}</span>
              </button>
            </>
          ) : (
            <button className="close-btn" onClick={handleAcceptAnimated}>
              <FontAwesomeIcon icon={faTimes} />
              <span>{t('disclaimer.closeBtn')}</span>
            </button>
          )}
        </div>

        {/* 底部版權 */}
        <p className="disclaimer-footer-text">
          NCNU Super Assistant © 2025
        </p>
      </div>
    </BottomSheet>
  );
};

export default DisclaimerModal;
