/**
 * AdminAnnouncements.jsx - 管理員公告管理頁面
 * 提供管理員編輯、新增、刪除首頁公告的介面
 * 與 AnnouncementCard.jsx 和 AnnouncementButton.jsx 完全相容
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../AuthContext.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBullhorn,
    faPlus,
    faEdit,
    faTrash,
    faToggleOn,
    faToggleOff,
    faFire,
    faComment,
    faImage,
    faLink,
    faVideo,
    faMousePointer,
    faXmark,
    faSave,
    faEye,
    faEyeSlash,
    faChevronDown,
    faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import './AdminAnnouncements.css';

// API 基礎路徑
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// 管理員 email 列表（從環境變數讀取）
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim());

const AdminAnnouncements = () => {
    const { t } = useTranslation();
    const { user, isLoggedIn } = useAuth();
    const isAdmin = isLoggedIn && user?.email && ADMIN_EMAILS.includes(user.email);

    // 公告列表
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // 編輯狀態
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [expandedItems, setExpandedItems] = useState(new Set());

    // 表單資料
    const [formData, setFormData] = useState({
        title: '',
        priority: 'normal',
        content: '',
        images: [],
        embeds: [],
        buttons: [],
        is_active: true
    });

    // 預覽模式
    const [showPreview, setShowPreview] = useState(false);

    // 取得公告列表
    const fetchAnnouncements = useCallback(async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/announcements/admin`);
            if (response.ok) {
                const data = await response.json();
                setAnnouncements(data);
            }
        } catch (err) {
            console.error('Error fetching announcements:', err);
            setError('無法載入公告列表');
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    // 重設表單
    const resetForm = () => {
        setFormData({
            title: '',
            priority: 'normal',
            content: '',
            images: [],
            embeds: [],
            buttons: [],
            is_active: true
        });
        setIsEditing(false);
        setEditingId(null);
        setShowPreview(false);
    };

    // 開啟編輯
    const openEdit = (announcement) => {
        setFormData({
            title: announcement.title || '',
            priority: announcement.priority || 'normal',
            content: announcement.content || '',
            images: announcement.images || [],
            embeds: announcement.embeds || [],
            buttons: announcement.buttons || [],
            is_active: announcement.is_active !== false
        });
        setEditingId(announcement.id);
        setIsEditing(true);
    };

    // 儲存公告
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            setError('請輸入公告標題');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const url = editingId
                ? `${API_BASE}/api/announcements/${editingId}`
                : `${API_BASE}/api/announcements`;

            const response = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    date: new Date().toISOString().split('T')[0]
                })
            });

            if (!response.ok) throw new Error('儲存失敗');

            setSuccess(editingId ? '公告更新成功！' : '公告新增成功！');
            resetForm();
            fetchAnnouncements();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 刪除公告
    const handleDelete = async (id) => {
        if (!window.confirm('確定要刪除這則公告嗎？')) return;

        try {
            const response = await fetch(`${API_BASE}/api/announcements/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setAnnouncements(prev => prev.filter(a => a.id !== id));
                setSuccess('公告已刪除');
            }
        } catch (err) {
            setError('刪除失敗');
        }
    };

    // 切換啟用狀態
    const handleToggle = async (id) => {
        try {
            const response = await fetch(`${API_BASE}/api/announcements/${id}/toggle`, {
                method: 'PUT'
            });
            if (response.ok) {
                const data = await response.json();
                setAnnouncements(prev => prev.map(a =>
                    a.id === id ? { ...a, is_active: data.is_active } : a
                ));
            }
        } catch (err) {
            setError('切換狀態失敗');
        }
    };

    // 新增按鈕
    const addButton = () => {
        const text = prompt('請輸入按鈕文字:');
        if (!text) return;
        const url = prompt('請輸入按鈕連結:');
        if (!url) return;
        const style = prompt('請選擇樣式 (primary/secondary/success/warning/danger):', 'success') || 'success';
        const icon = prompt('請輸入圖示 (例如: 💬, 📰):', '💬') || '💬';
        const external = window.confirm('是否為外部連結？');

        setFormData(prev => ({
            ...prev,
            buttons: [...prev.buttons, { text, url, style, icon, external }]
        }));
    };

    // 移除按鈕
    const removeButton = (index) => {
        setFormData(prev => ({
            ...prev,
            buttons: prev.buttons.filter((_, i) => i !== index)
        }));
    };

    // 新增嵌入連結
    const addEmbed = () => {
        const type = prompt('請選擇類型 (link/youtube):', 'link') || 'link';
        const url = prompt('請輸入網址:');
        if (!url) return;
        const title = prompt('請輸入標題:') || url;
        const description = type === 'link' ? (prompt('請輸入描述:') || '') : '';

        const embed = { type, url, title };
        if (type === 'link') embed.description = description;
        if (type === 'youtube') {
            const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
            embed.id = match ? match[1] : '';
        }

        setFormData(prev => ({
            ...prev,
            embeds: [...prev.embeds, embed]
        }));
    };

    // 移除嵌入
    const removeEmbed = (index) => {
        setFormData(prev => ({
            ...prev,
            embeds: prev.embeds.filter((_, i) => i !== index)
        }));
    };

    // 新增圖片
    const addImage = () => {
        const src = prompt('請輸入圖片網址:');
        if (!src) return;
        const alt = prompt('請輸入圖片替代文字:', 'image') || 'image';
        const caption = prompt('請輸入圖片說明:') || '';

        setFormData(prev => ({
            ...prev,
            images: [...prev.images, { src, alt, caption }]
        }));
    };

    // 移除圖片
    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    // 展開/收合
    const toggleExpand = (id) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // 優先級配置
    const getPriorityConfig = (priority) => {
        switch (priority) {
            case 'high':
                return { icon: faFire, color: '#ef4444', label: '高優先級', bgColor: 'rgba(239, 68, 68, 0.15)' };
            case 'normal':
                return { icon: faBullhorn, color: '#3b82f6', label: '一般', bgColor: 'rgba(59, 130, 246, 0.15)' };
            case 'low':
                return { icon: faComment, color: '#6b7280', label: '低優先級', bgColor: 'rgba(107, 114, 128, 0.15)' };
            default:
                return { icon: faBullhorn, color: '#3b82f6', label: '一般', bgColor: 'rgba(59, 130, 246, 0.15)' };
        }
    };

    // 權限檢查
    if (!isLoggedIn) {
        return (
            <div className="admin-announcements unauthorized">
                <FontAwesomeIcon icon={faXmark} className="error-icon" />
                <h2>請先登入</h2>
                <p>您需要登入才能存取此頁面。</p>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="admin-announcements unauthorized">
                <FontAwesomeIcon icon={faXmark} className="error-icon" />
                <h2>權限不足</h2>
                <p>您沒有權限存取管理員頁面。</p>
                <p className="hint">請確認您的 email ({user?.email}) 已加入 VITE_ADMIN_EMAILS 環境變數。</p>
            </div>
        );
    }

    return (
        <div className="admin-announcements">
            <header className="admin-header">
                <div className="header-content">
                    <FontAwesomeIcon icon={faBullhorn} className="header-icon" />
                    <h1>公告管理</h1>
                </div>
                <p className="admin-email">管理員：{user?.email}</p>
            </header>

            <div className="admin-content">
                {/* 新增/編輯表單 */}
                <section className="announcement-form-section">
                    <div className="section-header-row">
                        <h2>
                            <FontAwesomeIcon icon={isEditing ? faEdit : faPlus} />
                            {isEditing ? '編輯公告' : '新增公告'}
                        </h2>
                        {isEditing && (
                            <button className="cancel-btn" onClick={resetForm}>
                                <FontAwesomeIcon icon={faXmark} /> 取消編輯
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="announcement-form">
                        {/* 標題 */}
                        <div className="form-group">
                            <label htmlFor="title">標題 *</label>
                            <input
                                id="title"
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="輸入公告標題"
                                required
                            />
                        </div>

                        {/* 優先級 */}
                        <div className="form-group">
                            <label>優先級</label>
                            <div className="priority-selector">
                                {['high', 'normal', 'low'].map(p => {
                                    const config = getPriorityConfig(p);
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            className={`priority-btn ${formData.priority === p ? 'active' : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                                            style={{ '--priority-color': config.color }}
                                        >
                                            <FontAwesomeIcon icon={config.icon} />
                                            <span>{config.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 內容 */}
                        <div className="form-group">
                            <label htmlFor="content">內容（支援 Markdown 與 HTML）</label>
                            <textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="輸入公告內容..."
                                rows={6}
                            />
                        </div>

                        {/* 多媒體區域 */}
                        <div className="media-section">
                            <label>多媒體內容</label>
                            <div className="media-actions">
                                <button type="button" className="media-btn image" onClick={addImage}>
                                    <FontAwesomeIcon icon={faImage} /> 圖片
                                </button>
                                <button type="button" className="media-btn embed" onClick={addEmbed}>
                                    <FontAwesomeIcon icon={faLink} /> 連結/影片
                                </button>
                                <button type="button" className="media-btn button" onClick={addButton}>
                                    <FontAwesomeIcon icon={faMousePointer} /> 按鈕
                                </button>
                            </div>

                            {/* 已新增的多媒體 */}
                            <div className="media-list">
                                {formData.images.map((img, i) => (
                                    <div key={`img-${i}`} className="media-item">
                                        <span>🖼️ {img.alt}</span>
                                        <button type="button" onClick={() => removeImage(i)}>
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                ))}
                                {formData.embeds.map((embed, i) => (
                                    <div key={`embed-${i}`} className="media-item">
                                        <span>{embed.type === 'youtube' ? '🎥' : '🔗'} {embed.title}</span>
                                        <button type="button" onClick={() => removeEmbed(i)}>
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                ))}
                                {formData.buttons.map((btn, i) => (
                                    <div key={`btn-${i}`} className="media-item">
                                        <span>🔘 {btn.icon} {btn.text}</span>
                                        <button type="button" onClick={() => removeButton(i)}>
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 啟用狀態 */}
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                />
                                <FontAwesomeIcon icon={formData.is_active ? faEye : faEyeSlash} />
                                <span>{formData.is_active ? '公開顯示' : '隱藏中'}</span>
                            </label>
                        </div>

                        {/* 錯誤/成功訊息 */}
                        {error && <div className="message error">{error}</div>}
                        {success && <div className="message success">{success}</div>}

                        {/* 送出 */}
                        <div className="form-actions">
                            <button type="button" className="preview-btn" onClick={() => setShowPreview(!showPreview)}>
                                <FontAwesomeIcon icon={faEye} /> {showPreview ? '隱藏預覽' : '預覽'}
                            </button>
                            <button type="submit" className="submit-btn" disabled={loading}>
                                <FontAwesomeIcon icon={faSave} />
                                {loading ? '儲存中...' : (isEditing ? '更新公告' : '新增公告')}
                            </button>
                        </div>
                    </form>

                    {/* 預覽區 */}
                    {showPreview && (
                        <div className="preview-section">
                            <h3>預覽</h3>
                            <div className="preview-card">
                                <div className="preview-header">
                                    <span className="preview-priority" style={{ color: getPriorityConfig(formData.priority).color }}>
                                        <FontAwesomeIcon icon={getPriorityConfig(formData.priority).icon} />
                                        {getPriorityConfig(formData.priority).label}
                                    </span>
                                </div>
                                <h4>{formData.title || '(無標題)'}</h4>
                                <div className="preview-content">
                                    {formData.content.trim().startsWith('<iframe') ? (
                                        <div dangerouslySetInnerHTML={{ __html: formData.content }} />
                                    ) : (
                                        <p style={{ whiteSpace: 'pre-wrap' }}>{formData.content}</p>
                                    )}
                                </div>
                                {formData.buttons.length > 0 && (
                                    <div className="preview-buttons">
                                        {formData.buttons.map((btn, i) => (
                                            <span key={i} className={`preview-btn-tag btn-${btn.style}`}>
                                                {btn.icon} {btn.text}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* 公告列表 */}
                <section className="announcements-list-section">
                    <h2>
                        <FontAwesomeIcon icon={faBullhorn} />
                        所有公告 ({announcements.length})
                    </h2>

                    <div className="announcements-list">
                        {loading && announcements.length === 0 ? (
                            <div className="empty-state">載入中...</div>
                        ) : announcements.length === 0 ? (
                            <div className="empty-state">
                                <FontAwesomeIcon icon={faBullhorn} />
                                <p>尚無公告</p>
                            </div>
                        ) : (
                            announcements.map(announcement => {
                                const priority = getPriorityConfig(announcement.priority);
                                const isExpanded = expandedItems.has(announcement.id);

                                return (
                                    <div
                                        key={announcement.id}
                                        className={`announcement-card ${!announcement.is_active ? 'inactive' : ''}`}
                                    >
                                        <div className="card-header" onClick={() => toggleExpand(announcement.id)}>
                                            <div className="card-info">
                                                <span
                                                    className="priority-badge"
                                                    style={{ backgroundColor: priority.bgColor, color: priority.color }}
                                                >
                                                    <FontAwesomeIcon icon={priority.icon} />
                                                </span>
                                                <div className="card-title-area">
                                                    <h3>{announcement.title}</h3>
                                                    <span className="card-meta">
                                                        {announcement.date}
                                                        {!announcement.is_active && ' • 已隱藏'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="card-actions">
                                                <button
                                                    className={`toggle-btn ${announcement.is_active ? 'active' : ''}`}
                                                    onClick={(e) => { e.stopPropagation(); handleToggle(announcement.id); }}
                                                    title={announcement.is_active ? '點擊隱藏' : '點擊顯示'}
                                                >
                                                    <FontAwesomeIcon icon={announcement.is_active ? faToggleOn : faToggleOff} />
                                                </button>
                                                <button
                                                    className="edit-btn"
                                                    onClick={(e) => { e.stopPropagation(); openEdit(announcement); }}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(announcement.id); }}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                                <FontAwesomeIcon
                                                    icon={isExpanded ? faChevronUp : faChevronDown}
                                                    className="expand-icon"
                                                />
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="card-body">
                                                <div className="card-content">
                                                    {announcement.content?.trim().startsWith('<iframe') ? (
                                                        <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
                                                    ) : (
                                                        <p style={{ whiteSpace: 'pre-wrap' }}>{announcement.content}</p>
                                                    )}
                                                </div>
                                                {announcement.buttons?.length > 0 && (
                                                    <div className="card-buttons">
                                                        {announcement.buttons.map((btn, i) => (
                                                            <span key={i} className="button-tag">
                                                                {btn.icon} {btn.text}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {announcement.embeds?.length > 0 && (
                                                    <div className="card-embeds">
                                                        {announcement.embeds.map((embed, i) => (
                                                            <span key={i} className="embed-tag">
                                                                {embed.type === 'youtube' ? '🎥' : '🔗'} {embed.title}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AdminAnnouncements;
