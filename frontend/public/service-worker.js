/**
 * Service Worker - 處理瀏覽器推播通知
 * 用於接收和顯示推播通知
 */

// Service Worker 安裝事件
self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    self.skipWaiting();
});

// Service Worker 啟動事件
self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    event.waitUntil(self.clients.claim());
});

// 接收推播事件
self.addEventListener('push', (event) => {
    console.log('Push event received');

    let data = {
        title: 'NCNU 小幫手',
        body: '您有新通知',
        icon: '/logo.svg',
        badge: '/logo.svg',
        data: { url: '/' }
    };

    // 嘗試解析推播資料
    if (event.data) {
        try {
            const payload = event.data.json();
            data = {
                title: payload.title || data.title,
                body: payload.body || data.body,
                icon: payload.icon || data.icon,
                badge: payload.badge || data.badge,
                data: payload.data || data.data
            };
        } catch (e) {
            console.error('Error parsing push data:', e);
        }
    }

    // 顯示通知
    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        data: data.data,
        vibrate: [100, 50, 100],
        requireInteraction: false,
        actions: [
            { action: 'open', title: '查看' },
            { action: 'close', title: '關閉' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// 通知點擊事件
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked');

    const notification = event.notification;
    const action = event.action;
    const url = notification.data?.url || '/';

    notification.close();

    if (action === 'close') {
        return;
    }

    // 打開或聚焦到網站
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // 檢查是否已有開啟的視窗
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(url);
                        return client.focus();
                    }
                }
                // 沒有開啟的視窗，開新視窗
                if (self.clients.openWindow) {
                    return self.clients.openWindow(url);
                }
            })
    );
});

// 通知關閉事件
self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed');
});
