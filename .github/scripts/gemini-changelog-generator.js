// .github/scripts/gemini-changelog-generator.js (完整版 - Gemini 2.0 Flash)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GeminiChangelogGenerator {
  constructor() {
    this.updateDataPath = 'frontend/src/components/5_UpdateLog/updateData.js';
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    // 🚀 更新：使用最新的 Gemini 2.0 Flash 模型
    this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
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
      const response = await this.makeApiRequestWithRetry(prompt, 3);
      
      const data = await response.json();
      
      // 檢查 API 回應格式
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('API 回應格式不正確');
      }
      
      const content = data.candidates[0].content.parts[0].text;
      
      // 提取 JSON 內容
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return this.validateAIOutput(result, rawChanges);
      }
      
      throw new Error('無法解析 Gemini 回應');
    } catch (error) {
      console.log('🤖 Gemini 2.0 Flash 處理失敗，使用本地智能處理:', error.message);
      return null;
    }
  }

  // 🔧 修復：API 請求重試機制（Gemini 2.0 版本）
  async makeApiRequestWithRetry(prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(this.geminiApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': this.geminiApiKey  // 🎯 正確的 header 格式
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

        if (response.status === 404) {
          throw new Error(`API 端點不存在 (404) - 請確認模型名稱正確`);
        }

        if (response.status === 403) {
          throw new Error(`API 金鑰權限錯誤 (403) - 請檢查金鑰是否有效`);
        }

        if (response.status === 429) {
          console.log(`⏰ 嘗試 ${attempt}/${maxRetries}: 請求過於頻繁，等待後重試...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API 請求失敗: ${response.status} ${errorText}`);
        }

        console.log('✅ Gemini 2.0 Flash API 調用成功');
        return response;
      } catch (error) {
        console.log(`⚠️ 嘗試 ${attempt}/${maxRetries} 失敗: ${error.message}`);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // 等待後重試
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // 🔍 AI 輸出品質驗證
  validateAIOutput(aiResult, originalChanges) {
    const issues = [];
    
    // 檢查基本結構
    if (!aiResult.title || aiResult.title.length < 5) {
      issues.push('標題過短或缺失');
    }
    
    if (!aiResult.features || aiResult.features.length === 0) {
      issues.push('功能列表為空');
    }
    
    if (aiResult.features && aiResult.features.length > originalChanges.length + 3) {
      issues.push('功能列表可能包含冗餘項目');
    }

    // 關鍵字覆蓋率檢查
    const originalKeywords = this.extractKeywords(originalChanges);
    const aiKeywords = this.extractKeywords(aiResult.features || []);
    const coverage = this.calculateCoverage(originalKeywords, aiKeywords);
    
    console.log(`📊 品質檢查 - 關鍵詞覆蓋率: ${Math.round(coverage * 100)}%`);
    console.log(`📊 品質檢查 - 發現問題: ${issues.length}個`);
    
    if (coverage < 0.4) {
      issues.push(`關鍵詞覆蓋率過低: ${Math.round(coverage * 100)}%`);
    }
    
    if (issues.length > 0) {
      console.log('⚠️ AI 輸出品質問題:', issues);
      return null; // 品質不達標，使用後備方案
    }
    
    return aiResult;
  }

  // 🔤 提取關鍵詞
  extractKeywords(textArray) {
    const keywords = new Set();
    textArray.forEach(text => {
      // 提取中文詞語（2-4字）
      const matches = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
      matches.forEach(word => keywords.add(word));
    });
    return Array.from(keywords);
  }

  // 📊 計算覆蓋率
  calculateCoverage(originalKeywords, aiKeywords) {
    if (originalKeywords.length === 0) return 1;
    
    const covered = originalKeywords.filter(keyword => 
      aiKeywords.some(aiKeyword => 
        aiKeyword.includes(keyword) || keyword.includes(aiKeyword)
      )
    );
    
    return covered.length / originalKeywords.length;
  }

  // 🧠 本地智能後備方案
  localSmartEnhance(rawChanges) {
    const keywordMap = {
      ui: { 
        keywords: ['介面', '按鈕', '樣式', 'navbar', '頭像', '版面', '顏色', 'css'], 
        title: '介面設計優化',
        emoji: '🎨'
      },
      feature: { 
        keywords: ['新增', '實現', '支援', '建立', '功能', 'feat'], 
        title: '新功能發布',
        emoji: '✨' 
      },
      fix: { 
        keywords: ['修復', '解決', '修正', '錯誤', 'bug', 'fix'], 
        title: '問題修復',
        emoji: '🔧' 
      },
      improvement: { 
        keywords: ['優化', '改善', '提升', '調整', '更新', 'improve'], 
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
        // 單一變更，簡化描述
        const simplified = changes[0]
          .replace(/^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?:\s*/, '')
          .slice(0, 18);
        features.push(`${info.emoji} ${simplified}`);
      } else if (changes.length > 1) {
        // 多個變更，使用分類標題
        features.push(`${info.emoji} ${info.title}`);
      }
    }

    // 決定更新類型和標題
    const hasUI = categorized.ui && categorized.ui.length > 0;
    const hasFeature = categorized.feature && categorized.feature.length > 0;
    const hasFix = categorized.fix && categorized.fix.length > 0;

    let type, title;
    if (hasFeature && (categorized.feature.length >= 2 || hasUI)) {
      type = 'feature';
      title = '新功能與介面升級';
    } else if (hasFeature) {
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
                 !msg.includes('docs: 🤖 ai自動更新版本') &&
                 !msg.includes('merge pull request') &&
                 !msg.includes('merge branch');
        });

      return commits;
    } catch (error) {
      console.log('No previous commits found');
      return [];
    }
  }

  // 📊 基礎分析
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
      
      throw new Error('找不到 updateHistory 陣列');
    } catch (error) {
      console.error('❌ 更新檔案失敗:', error);
      return false;
    }
  }

  // 🚀 主執行函數
  async run() {
    console.log('🤖 開始使用 Gemini 2.0 Flash 生成智能更新記錄...');
    
    // 檢查 API Key
    if (!this.geminiApiKey) {
      console.error('❌ 錯誤：請設定 GEMINI_API_KEY 環境變數');
      console.log('請前往 GitHub Secrets 設定 API 金鑰');
      process.exit(1);
    }
    
    const commits = this.getRecentCommits();
    if (commits.length === 0) {
      console.log('📭 沒有找到新的 commits，跳過更新');
      console.log('::set-output name=has_changes::false');
      return;
    }

    console.log(`📝 分析 ${commits.length} 個 commits:`);
    commits.forEach((commit, index) => {
      console.log(`   ${index + 1}. ${commit.message.slice(0, 60)}... (${commit.date})`);
    });
    
    const rawChanges = this.basicAnalyze(commits);
    
    // 嘗試使用 Gemini AI 增強
    console.log('🤖 正在使用 Gemini 2.0 Flash 分析...');
    let aiResult = await this.enhanceWithGemini(commits, rawChanges);
    
    // 後備方案：本地智能處理
    if (!aiResult) {
      console.log('🧠 使用本地智能處理...');
      aiResult = this.localSmartEnhance(rawChanges);
      console.log('💡 本地智能處理完成');
    } else {
      console.log('🎉 Gemini AI 處理成功');
    }

    console.log(`🎯 更新類型: ${aiResult.type}`);
    console.log(`📝 更新標題: ${aiResult.title}`);
    console.log(`📋 功能數量: ${aiResult.features.length}`);
    
    // 生成版本資訊
    const currentVersion = this.getCurrentVersion();
    const newVersion = this.incrementVersion(currentVersion, aiResult.type);
    
    console.log(`📈 版本升級: v${currentVersion} → v${newVersion}`);
    
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
      
      console.log('🎊 更新記錄生成完成！');
    } else {
      console.log('::set-output name=has_changes::false');
      console.log('❌ 更新記錄生成失敗');
    }
  }
}

// 執行生成器
const generator = new GeminiChangelogGenerator();
generator.run().catch(console.error);
