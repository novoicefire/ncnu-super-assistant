import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const MAX_RETRIES = 5; // 最多重試 5 次
const RETRY_DELAY = 2000; // 每次重試間隔 2 秒

// 一個簡單的延遲函數
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 健壯的 API 請求函數，會先嘗試喚醒後端，並帶有重試機制
 * @param {'get' | 'post'} method - HTTP 方法
 * @param {string} endpoint - API 端點，例如 '/api/schedule'
 * @param {object} [data] - 對於 POST 請求，這是要發送的資料
 * @param {object} [params] - 對於 GET 請求，這是 URL 查詢參數
 * @returns {Promise<any>}
 */
export const robustRequest = async (method, endpoint, { data, params } = {}) => {
    console.log(`Starting robust request to: ${endpoint}`);

    // 1. 先發送一個簡單的喚醒請求到根目錄
    try {
        console.log("Pinging backend to wake it up...");
        await axios.get(API_URL, { timeout: 30000 }); // 給 30 秒的超時時間
        console.log("Backend is awake or was already awake.");
    } catch (wakeError) {
        // 即使喚醒請求失敗 (例如超時)，我們仍然繼續嘗試主請求
        console.warn("Backend ping failed, but proceeding anyway:", wakeError.message);
    }

    // 2. 執行帶有重試機制的主請求
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await axios({
                method,
                url: `${API_URL}${endpoint}`,
                data,
                params,
                timeout: 15000, // 主請求給 15 秒超時
            });
            console.log(`Request to ${endpoint} successful.`);
            return response.data; // 成功則返回資料
        } catch (error) {
            console.error(`Attempt ${i + 1} failed for ${endpoint}:`, error.message);
            if (i === MAX_RETRIES - 1) {
                // 如果是最後一次重試，則拋出錯誤
                throw error;
            }
            // 等待一段時間再重試
            await delay(RETRY_DELAY);
        }
    }
};