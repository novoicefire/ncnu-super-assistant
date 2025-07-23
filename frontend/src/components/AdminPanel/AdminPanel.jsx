// frontend/src/components/AdminPanel/AdminPanel.jsx (完整版 - 包含登出重定向)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { Navigate, useNavigate } from 'react-router-dom';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const navigate = useNavigate(); // 🎯 導航 Hook
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'article', // article, ad, announcement
    isVisible: true
  });

  // 🎯 監聽用戶狀態變化，登出時自動跳轉到首頁
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('🔄 用戶已登出，自動跳轉至首頁');
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  // 🔐 權限檢查
  if (isLoading) {
    return <div className="loading">⏳ 載入中...</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // 載入現有貼文
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const savedPosts = localStorage.getItem('adminPosts');
      if (savedPosts) {
        setPosts(JSON.parse(savedPosts));
      }
    } catch (error) {
      console.error('載入貼文失敗:', error);
    }
  };

  const savePosts = (updatedPosts) => {
    localStorage.setItem('adminPosts', JSON.stringify(updatedPosts));
    setPosts(updatedPosts);
  };

  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('請填入標題和內容');
      return;
    }

    const post = {
      id: Date.now(),
      ...newPost,
      createdAt: new Date().toISOString(),
      author: user.full_name
    };

    const updatedPosts = [post, ...posts];
    savePosts(updatedPosts);
    
    setNewPost({ title: '', content: '', type: 'article', isVisible: true });
    setIsEditing(false);
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setNewPost({
      title: post.title,
      content: post.content,
      type: post.type,
      isVisible: post.isVisible
    });
    setIsEditing(true);
  };

  const handleUpdatePost = () => {
    const updatedPosts = posts.map(post => 
      post.id === editingPost.id 
        ? { ...post, ...newPost, updatedAt: new Date().toISOString() }
        : post
    );
    
    savePosts(updatedPosts);
    setEditingPost(null);
    setNewPost({ title: '', content: '', type: 'article', isVisible: true });
    setIsEditing(false);
  };

  const handleDeletePost = (postId) => {
    if (confirm('確定要刪除這篇貼文嗎？')) {
      const updatedPosts = posts.filter(post => post.id !== postId);
      savePosts(updatedPosts);
    }
  };

  const togglePostVisibility = (postId) => {
    const updatedPosts = posts.map(post =>
      post.id === postId ? { ...post, isVisible: !post.isVisible } : post
    );
    savePosts(updatedPosts);
  };

  // 🎯 自定義管理員登出函數
  const handleAdminLogout = () => {
    if (confirm('確定要登出管理員帳號嗎？登出後將自動跳轉到首頁。')) {
      console.log('🔓 管理員正在登出...');
      logout(); // 這會觸發 useEffect 中的重定向邏輯
    }
  };

  return (
    <div className="admin-panel">
      {/* 🎯 管理員標頭區域 - 包含登出按鈕 */}
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>📝 管理員專區</h1>
          <p>歡迎，<strong>{user.full_name}</strong>！您可以在此管理網站內容。</p>
        </div>
        
        {/* 🎯 管理員專用登出按鈕 */}
        <button className="admin-logout-btn btn" onClick={handleAdminLogout}>
          🔓 安全登出
        </button>
      </div>

      {/* 貼文編輯器 */}
      <div className="post-editor card">
        <h2>{editingPost ? '✏️ 編輯貼文' : '✨ 新增貼文'}</h2>
        
        <div className="form-group">
          <label>📂 貼文類型</label>
          <select 
            className="input"
            value={newPost.type}
            onChange={(e) => setNewPost({...newPost, type: e.target.value})}
          >
            <option value="article">📄 文章</option>
            <option value="ad">📢 廣告</option>
            <option value="announcement">📣 公告</option>
          </select>
        </div>

        <div className="form-group">
          <label>📝 標題</label>
          <input
            type="text"
            className="input"
            value={newPost.title}
            onChange={(e) => setNewPost({...newPost, title: e.target.value})}
            placeholder="輸入貼文標題..."
          />
        </div>

        <div className="form-group">
          <label>📄 內容</label>
          <textarea
            className="content-editor"
            value={newPost.content}
            onChange={(e) => setNewPost({...newPost, content: e.target.value})}
            placeholder="輸入貼文內容... 

💡 支援 HTML 標籤：
• <strong>粗體文字</strong>
• <em>斜體文字</em>
• <a href='網址'>連結文字</a>
• <br> 換行
• <ul><li>項目列表</li></ul>"
            rows={10}
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={newPost.isVisible}
              onChange={(e) => setNewPost({...newPost, isVisible: e.target.checked})}
            />
            <span className="checkbox-text">👁️ 立即顯示給訪客</span>
          </label>
        </div>

        <div className="editor-actions">
          {editingPost ? (
            <>
              <button className="btn btn-primary" onClick={handleUpdatePost}>
                💾 更新貼文
              </button>
              <button className="btn" onClick={() => {
                setEditingPost(null);
                setNewPost({ title: '', content: '', type: 'article', isVisible: true });
                setIsEditing(false);
              }}>
                ❌ 取消編輯
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleCreatePost}>
              🚀 發布貼文
            </button>
          )}
        </div>
      </div>

      {/* 貼文列表 */}
      <div className="posts-list">
        <h2>📋 已發布貼文 ({posts.length})</h2>
        
        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>還沒有任何貼文</h3>
            <p>開始創建第一篇貼文，分享有趣的內容給訪客吧！</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map(post => (
              <div key={post.id} className={`post-item card ${!post.isVisible ? 'hidden-post' : ''}`}>
                
                {/* 貼文標頭 */}
                <div className="post-header">
                  <div className="post-meta">
                    <span className={`post-type type-${post.type}`}>
                      {post.type === 'article' && '📄 文章'}
                      {post.type === 'ad' && '📢 廣告'}  
                      {post.type === 'announcement' && '📣 公告'}
                    </span>
                    <span className={`post-status ${post.isVisible ? 'visible' : 'hidden'}`}>
                      {post.isVisible ? '👁️ 顯示中' : '🔒 已隱藏'}
                    </span>
                  </div>
                  
                  <div className="post-actions">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => togglePostVisibility(post.id)}
                      title={post.isVisible ? '隱藏貼文' : '顯示貼文'}
                    >
                      {post.isVisible ? '👁️‍🗨️' : '👁️'}
                    </button>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleEditPost(post)}
                      title="編輯貼文"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn btn-sm btn-error"
                      onClick={() => handleDeletePost(post.id)}
                      title="刪除貼文"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* 貼文內容 */}
                <h3 className="post-title">{post.title}</h3>
                <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />
                
                {/* 貼文資訊 */}
                <div className="post-footer">
                  <span className="post-author">👤 {post.author}</span>
                  <span className="post-date">📅 {new Date(post.createdAt).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                  {post.updatedAt && (
                    <span className="post-updated">✏️ 最後編輯：{new Date(post.updatedAt).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
// 注意：這個檔案包含了完整的管理員面板功能，包括登出重定向和貼文管理功能。
// 確保在使用前已經正確設置 AuthContext 和相關路由。
// 這樣可以確保管理員在登出後自動跳轉到首頁。 