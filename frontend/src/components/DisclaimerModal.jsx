// frontend/src/components/DisclaimerModal.jsx (全面改良版)
// 現代化玻璃擬態風格 + 圖標化內容 + 動畫效果
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faSchool,
  faCheckCircle,
  faInfoCircle,
  faGlobe,
  faEnvelope,
  faShieldAlt,
  faArrowRight,
  faComment
} from '@fortawesome/free-solid-svg-icons';
import './DisclaimerModal.css';

const DisclaimerModal = ({ isVisible, onAccept }) => {
  const { t } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // 控制 body 滾動
  useEffect(() => {
    if (isVisible) {
      document.body.classList.add('disclaimer-showing');
      // 入場動畫延遲
      setTimeout(() => setIsAnimating(true), 100);
    } else {
      document.body.classList.remove('disclaimer-showing');
      setIsAnimating(false);
      setCurrentStep(0);
    }
    return () => {
      document.body.classList.remove('disclaimer-showing');
    };
  }, [isVisible]);

  // 內容項目依序出現
  useEffect(() => {
    if (isAnimating && currentStep < 4) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, currentStep]);

  if (!isVisible) return null;

  const infoItems = [
    {
      icon: faSchool,
      color: '#6366f1',
      titleKey: 'disclaimer.note1',
    },
    {
      icon: faCheckCircle,
      color: '#10b981',
      titleKey: 'disclaimer.note2',
    },
    {
      icon: faShieldAlt,
      color: '#f59e0b',
      titleKey: 'disclaimer.note3',
    },
    {
      icon: faGlobe,
      color: '#3b82f6',
      titleKey: 'disclaimer.note4',
    },
  ];

  return (
    <div className={`disclaimer-overlay-v2 ${isAnimating ? 'active' : ''}`}>
      {/* 背景裝飾 */}
      <div className="disclaimer-bg-decoration">
        <div className="bg-circle circle-1"></div>
        <div className="bg-circle circle-2"></div>
        <div className="bg-circle circle-3"></div>
      </div>

      <div className={`disclaimer-card-v2 ${isAnimating ? 'active' : ''}`}>
        {/* 頂部圖標區域 */}
        <div className="disclaimer-icon-section">
          <div className="disclaimer-icon-wrapper">
            <FontAwesomeIcon icon={faExclamationTriangle} className="disclaimer-main-icon" />
          </div>
          <div className="disclaimer-icon-pulse"></div>
        </div>

        {/* 標題區域 */}
        <div className="disclaimer-title-section">
          <h1>{t('disclaimer.title')}</h1>
          <p className="disclaimer-subtitle">{t('disclaimer.mainText')}</p>
        </div>

        {/* 信息卡片網格 */}
        <div className="disclaimer-info-grid">
          {infoItems.map((item, index) => (
            <div
              key={index}
              className={`info-card ${currentStep > index ? 'visible' : ''}`}
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              <div className="info-icon" style={{ background: `${item.color}20`, color: item.color }}>
                <FontAwesomeIcon icon={item.icon} />
              </div>
              <p>{t(item.titleKey)}</p>
            </div>
          ))}
        </div>

        {/* 聯絡資訊 */}
        <a
          href="https://www.instagram.com/ncnu_super_assistant/"
          target="_blank"
          rel="noopener noreferrer"
          className={`disclaimer-contact ${currentStep >= 4 ? 'visible' : ''}`}
        >
          <span className="contact-icon">📸</span>
          <span>{t('disclaimer.contactInfo')}</span>
          <FontAwesomeIcon icon={faArrowRight} className="arrow-icon" />
        </a>

        {/* 確認按鈕 */}
        <button
          className={`disclaimer-accept-btn-v2 ${currentStep >= 4 ? 'visible' : ''}`}
          onClick={onAccept}
        >
          <span>{t('disclaimer.acceptBtn')}</span>
          <div className="btn-shine"></div>
        </button>

        {/* 底部提示 */}
        <p className="disclaimer-footer-text">
          NCNU Super Assistant © 2025
        </p>
      </div>
    </div>
  );
};

export default DisclaimerModal;
