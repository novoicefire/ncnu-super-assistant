// frontend/src/contexts/ThemeContext.jsx (增強版主題管理)
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [autoMode, setAutoMode] = useState(false);

  // 🎯 初始化主題
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedAutoMode = localStorage.getItem('autoMode') === 'true';

    if (savedAutoMode) {
      setAutoMode(true);
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
    } else if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // 🎯 監聽系統主題變化
  useEffect(() => {
    if (autoMode) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        setTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [autoMode]);

  // 🎯 應用主題到 DOM - 強化版
  useEffect(() => {
    // 設置 data-theme 屬性
    document.documentElement.setAttribute('data-theme', theme);

    // 設置 body 的 class
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';

    // 強制設置 CSS 變數到 :root (確保全域應用)
    const root = document.documentElement;

    if (theme === 'dark') {
      // 深色模式變數
      root.style.setProperty('--theme-bg-primary', '#1a1a1a');
      root.style.setProperty('--theme-bg-secondary', '#2d2d2d');
      root.style.setProperty('--theme-bg-tertiary', '#3a3a3a');
      root.style.setProperty('--theme-bg-card', '#2d2d2d');
      root.style.setProperty('--theme-bg-overlay', 'rgba(45, 45, 45, 0.9)');

      root.style.setProperty('--theme-text-primary', '#ffffff');
      root.style.setProperty('--theme-text-secondary', '#cccccc');
      root.style.setProperty('--theme-text-tertiary', '#999999');
      root.style.setProperty('--theme-text-inverse', '#1a1a1a');

      root.style.setProperty('--theme-border-primary', '#404040');
      root.style.setProperty('--theme-border-secondary', '#353535');

      root.style.setProperty('--theme-shadow-primary', '0 2px 8px rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--theme-shadow-secondary', '0 4px 16px rgba(0, 0, 0, 0.4)');
      root.style.setProperty('--theme-shadow-hover', '0 8px 24px rgba(0, 0, 0, 0.5)');
      root.style.setProperty('--theme-shadow-lg', '0 10px 40px rgba(0, 0, 0, 0.6)');
    } else {
      // 明亮模式變數
      root.style.setProperty('--theme-bg-primary', '#f4f7f6');
      root.style.setProperty('--theme-bg-secondary', '#ffffff');
      root.style.setProperty('--theme-bg-tertiary', '#e0f2f1');
      root.style.setProperty('--theme-bg-card', '#ffffff');
      root.style.setProperty('--theme-bg-overlay', 'rgba(255, 255, 255, 0.9)');

      root.style.setProperty('--theme-text-primary', '#333333');
      root.style.setProperty('--theme-text-secondary', '#666666');
      root.style.setProperty('--theme-text-tertiary', '#999999');
      root.style.setProperty('--theme-text-inverse', '#ffffff');

      root.style.setProperty('--theme-border-primary', '#e0e0e0');
      root.style.setProperty('--theme-border-secondary', '#f0f0f0');

      root.style.setProperty('--theme-shadow-primary', '0 2px 8px rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--theme-shadow-secondary', '0 4px 16px rgba(0, 0, 0, 0.15)');
      root.style.setProperty('--theme-shadow-hover', '0 8px 24px rgba(0, 0, 0, 0.2)');
      root.style.setProperty('--theme-shadow-lg', '0 10px 40px rgba(0, 0, 0, 0.15)');
    }
    // 添加過渡動畫 class
    document.body.classList.add('theme-transitioning');

    // 移除過渡動畫 class（讓後續操作不受影響）
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 300);

  }, [theme]);

  // 🎯 手動切換主題
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setAutoMode(false);
    localStorage.setItem('theme', newTheme);
    localStorage.setItem('autoMode', 'false');
  };

  // 🎯 切換自動模式
  const toggleAutoMode = () => {
    const newAutoMode = !autoMode;
    setAutoMode(newAutoMode);
    localStorage.setItem('autoMode', newAutoMode.toString());

    if (newAutoMode) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
      localStorage.removeItem('theme');
    }
  };

  const value = {
    theme,
    toggleTheme,
    autoMode,
    toggleAutoMode,
    isLight: theme === 'light',
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
