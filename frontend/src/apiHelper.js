// frontend/src/apiHelper.js (擴展系統狀態監控版)
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:5000' : 'https://your-backend-url.com'
);

// 🎯 建立 axios 實例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🎯 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🔄 API 請求: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 🎯 回應攔截器
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API 成功: ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API 錯誤: ${error.config?.url}`, error.message);
    return Promise.reject(error);
  }
);

// 🔧 健壯的請求函數
export const robustRequest = async (method, url, options = {}) => {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const config = {
        method,
        url,
        ...options,
      };

      const response = await apiClient(config);
      return response.data;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const shouldRetry = shouldRetryRequest(error);

      if (isLastAttempt || !shouldRetry) {
        throw new APIError(error, url, method);
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`🔄 重試 ${attempt}/${maxRetries} (${delay}ms 後): ${url}`);
      await sleep(delay);
    }
  }
};

// 🎯 判斷是否應該重試
const shouldRetryRequest = (error) => {
  if (!error.response) return true; // 網路錯誤

  const status = error.response.status;
  return status >= 500 || status === 429; // 伺服器錯誤或限流
};

// 🎯 延遲函數
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 🎯 自定義錯誤類別
class APIError extends Error {
  constructor(originalError, url, method) {
    super(originalError.message);
    this.name = 'APIError';
    this.originalError = originalError;
    this.url = url;
    this.method = method;
    this.status = originalError.response?.status;
    this.data = originalError.response?.data;
  }
}

// 🎯 新增：系統狀態檢查
export const checkSystemHealth = async () => {
  try {
    const startTime = Date.now();
    const response = await apiClient.get('/api/health', { timeout: 5000 });
    const responseTime = Date.now() - startTime;

    return {
      status: 'online',
      responseTime,
      timestamp: new Date(),
      details: response.data
    };
  } catch (error) {
    return {
      status: 'error',
      responseTime: null,
      timestamp: new Date(),
      error: error.message
    };
  }
};

// 🎯 新增：獲取用戶註冊統計
export const getUserStats = async () => {
  try {
    const response = await robustRequest('get', '/api/users/stats');
    return {
      totalUsers: response?.total_users || 0,
      activeUsers: response?.active_users || 0,
      newUsersToday: response?.new_users_today || 0
    };
  } catch (error) {
    console.warn('無法載入用戶統計:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsersToday: 0
    };
  }
};

// 🎯 新增：獲取今日行事曆活動
// 🎯 新增：獲取今日行事曆活動 (修正版)
export const getTodayEvents = async () => {
  try {
    // 改為讀取靜態 JSON 並在前端篩選
    const response = await fetch('/data/calendar.json');
    if (!response.ok) return [];

    const events = await response.json();
    if (!Array.isArray(events)) return [];

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 篩選今天的活動
    return events.filter(event => {
      // 簡單判斷：活動開始日期是今天
      // 這裡假設 event.start 是 ISO 字串 (YYYY-MM-DDTHH:mm:ss)
      const startDate = event.start.split('T')[0];
      return startDate === todayStr;
    });
  } catch (error) {
    console.warn('無法載入今日活動:', error);
    return [];
  }
};

export { APIError };
