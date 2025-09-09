// frontend/src/utils/CacheManager.js (智能快取管理系統)

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5分鐘
    this.maxCacheSize = 100; // 最大快取項目數量
    
    // 🎯 監聽頁面關閉事件，清理快取
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  // 🎯 設置快取
  set(key, value, ttl = this.defaultTTL) {
    try {
      // 檢查快取大小限制
      if (this.cache.size >= this.maxCacheSize) {
        this.evictOldest();
      }

      // 清除舊的定時器
      if (this.cacheTimeout.has(key)) {
        clearTimeout(this.cacheTimeout.get(key));
      }

      // 設置新的快取項目
      const cacheItem = {
        value,
        timestamp: Date.now(),
        ttl,
        hitCount: 0
      };

      this.cache.set(key, cacheItem);

      // 設置過期定時器
      const timeoutId = setTimeout(() => {
        this.delete(key);
      }, ttl);

      this.cacheTimeout.set(key, timeoutId);

      // 🎯 持久化到 localStorage (如果資料不太大)
      if (this.shouldPersist(value)) {
        this.persistToStorage(key, cacheItem);
      }

      return true;
    } catch (error) {
      console.warn('Cache set failed:', error);
      return false;
    }
  }

  // 🎯 獲取快取
  get(key) {
    try {
      let cacheItem = this.cache.get(key);
      
      // 如果記憶體中沒有，嘗試從 localStorage 載入
      if (!cacheItem) {
        cacheItem = this.loadFromStorage(key);
        if (cacheItem) {
          this.cache.set(key, cacheItem);
        }
      }

      if (!cacheItem) {
        return null;
      }

      // 檢查是否過期
      const now = Date.now();
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        this.delete(key);
        return null;
      }

      // 更新命中次數
      cacheItem.hitCount += 1;
      cacheItem.lastAccessed = now;

      return cacheItem.value;
    } catch (error) {
      console.warn('Cache get failed:', error);
      return null;
    }
  }

  // 🎯 檢查快取是否存在且有效
  has(key) {
    return this.get(key) !== null;
  }

  // 🎯 刪除快取項目
  delete(key) {
    try {
      this.cache.delete(key);
      
      if (this.cacheTimeout.has(key)) {
        clearTimeout(this.cacheTimeout.get(key));
        this.cacheTimeout.delete(key);
      }

      // 從持久化儲存中刪除
      this.removeFromStorage(key);
      
      return true;
    } catch (error) {
      console.warn('Cache delete failed:', error);
      return false;
    }
  }

  // 🎯 清除所有快取
  clear() {
    try {
      this.cache.clear();
      
      // 清除所有定時器
      for (const timeoutId of this.cacheTimeout.values()) {
        clearTimeout(timeoutId);
      }
      this.cacheTimeout.clear();

      // 清除持久化儲存
      this.clearStorage();
      
      return true;
    } catch (error) {
      console.warn('Cache clear failed:', error);
      return false;
    }
  }

  // 🎯 獲取快取統計
  getStats() {
    const stats = {
      size: this.cache.size,
      items: [],
      totalHits: 0,
      oldestItem: null,
      newestItem: null
    };

    for (const [key, item] of this.cache.entries()) {
      const itemInfo = {
        key,
        size: this.estimateSize(item.value),
        age: Date.now() - item.timestamp,
        ttl: item.ttl,
        hitCount: item.hitCount,
        lastAccessed: item.lastAccessed
      };

      stats.items.push(itemInfo);
      stats.totalHits += item.hitCount;

      if (!stats.oldestItem || item.timestamp < stats.oldestItem.timestamp) {
        stats.oldestItem = itemInfo;
      }

      if (!stats.newestItem || item.timestamp > stats.newestItem.timestamp) {
        stats.newestItem = itemInfo;
      }
    }

    return stats;
  }

  // 🎯 淘汰最舊的快取項目
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  // 🎯 智能清理過期項目
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  // 🎯 估算資料大小
  estimateSize(value) {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 0;
    }
  }

  // 🎯 判斷是否應該持久化
  shouldPersist(value) {
    const size = this.estimateSize(value);
    return size < 50 * 1024; // 小於 50KB 的資料才持久化
  }

  // 🎯 持久化到 localStorage
  persistToStorage(key, cacheItem) {
    try {
      const storageKey = `cache_${key}`;
      localStorage.setItem(storageKey, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to persist cache to storage:', error);
    }
  }

  // 🎯 從 localStorage 載入
  loadFromStorage(key) {
    try {
      const storageKey = `cache_${key}`;
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
      return null;
    }
  }

  // 🎯 從 localStorage 移除
  removeFromStorage(key) {
    try {
      const storageKey = `cache_${key}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to remove cache from storage:', error);
    }
  }

  // 🎯 清除所有持久化快取
  clearStorage() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear cache storage:', error);
    }
  }
}

// 🎯 創建全域快取管理實例
export const cacheManager = new CacheManager();

// 🎯 快取裝飾器函數
export const withCache = (key, ttl) => {
  return (target, propertyName, descriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function(...args) {
      const cacheKey = `${key}_${JSON.stringify(args)}`;
      
      // 嘗試從快取獲取
      const cached = cacheManager.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 執行原方法
      const result = await method.apply(this, args);
      
      // 存入快取
      cacheManager.set(cacheKey, result, ttl);
      
      return result;
    };

    return descriptor;
  };
};

export default CacheManager;
