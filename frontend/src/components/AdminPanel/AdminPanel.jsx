// frontend/src/components/AdminPanel/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { Navigate } from 'react-router-dom';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'article', // article, ad, announcement
    isVisible: true
  });

  // 🔐 權限檢查
  if (isLoading) {
    return <div className="loading">載入中...</div>;
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

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>📝 管理員專區</h1>
        <p>歡迎，{user.full_name}！您可以在此管理網站內容。</p>
      </div>

      {/* 貼文編輯器 */}
      <div className="post-editor card">
        <h2>{editingPost ? '編輯貼文' : '新增貼文'}</h2>
        
        <div className="form-group">
          <label>貼文類型</label>
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
          <label>標題</label>
          <input
            type="text"
            className="input"
            value={newPost.title}
            onChange={(e) => setNewPost({...newPost, title: e.target.value})}
            placeholder="輸入貼文標題..."
          />
        </div>

        <div className="form-group">
          <label>內容</label>
          <textarea
            className="content-editor"
            value={newPost.content}
            onChange={(e) => setNewPost({...newPost, content: e.target.value})}
            placeholder="輸入貼文內容... 支援 HTML 標籤"
            rows={8}
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={newPost.isVisible}
              onChange={(e) => setNewPost({...newPost, isVisible: e.target.checked})}
            />
            立即顯示
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
                ❌ 取消
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleCreatePost}>
              ✨ 發布貼文
            </button>
          )}
        </div>
      </div>

      {/* 貼文列表 */}
      <div className="posts-list">
        <h2>📋 已發布貼文 ({posts.length})</h2>
        
        {posts.length === 0 ? (
          <div className="empty-state">
            <p>🎯 還沒有任何貼文，開始創建第一篇吧！</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className={`post-item card ${!post.isVisible ? 'hidden-post' : ''}`}>
              <div className="post-header">
                <div className="post-meta">
                  <span className={`post-type type-${post.type}`}>
                    {post.type === 'article' && '📄'}
                    {post.type === 'ad' && '📢'}  
                    {post.type === 'announcement' && '📣'}
                    {post.type}
                  </span>
                  <span className="post-status">
                    {post.isVisible ? '👁️ 顯示中' : '🔒 已隱藏'}
                  </span>
                </div>
                
                <div className="post-actions">
                  <button 
                    className="btn btn-sm"
                    onClick={() => togglePostVisibility(post.id)}
                  >
                    {post.isVisible ? '👁️‍🗨️ 隱藏' : '👁️ 顯示'}
                  </button>
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => handleEditPost(post)}
                  >
                    ✏️ 編輯
                  </button>
                  <button 
                    className="btn btn-sm btn-error"
                    onClick={() => handleDeletePost(post.id)}
                  >
                    🗑️ 刪除
                  </button>
                </div>
              </div>

              <h3>{post.title}</h3>
              <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />
              
              <div className="post-footer">
                <span>👤 {post.author}</span>
                <span>📅 {new Date(post.createdAt).toLocaleDateString('zh-TW')}</span>
                {post.updatedAt && (
                  <span>✏️ {new Date(post.updatedAt).toLocaleDateString('zh-TW')}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
