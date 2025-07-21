// Gemini AI 增強的更新記錄生成器
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GeminiChangelogGenerator {
  constructor() {
    this.updateDataPath = 'frontend/src/components/5_UpdateLog/updateData.js';
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  // 🤖 使用 Gemini API 整理更新內容
  async enhanceWithGemini(commits, rawChanges) {
    const prompt = `你是一個專業的軟體產品經理，專門撰寫用戶友善的更新說明。

請分析以下程式變更記錄，並整理成簡潔易懂的產品更新說明：

=== 原始 Commit 記錄 ===
${commits.map(c => `• ${c.message} (${c.date})`).join('\n')}

=== 提取的功能變更 ===
${rawChanges.map(change => `- ${change}`).join('\n')}

請按照以下要求整理：
1. 🎯 將技術術語轉換為一般用戶能理解的描述
2. 🔄 合併相似功能，避免重複
3. 📝 每項描述控制在 15-20 個中文字
4. 📊 按用戶影響程度排序（最重要的放前面）
5. 🎨 使用合適的 emoji 提升可讀性
6. 🏷️ 判斷整體更新類型：major(重大更新), feature(新功能), improvement(改善), fix(修復)

請以 JSON 格式回傳：
{
  "title": "整體更新主題（10-15字）",
  "description": "一句話描述本次更新的核心價值（30字內）", 
  "type": "更新類型",
  "features": [
    "功能描述1",
    "功能描述2",
    "功能描述3"
  ]
}

範例輸出：
{
  "title": "使用者體驗全面升級",
  "description": "優化介面設計，提供更直覺的操作體驗",
  "type": "improvement", 
  "features": [
    "🎨 用戶頭像顯示優化",
    "📱 手機版介面改善", 
    "⚡ 載入速度提升"
  ]
}`;

    try {
      const response = await fetch(`${this.geminiApiUrl}?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 32,
            topP: 1,
            maxOutputTokens: 1000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      
      // 提取 JSON 內容
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('無法解析 Gemini 回應');
    } catch (error) {
      console.log('🤖 Gemini AI 處理失敗，使用本地智能處理:', error.message);
      return null;
    }
  }

  // 🧠 本地智能後備方案
  localSmartEnhance(rawChanges) {
    const keywordMap = {
      ui: { 
        keywords: ['介面', '按鈕', '樣式', 'navbar', '頭像', '版面', '顏色'], 
        title: '介面設計優化',
        emoji: '🎨'
      },
      feature: { 
        keywords: ['新增', '實現', '支援', '建立', '功能'], 
        title: '新功能發布',
        emoji: '✨' 
      },
      fix: { 
        keywords: ['修復', '解決', '修正', '錯誤', 'bug'], 
        title: '問題修復',
        emoji: '🔧' 
      },
      improvement: { 
        keywords: ['優化', '改善', '提升', '調整', '更新'], 
        title: '體驗改善',
        emoji: '⚡' 
      }
    };

    const categorized = {};
    rawChanges.forEach(change => {
      for (const [category, info] of Object.entries(keywordMap)) {
        if (info.keywords.some(keyword => change.toLowerCase().includes(keyword))) {
          if (!categorized[category]) categorized[category] = [];
          categorized[category].push(change);
          return;
        }
      }
    });

    // 生成簡化的功能列表
    const features = [];
    for (const [category, changes] of Object.entries(categorized)) {
      const info = keywordMap[category];
      if (changes.length === 1) {
        features.push(`${info.emoji} ${changes[0].slice(0, 20)}...`);
      } else if (changes.length > 1) {
        features.push(`${info.emoji} ${info.title}`);
      }
    }

    // 決定更新類型和標題
    const hasUI = categorized.ui && categorized.ui.length > 0;
    const hasFeature = categorized.feature && categorized.feature.length > 0;
    const hasFix = categorized.fix && categorized.fix.length > 0;

    let type, title;
    if (hasFeature) {
      type = 'feature';
      title = '新功能發布';
    } else if (hasUI) {
      type = 'improvement'; 
      title = '介面體驗升級';
    } else if (hasFix) {
      type = 'fix';
      title = '問題修復更新';
    } else {
      type = 'improvement';
      title = '系統優化更新';
    }

    return {
      title,
      description: `本次更新專注於${hasUI ? '介面優化' : hasFeature ? '功能擴展' : '系統改善'}，提升使用體驗`,
      type,
      features: features.slice(0, 5) // 最多5項
    };
  }

  // 🎯 獲取最近的 commits
  getRecentCommits() {
    try {
      const lastTag = this.getLastVersion();
      const gitRange = lastTag ? `${lastTag}..HEAD` : 'HEAD~10..HEAD';
      
      const commits = execSync(`git log ${gitRange} --pretty=format:"%h|%s|%an|%ad" --date=short`, { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [hash, message, author, date] = line.split('|');
          return { hash, message, author, date };
        })
        .filter(commit => {
          // 過濾自動生成的 commit
          const msg = commit.message.toLowerCase();
          return !msg.includes('docs: 自動更新版本') && 
                 !msg.includes('merge pull request') &&
                 !msg.includes('merge branch');
        });

      return commits;
    } catch (error) {
      console.log('No previous commits found');
      return [];
    }
  }

  // 📊 基礎分析（用作 AI 的輔助資訊）
  basicAnalyze(commits) {
    const changes = commits.map(commit => {
      let message = commit.message;
      // 移除 conventional commit 前綴
      message = message.replace(/^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?:\s*/, '');
      return message;
    });

    return changes;
  }

  // 📝 版本管理
  getCurrentVersion() {
    try {
      const updateData = fs.readFileSync(this.updateDataPath, 'utf8');
      const match = updateData.match(/version:\s*["']v?([\d.]+)["']/);
      return match ? match[1] : '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  getLastVersion() {
    try {
      return execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    } catch {
      return null;
    }
  }

  incrementVersion(version, type) {
    const [major, minor, patch] = version.split('.').map(Number);
    
    switch(type) {
      case 'major': return `${major + 1}.0.0`;
      case 'feature': return `${major}.${minor + 1}.0`;
      case 'improvement':
      case 'fix':
      default: return `${major}.${minor}.${patch + 1}`;
    }
  }

  // 🎨 生成最終更新記錄
  generateUpdateEntry(aiResult, versionInfo) {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      version: `v${versionInfo.newVersion}`,
      date: today,
      type: aiResult.type,
      title: aiResult.title,
      description: aiResult.description,
      features: aiResult.features
    };
  }

  // 💾 更新檔案
  updateChangelogFile(newEntry) {
    try {
      let content = fs.readFileSync(this.updateDataPath, 'utf8');
      
      const arrayMatch = content.match(/(export const updateHistory = \[)([\s\S]*?)(\];)/);
      
      if (arrayMatch) {
        const newEntryStr = '  ' + JSON.stringify(newEntry, null, 2).replace(/\n/g, '\n  ');
        const updatedContent = content.replace(
          arrayMatch[0],
          `${arrayMatch[1]}\n${newEntryStr},${arrayMatch[2]}${arrayMatch[3]}`
        );
        
        fs.writeFileSync(this.updateDataPath, updatedContent, 'utf8');
        console.log(`✅ 成功新增版本 ${newEntry.version} 的更新記錄`);
        return true;
      }
    } catch (error) {
      console.error('❌ 更新檔案失敗:', error);
      return false;
    }
  }

  // 🚀 主執行函數
  async run() {
    console.log('🤖 開始使用 Gemini AI 生成智能更新記錄...');
    
    // 檢查 API Key
    if (!this.geminiApiKey) {
      console.error('❌ 錯誤：請設定 GEMINI_API_KEY 環境變數');
      process.exit(1);
    }
    
    const commits = this.getRecentCommits();
    if (commits.length === 0) {
      console.log('📭 沒有找到新的 commits，跳過更新');
      console.log('::set-output name=has_changes::false');
      return;
    }

    console.log(`📝 分析 ${commits.length} 個 commits...`);
    const rawChanges = this.basicAnalyze(commits);
    
    // 嘗試使用 Gemini AI 增強
    console.log('🤖 正在使用 Gemini AI 分析...');
    let aiResult = await this.enhanceWithGemini(commits, rawChanges);
    
    // 後備方案：本地智能處理
    if (!aiResult) {
      console.log('🧠 使用本地智能處理...');
      aiResult = this.localSmartEnhance(rawChanges);
    }

    console.log(`🎯 AI 建議版本類型: ${aiResult.type}`);
    console.log(`📝 AI 生成標題: ${aiResult.title}`);
    
    // 生成版本資訊
    const currentVersion = this.getCurrentVersion();
    const newVersion = this.incrementVersion(currentVersion, aiResult.type);
    
    const updateEntry = this.generateUpdateEntry(aiResult, { newVersion });
    
    const success = this.updateChangelogFile(updateEntry);
    
    if (success) {
      console.log('::set-output name=has_changes::true');
      console.log(`::set-output name=new_version::${newVersion}`);
      
      // 創建 git tag
      try {
        execSync(`git tag v${newVersion}`);
        console.log(`🏷️ 創建標籤 v${newVersion}`);
      } catch (error) {
        console.log('⚠️ 無法創建 git tag:', error.message);
      }
    } else {
      console.log('::set-output name=has_changes::false');
    }
  }
}

// 執行生成器
const generator = new GeminiChangelogGenerator();
generator.run().catch(console.error);
