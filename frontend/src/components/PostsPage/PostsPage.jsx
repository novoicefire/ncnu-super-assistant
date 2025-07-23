// frontend/src/components/PostsPage/PostsPage.jsx (完整功能版 - 廣告永久顯示)
import React, { useState, useEffect } from 'react';
import './PostsPage.css';

const PostsPage = () => {
  const [allPosts, setAllPosts] = useState([]);
  const [adPosts, setAdPosts] = useState([]); // 廣告貼文單獨管理
  const [contentPosts, setContentPosts] = useState([]); // 文章和公告
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [displayPosts, setDisplayPosts] = useState([]); // 最終顯示的貼文
  
  // 篩選和控制狀態
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, title
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(6); // 每頁顯示6篇內容
  const [isLoading, setIsLoading] = useState(true);

  // 載入貼文資料
  useEffect(() => {
    loadPosts();
  }, []);

  // 篩選和搜尋功能（不影響廣告）
  useEffect(() => {
    let filtered = [...contentPosts];

    // 類型篩選（只對文章和公告生效）
    if (selectedType !== 'all') {
      filtered = filtered.filter(post => post.type === selectedType);
    }

    // 搜尋篩選（只對文章和公告生效）
    if (searchTerm.trim()) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 排序（只對文章和公告生效）
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
    setCurrentPage(1); // 重設到第一頁
  }, [contentPosts, selectedType, searchTerm, sortBy]);

  // 分頁和廣告插入邏輯
  useEffect(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const paginatedContent = filteredPosts.slice(startIndex, endIndex);
    
    // 🎯 將廣告穿插到內容中（廣告永遠顯示）
    const mixedPosts = insertAdsIntoPosts(paginatedContent, adPosts);
    setDisplayPosts(mixedPosts);
  }, [filteredPosts, currentPage, adPosts, postsPerPage]);

  const loadPosts = async () => {
    try {
      const savedPosts = localStorage.getItem('adminPosts');
      if (savedPosts) {
        const posts = JSON.parse(savedPosts);
        const visiblePosts = posts.filter(post => post.isVisible);
        
        // 🎯 分離廣告和內容
        const ads = visiblePosts.filter(post => post.type === 'ad');
        const content = visiblePosts.filter(post => post.type !== 'ad');
        
        setAllPosts(visiblePosts);
        setAdPosts(ads);
        setContentPosts(content);
      }
    } catch (error) {
      console.error('載入貼文失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 將廣告穿插到內容中的邏輯
  const insertAdsIntoPosts = (contentPosts, ads) => {
    if (ads.length === 0) return contentPosts;
    
    const result = [];
    const adInterval = Math.max(1, Math.floor(contentPosts.length / ads.length)) || 2;
    
    contentPosts.forEach((post, index) => {
      result.push(post);
      
      // 每隔一定數量的內容插入一個廣告
      if ((index + 1) % adInterval === 0 && ads[Math.floor(index / adInterval)]) {
        result.push({
          ...ads[Math.floor(index / adInterval)],
          isAd: true // 標記為廣告，方便樣式處理
        });
      }
    });
    
    // 如果還有剩餘廣告，追加到末尾
    const remainingAds = ads.slice(Math.floor(contentPosts.length / adInterval));
    remainingAds.forEach(ad => {
      result.push({ ...ad, isAd: true });
    });
    
    return result;
  };

  const getTypeDisplayName = (type) => {
    const typeMap = {
      article: '📄 文章',
      announcement: '📣 公告'
    };
    return typeMap[type] || type;
  };

  const getTypeCount = (type) => {
    if (type === 'all') return contentPosts.length;
    return contentPosts.filter(post => post.type === type).length;
  };

  // 分頁邏輯
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const pageNumbers = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

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
        <p>探索最新的文章、公告和相關資訊</p>
        <div className="posts-summary">
          <span>📄 {getTypeCount('article')} 篇文章</span>
          <span>📣 {getTypeCount('announcement')} 則公告</span>
          <span>📢 {adPosts.length} 個廣告</span>
        </div>
      </div>

      {/* 搜尋和篩選工具 */}
      <div className="posts-controls">
        <div className="controls-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 搜尋文章和公告..."
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

        {/* 🎯 廣告說明 */}
        {adPosts.length > 0 && (
          <div className="ad-notice">
            💡 <strong>注意：</strong>廣告內容會穿插顯示，不受篩選和搜尋影響
          </div>
        )}
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
          <div className="posts-grid">
            {displayPosts.map((post, index) => (
              <article 
                key={`${post.id}-${index}`} 
                className={`post-card post-${post.type} ${post.isAd ? 'ad-post' : ''}`}
              >
                {/* 🎯 廣告標記 */}
                {post.isAd && (
                  <div className="ad-banner">
                    <span>📢 廣告</span>
                  </div>
                )}

                {/* 貼文標頭 */}
                <div className="post-card-header">
                  <span className={`post-badge badge-${post.type}`}>
                    {post.type === 'article' && '📄 文章'}
                    {post.type === 'announcement' && '📣 公告'}
                    {post.type === 'ad' && '📢 廣告'}
                  </span>
                  <span className="post-date">
                    📅 {new Date(post.createdAt).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {/* 貼文內容 */}
                <div className="post-card-content">
                  <h2 className="post-title">{post.title}</h2>
                  <div 
                    className="post-excerpt"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>

                {/* 貼文頁腳 */}
                <div className="post-card-footer">
                  <span className="post-author">👤 {post.author}</span>
                  {post.updatedAt && (
                    <span className="post-updated">
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
            （內容項目 {filteredPosts.length} 個{adPosts.length > 0 ? ` + ${adPosts.length} 個廣告` : ''}）
          </div>
          
          <div className="pagination-controls">
            {/* 上一頁 */}
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              ⬅️ 上一頁
            </button>

            {/* 頁碼 */}
            {startPage > 1 && (
              <>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(1)}
                >
                  1
                </button>
                {startPage > 2 && <span className="pagination-ellipsis">...</span>}
              </>
            )}

            {pageNumbers.map(pageNum => (
              <button
                key={pageNum}
                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* 下一頁 */}
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
            : `📊 ${selectedType === 'all' ? '全部內容' : getTypeDisplayName(selectedType)}：共 ${filteredPosts.length} 項`
          }
          {adPosts.length > 0 && ` | 📢 廣告 ${adPosts.length} 個（永久顯示）`}
        </p>
      </div>
    </div>
  );
};

export default PostsPage;
