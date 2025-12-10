/**
 * AdminDashboard.jsx - 統一管理員頁面入口
 * 提供管理員各項功能的統一入口與導航
 */
import React, { useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faShieldHalved,
    faBell,
    faBullhorn,
    faChartLine,
    faGear,
    faUsers,
    faXmark
} from '@fortawesome/free-solid-svg-icons';
import AdminNotifications from './AdminNotifications.jsx';
import AdminAnnouncements from './AdminAnnouncements.jsx';
import './AdminDashboard.css';

// 管理員 email 列表
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim());

// 管理功能選單
const ADMIN_MODULES = [
    {
        id: 'notifications',
        name: '通知管理',
        icon: faBell,
        description: '發送全站通知與推播',
        component: AdminNotifications
    },
    {
        id: 'announcements',
        name: '公告管理',
        icon: faBullhorn,
        description: '編輯首頁公告內容',
        component: AdminAnnouncements
    },
    // 未來可擴展的模組
    {
        id: 'analytics',
        name: '數據分析',
        icon: faChartLine,
        description: '網站流量與使用統計',
        component: null,
        disabled: true
    },
    {
        id: 'users',
        name: '用戶管理',
        icon: faUsers,
        description: '查看與管理用戶資料',
        component: null,
        disabled: true
    },
    {
        id: 'settings',
        name: '系統設定',
        icon: faGear,
        description: '網站設定與配置',
        component: null,
        disabled: true
    }
];

const AdminDashboard = () => {
    const { user, isLoggedIn } = useAuth();
    const isAdmin = isLoggedIn && user?.email && ADMIN_EMAILS.includes(user.email);

    // 當前選中的模組
    const [activeModule, setActiveModule] = useState(null);

    // 權限檢查
    if (!isLoggedIn) {
        return (
            <div className="admin-dashboard unauthorized">
                <FontAwesomeIcon icon={faXmark} className="error-icon" />
                <h2>請先登入</h2>
                <p>您需要登入才能存取此頁面。</p>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="admin-dashboard unauthorized">
                <FontAwesomeIcon icon={faXmark} className="error-icon" />
                <h2>權限不足</h2>
                <p>您沒有權限存取管理員頁面。</p>
                <p className="hint">請確認您的 email ({user?.email}) 已加入 VITE_ADMIN_EMAILS 環境變數。</p>
            </div>
        );
    }

    // 返回主選單
    const handleBackToMenu = () => {
        setActiveModule(null);
    };

    // 如果有選中的模組，顯示該模組
    if (activeModule) {
        const ModuleComponent = activeModule.component;
        return (
            <div className="admin-dashboard">
                <div className="admin-breadcrumb">
                    <button onClick={handleBackToMenu} className="back-btn">
                        <FontAwesomeIcon icon={faShieldHalved} />
                        <span>管理中心</span>
                    </button>
                    <span className="separator">/</span>
                    <span className="current">
                        <FontAwesomeIcon icon={activeModule.icon} />
                        {activeModule.name}
                    </span>
                </div>
                <ModuleComponent />
            </div>
        );
    }

    // 主選單畫面
    return (
        <div className="admin-dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <FontAwesomeIcon icon={faShieldHalved} className="header-icon" />
                    <div>
                        <h1>管理中心</h1>
                        <p className="admin-info">管理員：{user?.email}</p>
                    </div>
                </div>
            </header>

            <div className="modules-grid">
                {ADMIN_MODULES.map(module => (
                    <button
                        key={module.id}
                        className={`module-card ${module.disabled ? 'disabled' : ''}`}
                        onClick={() => !module.disabled && setActiveModule(module)}
                        disabled={module.disabled}
                    >
                        <div className="module-icon">
                            <FontAwesomeIcon icon={module.icon} />
                        </div>
                        <div className="module-info">
                            <h3>{module.name}</h3>
                            <p>{module.description}</p>
                        </div>
                        {module.disabled && (
                            <span className="coming-soon">即將推出</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="dashboard-footer">
                <p>暨大生超級助理 管理後台 v1.0</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
