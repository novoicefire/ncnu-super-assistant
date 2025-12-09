// frontend/src/i18n/index.js
// i18n 配置檔案
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 翻譯資源
import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';

// 從 localStorage 讀取語言設定，預設繁體中文
const savedLanguage = localStorage.getItem('language') || 'zh-TW';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            'zh-TW': { translation: zhTW },
            'en': { translation: en }
        },
        lng: savedLanguage,
        fallbackLng: 'zh-TW',
        interpolation: {
            escapeValue: false
        }
    });

// 切換語言時保存到 localStorage
i18n.on('languageChanged', (lng) => {
    localStorage.setItem('language', lng);
});

export default i18n;
