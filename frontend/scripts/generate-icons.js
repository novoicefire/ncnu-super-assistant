/**
 * 產生 PWA 圖示腳本
 * 將 vite.png 調整為所需的圖示尺寸
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_IMAGE = path.join(__dirname, '..', 'public', 'vite.png');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');

const ICONS = [
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-512x512.png', size: 512 },
];

async function generateIcons() {
    console.log('🎨 開始生成 PWA 圖示...\n');
    console.log(`📁 來源檔案: ${SOURCE_IMAGE}`);
    console.log(`📂 輸出目錄: ${OUTPUT_DIR}\n`);

    for (const icon of ICONS) {
        const outputPath = path.join(OUTPUT_DIR, icon.name);

        await sharp(SOURCE_IMAGE)
            .resize(icon.size, icon.size, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 } // 透明背景
            })
            .png()
            .toFile(outputPath);

        console.log(`✅ ${icon.name} (${icon.size}x${icon.size}) 已生成`);
    }

    console.log('\n🎉 所有 PWA 圖示已成功生成！');
}

generateIcons().catch(err => {
    console.error('❌ 生成圖示時發生錯誤:', err);
    process.exit(1);
});
