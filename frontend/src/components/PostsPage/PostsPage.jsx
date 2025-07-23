// frontend/src/components/PostsPage/PostsPage.jsx (反廣告攔截版本)
import React, { useState, useEffect } from 'react';
import './PostsPage.css';

const PostsPage = () => {
  const [allPosts, setAllPosts] = useState([]);
  const [specialPosts, setSpecialPosts] = useState([]); // 🔧 改名：adPosts → specialPosts
  const [contentPosts, setContentPosts] = useState([]);
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

  // 篩選和搜尋功能（不影響特色文章）
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
    setCurrentPage(1);
  }, [contentPosts, selectedType, searchTerm, sortBy]);

  // 🔧 分頁和特色文章插入邏輯
  useEffect(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const paginatedContent = filteredPosts.slice(startIndex, endIndex);
    
    // 🎯 將特色文章穿插到內容中（永遠顯示）
    const mixedPosts = insertFeaturedIntoPosts(paginatedContent, specialPosts);
    setDisplayPosts(mixedPosts);
  }, [filteredPosts, currentPage, specialPosts, postsPerPage]);

  const loadPosts = async () => {
    try {
      const savedPosts = localStorage.getItem('adminPosts');
      if (savedPosts) {
        const posts = JSON.parse(savedPosts);
        const allVisiblePosts = posts.filter(post => post.isVisible);
        
        // 🔧 將原來的廣告類型重新分類為特色文章
        const featured = posts.filter(post => post.type === 'ad'); // 依然從 'ad' 類型載入
        const content = allVisiblePosts.filter(post => post.type !== 'ad');
        
        setAllPosts(allVisiblePosts);
        setSpecialPosts(featured);
        setContentPosts(content);
      }
    } catch (error) {
      console.error('載入貼文失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔧 特色文章穿插邏輯（重新命名以避開檢測）
  const insertFeaturedIntoPosts = (contentPosts, featuredPosts) => {
    if (featuredPosts.length === 0) {
      return contentPosts;
    }
    
    const result = [];
    
    // 即使沒有內容也要顯示特色文章
    if (contentPosts.length === 0) {
      return featuredPosts.map((featured, index) => ({
        ...featured,
        isSpecial: true, // 🔧 改名：isAd → isSpecial
        uniqueKey: `featured-only-${featured.id}-${index}`
      }));
    }
    
    // 計算插入間隔
    const totalSlots = contentPosts.length + featuredPosts.length;
    const interval = Math.ceil(totalSlots / featuredPosts.length);
    
    let featuredIndex = 0;
    let nextFeaturedPosition = Math.min(interval - 1, 0);
    
    contentPosts.forEach((post, index) => {
      result.push(post);
      
      // 檢查是否應該插入特色文章
      if (index === nextFeaturedPosition && featuredIndex < featuredPosts.length) {
        const featuredToInsert = {
          ...featuredPosts[featuredIndex],
          isSpecial: true,
          uniqueKey: `featured-inserted-${featuredPosts[featuredIndex].id}-${index}`
        };
        result.push(featuredToInsert);
        
        featuredIndex++;
        nextFeaturedPosition += interval;
      }
    });
    
    // 確保所有剩餘特色文章都被添加
    while (featuredIndex < featuredPosts.length) {
      const remainingFeatured = {
        ...featuredPosts[featuredIndex],
        isSpecial: true,
        uniqueKey: `featured-remaining-${featuredPosts[featuredIndex].id}-${featuredIndex}`
      };
      result.push(remainingFeatured);
      featuredIndex++;
    }
    
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
  const totalPages = Math.ceil(Math.max(1, filteredPosts.length) / postsPerPage);
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
                key={post.uniqueKey || `${post.id}-${index}`} 
                className={`post-card post-${post.type} ${post.isSpecial ? 'featured-post' : ''}`} // 🔧 改名：ad-post → featured-post
              >
                {/* 🔧 特色標記（避開檢測詞彙） */}
                {post.isSpecial && (
                  <div className="featured-label"> {/* 🔧 改名：ad-banner → featured-label */}
                    <span>⭐ 精選</span>
                  </div>
                )}

                {/* 貼文標頭 */}
                <div className="post-card-header">
                  <span className={`post-badge badge-${post.type}`}>
                    {post.type === 'article' && '📄 文章'}
                    {post.type === 'announcement' && '📣 公告'}
                    {post.type === 'ad' && '⭐ 精選內容'} {/* 🔧 改用星星圖標 */}
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
        </p>
      </div>
    </div>
  );
};

export default PostsPage;
