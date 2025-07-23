// frontend/src/components/PostsPage/PostsPage.jsx (完全反檢測版本)
import React, { useState, useEffect } from 'react';
import './PostsPage.css';

const PostsPage = () => {
  const [allPosts, setAllPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [displayPosts, setDisplayPosts] = useState([]);
  
  // 篩選和控制狀態
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(6);
  const [isLoading, setIsLoading] = useState(true);

  // 載入貼文資料
  useEffect(() => {
    loadPosts();
  }, []);

  // 篩選和搜尋功能
  useEffect(() => {
    let filtered = [...allPosts];

    // 類型篩選（對所有類型生效，但特殊內容永遠顯示）
    if (selectedType !== 'all') {
      // 保留特殊內容，只篩選指定類型的普通內容
      const regularFiltered = allPosts.filter(post => 
        post.type === selectedType || post.type === 'ad'
      );
      filtered = regularFiltered;
    }

    // 搜尋篩選（特殊內容不受影響）
    if (searchTerm.trim()) {
      const searchFiltered = filtered.filter(post =>
        post.type === 'ad' || // 特殊內容永遠顯示
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      filtered = searchFiltered;
    }

    // 排序（統一排序，特殊內容自然穿插）
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title':
          return a.title.localeCompare(b.title, 'zh-TW');
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredPosts(filtered);
    setCurrentPage(1);
  }, [allPosts, selectedType, searchTerm, sortBy]);

  // 分頁處理
  useEffect(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
    
    // 為每個項目添加渲染標記
    const postsWithMeta = paginatedPosts.map((post, index) => ({
      ...post,
      renderKey: `post-${post.id}-${currentPage}-${index}`,
      isPremium: post.type === 'ad' // 標記特殊內容
    }));
    
    setDisplayPosts(postsWithMeta);
  }, [filteredPosts, currentPage, postsPerPage]);

  const loadPosts = async () => {
    try {
      const savedPosts = localStorage.getItem('adminPosts');
      if (savedPosts) {
        const posts = JSON.parse(savedPosts);
        const visiblePosts = posts.filter(post => post.isVisible);
        setAllPosts(visiblePosts);
      }
    } catch (error) {
      console.error('載入貼文失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeDisplayName = (type) => {
    const typeMap = {
      article: '📄 文章',
      announcement: '📣 公告'
    };
    return typeMap[type] || type;
  };

  const getTypeCount = (type) => {
    if (type === 'all') {
      return allPosts.filter(post => post.type !== 'ad').length;
    }
    return allPosts.filter(post => post.type === type).length;
  };

  // 分頁邏輯
  const totalPages = Math.ceil(Math.max(1, filteredPosts.length) / postsPerPage);

  if (isLoading) {
    return (
      <div className="posts-page-loading">
        <div className="loading-spinner"></div>
        <p>載入內容中...</p>
      </div>
    );
  }

  return (
    <div className="posts-page">
      {/* 頁面標頭 */}
      <div className="posts-header">
        <h1>📰 最新資訊</h1>
        <p>探索最新的文章、公告和精選內容</p>
        <div className="posts-summary">
          <span>📄 {getTypeCount('article')} 篇文章</span>
          <span>📣 {getTypeCount('announcement')} 則公告</span>
        </div>
      </div>

      {/* 搜尋和篩選工具 */}
      <div className="posts-controls">
        <div className="controls-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 搜尋內容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="sort-box">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">⏰ 最新發布</option>
              <option value="oldest">🕐 最早發布</option>
              <option value="title">🔠 標題排序</option>
            </select>
          </div>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${selectedType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            📋 全部內容 ({getTypeCount('all')})
          </button>
          <button
            className={`filter-tab ${selectedType === 'article' ? 'active' : ''}`}
            onClick={() => setSelectedType('article')}
          >
            📄 文章 ({getTypeCount('article')})
          </button>
          <button
            className={`filter-tab ${selectedType === 'announcement' ? 'active' : ''}`}
            onClick={() => setSelectedType('announcement')}
          >
            📣 公告 ({getTypeCount('announcement')})
          </button>
        </div>
      </div>

      {/* 貼文列表 */}
      <div className="posts-container">
        {displayPosts.length === 0 ? (
          <div className="no-posts">
            {searchTerm ? (
              <>
                <div className="no-posts-icon">🔍</div>
                <h3>找不到相關內容</h3>
                <p>嘗試使用其他關鍵字或清除搜尋條件</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setSearchTerm('')}
                >
                  清除搜尋
                </button>
              </>
            ) : (
              <>
                <div className="no-posts-icon">📝</div>
                <h3>暫無內容</h3>
                <p>目前沒有{selectedType === 'all' ? '' : getTypeDisplayName(selectedType)}可顯示</p>
              </>
            )}
          </div>
        ) : (
          <div className="content-grid">
            {displayPosts.map((post, index) => (
              <article 
                key={post.renderKey} 
                className={`content-card content-${post.type} ${post.isPremium ? 'premium-content' : ''}`}
              >
                {/* 特殊內容標記 */}
                {post.isPremium && (
                  <div className="premium-badge">
                    <span>⭐ 推薦</span>
                  </div>
                )}

                {/* 內容標頭 */}
                <div className="content-header">
                  <span className={`content-label label-${post.type}`}>
                    {post.type === 'article' && '📄 文章'}
                    {post.type === 'announcement' && '📣 公告'}
                    {post.type === 'ad' && '⭐ 推薦內容'}
                  </span>
                  <span className="content-date">
                    📅 {new Date(post.createdAt).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {/* 內容主體 */}
                <div className="content-body">
                  <h2 className="content-title">{post.title}</h2>
                  <div 
                    className="content-text"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>

                {/* 內容頁腳 */}
                <div className="content-footer">
                  <span className="content-author">👤 {post.author}</span>
                  {post.updatedAt && (
                    <span className="content-updated">
                      ✏️ {new Date(post.updatedAt).toLocaleDateString('zh-TW')}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* 分頁控制 */}
      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            第 {currentPage} 頁，共 {totalPages} 頁
            （共 {filteredPosts.length} 項內容）
          </div>
          
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              ⬅️ 上一頁
            </button>

            {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              下一頁 ➡️
            </button>
          </div>
        </div>
      )}

      {/* 統計資訊 */}
      <div className="posts-stats">
        <p>
          {searchTerm 
            ? `🔍 搜尋「${searchTerm}」：找到 ${filteredPosts.length} 篇相關內容`
            : `📊 ${selectedType === 'all' ? '全部內容' : getTypeDisplayName(selectedType)}：共 ${getTypeCount(selectedType)} 項`
          }
        </p>
      </div>
    </div>
  );
};

export default PostsPage;
