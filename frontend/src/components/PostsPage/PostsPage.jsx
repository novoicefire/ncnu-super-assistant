// frontend/src/components/PostsPage/PostsPage.jsx (修復統計篩選版)
import React, { useState, useEffect } from 'react';
import './PostsPage.css';

const PostsPage = () => {
  const [allPosts, setAllPosts] = useState([]);
  const [priorityPosts, setPriorityPosts] = useState([]);
  const [regularPosts, setRegularPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [displayPosts, setDisplayPosts] = useState([]);
  
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(6);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  // 🔧 修復：篩選和搜尋邏輯
  useEffect(() => {
    let filtered = [...regularPosts];

    // 🔧 修復：類型篩選邏輯
    if (selectedType !== 'all') {
      filtered = regularPosts.filter(post => post.type === selectedType);
    }

    // 🔧 修復：搜尋篩選邏輯
    if (searchTerm.trim()) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 排序邏輯
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
  }, [regularPosts, selectedType, searchTerm, sortBy]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const paginatedContent = filteredPosts.slice(startIndex, endIndex);
    
    const mixedPosts = blendContentStreams(paginatedContent, priorityPosts);
    setDisplayPosts(mixedPosts);
  }, [filteredPosts, currentPage, priorityPosts, postsPerPage]);

  const loadPosts = async () => {
    try {
      const savedPosts = localStorage.getItem('adminPosts');
      if (savedPosts) {
        const posts = JSON.parse(savedPosts);
        const allVisiblePosts = posts.filter(post => post.isVisible);
        
        // 🔧 修復：更準確的分類邏輯
        const priority = allVisiblePosts.filter(post => 
          post.type === 'ad' || 
          post.type === 'highlight' || 
          post.type === 'featured' ||
          (post.title && post.title.includes('問題回報')) ||
          (post.author && post.author.includes('暨大生超級助理'))
        );
        
        const regular = allVisiblePosts.filter(post => 
          post.type === 'article' || 
          post.type === 'announcement'
        );
        
        console.log('🔧 資料載入檢查:', {
          總貼文: allVisiblePosts.length,
          優先內容: priority.length,
          一般內容: regular.length,
          文章數: regular.filter(p => p.type === 'article').length,
          公告數: regular.filter(p => p.type === 'announcement').length
        });
        
        setAllPosts(allVisiblePosts);
        setPriorityPosts(priority);
        setRegularPosts(regular);
      }
    } catch (error) {
      console.error('載入貼文失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const blendContentStreams = (mainContent, priorityContent) => {
    if (priorityContent.length === 0) {
      return mainContent;
    }
    
    const result = [];
    
    if (mainContent.length === 0) {
      return priorityContent.map((item, index) => ({
        ...item,
        isPriority: true,
        streamKey: `priority-only-${item.id}-${index}`
      }));
    }
    
    const totalItems = mainContent.length + priorityContent.length;
    const distributionRatio = Math.ceil(totalItems / priorityContent.length);
    
    let priorityIndex = 0;
    let nextInsertPosition = Math.min(distributionRatio - 1, 0);
    
    mainContent.forEach((item, index) => {
      result.push(item);
      
      if (index === nextInsertPosition && priorityIndex < priorityContent.length) {
        const priorityItem = {
          ...priorityContent[priorityIndex],
          isPriority: true,
          streamKey: `priority-stream-${priorityContent[priorityIndex].id}-${index}`
        };
        result.push(priorityItem);
        
        priorityIndex++;
        nextInsertPosition += distributionRatio;
      }
    });
    
    while (priorityIndex < priorityContent.length) {
      const remainingItem = {
        ...priorityContent[priorityIndex],
        isPriority: true,
        streamKey: `priority-remaining-${priorityContent[priorityIndex].id}-${priorityIndex}`
      };
      result.push(remainingItem);
      priorityIndex++;
    }
    
    return result;
  };

  // 🔧 修復：統計函數
  const getTypeDisplayName = (type) => {
    const typeMap = {
      article: '📄 文章',
      announcement: '📣 公告'
    };
    return typeMap[type] || type;
  };

  const getTypeCount = (type) => {
    if (type === 'all') {
      return regularPosts.length;
    }
    return regularPosts.filter(post => post.type === type).length;
  };

  // 🔧 修復：分頁邏輯
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
          <span>📊 總共 {getTypeCount('all')} 項內容</span>
        </div>
      </div>

      {/* 🔧 調試資訊（開發時使用） */}
      <div className="debug-info" style={{
        background: '#f0f8ff', 
        padding: '10px', 
        margin: '10px 0', 
        borderRadius: '5px',
        fontSize: '12px',
        border: '1px solid #ddd'
      }}>
        <p><strong>📊 統計調試：</strong></p>
        <p>一般內容總數: {regularPosts.length}</p>
        <p>文章數量: {getTypeCount('article')}</p>
        <p>公告數量: {getTypeCount('announcement')}</p>
        <p>篩選後數量: {filteredPosts.length}</p>
        <p>當前篩選: {selectedType}</p>
        <p>搜尋關鍵字: "{searchTerm}"</p>
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
                key={post.streamKey || `${post.id}-${index}`} 
                className={`post-card post-${post.type} ${post.isPriority ? 'featured-post' : ''}`}
              >
                {/* 優先內容標記 */}
                {post.isPriority && (
                  <div className="featured-label">
                    <span>⭐ 精選</span>
                  </div>
                )}

                {/* 貼文標頭 */}
                <div className="post-card-header">
                  <span className={`post-badge badge-${post.type}`}>
                    {post.type === 'article' && '📄 文章'}
                    {post.type === 'announcement' && '📣 公告'}
                    {(post.type === 'ad' || post.type === 'highlight' || post.type === 'featured') && '⭐ 精選內容'}
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
            （{selectedType === 'all' ? '全部' : getTypeDisplayName(selectedType)} {filteredPosts.length} 項內容）
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
