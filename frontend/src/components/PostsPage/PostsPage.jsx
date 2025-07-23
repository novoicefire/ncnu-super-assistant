// frontend/src/components/PostsPage/PostsPage.jsx (修復廣告顯示 - 不使用推薦詞彙)
import React, { useState, useEffect } from 'react';
import './PostsPage.css';

const PostsPage = () => {
  const [allPosts, setAllPosts] = useState([]);
  const [adPosts, setAdPosts] = useState([]);
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
    setCurrentPage(1);
  }, [contentPosts, selectedType, searchTerm, sortBy]);

  // 🔧 修復：分頁和廣告插入邏輯
  useEffect(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const paginatedContent = filteredPosts.slice(startIndex, endIndex);
    
    // 🎯 確保廣告永遠顯示 - 修復插入邏輯
    const mixedPosts = insertAdsIntoPosts(paginatedContent, adPosts);
    setDisplayPosts(mixedPosts);
    
    // 🔧 調試：檢查廣告是否正確插入
    console.log('廣告數量:', adPosts.length);
    console.log('內容數量:', paginatedContent.length);
    console.log('最終顯示數量:', mixedPosts.length);
    console.log('包含廣告的項目:', mixedPosts.filter(post => post.isAd));
  }, [filteredPosts, currentPage, adPosts, postsPerPage]);

  const loadPosts = async () => {
    try {
      const savedPosts = localStorage.getItem('adminPosts');
      if (savedPosts) {
        const posts = JSON.parse(savedPosts);
        const visiblePosts = posts.filter(post => post.isVisible);
        
        // 🔧 確保廣告和內容正確分離
        const ads = visiblePosts.filter(post => post.type === 'ad');
        const content = visiblePosts.filter(post => post.type !== 'ad');
        
        console.log('載入的廣告:', ads);
        console.log('載入的內容:', content);
        
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

  // 🔧 修復：廣告穿插邏輯
  const insertAdsIntoPosts = (contentPosts, ads) => {
    console.log('插入廣告函數 - 內容:', contentPosts.length, '廣告:', ads.length);
    
    if (ads.length === 0) {
      console.log('沒有廣告，返回純內容');
      return contentPosts;
    }
    
    const result = [];
    
    // 🔧 修復：即使沒有內容也要顯示廣告
    if (contentPosts.length === 0) {
      console.log('沒有內容，只顯示廣告');
      return ads.map(ad => ({ ...ad, isAd: true }));
    }
    
    // 計算插入間隔
    const adInterval = Math.max(1, Math.floor(contentPosts.length / ads.length)) || 1;
    console.log('廣告插入間隔:', adInterval);
    
    // 插入內容和廣告
    contentPosts.forEach((post, index) => {
      result.push(post);
      
      // 每隔一定數量插入廣告
      const adIndex = Math.floor(index / adInterval);
      if ((index + 1) % adInterval === 0 && ads[adIndex]) {
        console.log(`在位置 ${index + 1} 插入廣告:`, ads[adIndex].title);
        result.push({
          ...ads[adIndex],
          isAd: true,
          uniqueKey: `ad-${ads[adIndex].id}-${index}` // 🔧 添加唯一鍵
        });
      }
    });
    
    // 🔧 確保所有廣告都被插入
    const insertedAdCount = result.filter(item => item.isAd).length;
    if (insertedAdCount < ads.length) {
      const remainingAds = ads.slice(insertedAdCount);
      remainingAds.forEach((ad, index) => {
        console.log('追加剩餘廣告:', ad.title);
        result.push({
          ...ad,
          isAd: true,
          uniqueKey: `ad-remaining-${ad.id}-${index}`
        });
      });
    }
    
    console.log('最終結果:', result.length, '項，其中廣告:', result.filter(r => r.isAd).length);
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
      {/* 頁面標頭 - 不顯示廣告數量 */}
      <div className="posts-header">
        <h1>📰 最新資訊</h1>
        <p>探索最新的文章、公告和相關資訊</p>
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
                className={`post-card post-${post.type} ${post.isAd ? 'ad-post' : ''}`} // 🔧 修復：改回 ad-post
              >
                {/* 🔧 修復：廣告標記但不使用推薦詞彙 */}
                {post.isAd && (
                  <div className="ad-banner"> {/* 🔧 修復：改回原來的類名 */}
                    <span>✨ 精選</span> {/* 🔧 使用「精選」而非「推薦」 */}
                  </div>
                )}

                {/* 貼文標頭 */}
                <div className="post-card-header">
                  <span className={`post-badge badge-${post.type}`}>
                    {post.type === 'article' && '📄 文章'}
                    {post.type === 'announcement' && '📣 公告'}
                    {post.type === 'ad' && '✨ 精選內容'} {/* 🔧 使用「精選」 */}
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
