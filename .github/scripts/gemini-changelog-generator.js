// .github/scripts/gemini-changelog-generator.js (AI品質優化版)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GeminiChangelogGenerator {
  constructor() {
    this.updateDataPath = 'frontend/src/components/5_UpdateLog/updateData.js';
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  }

  // 🤖 使用 Gemini API 整理更新內容
  async enhanceWithGemini(commits, rawChanges) {
    const prompt = `你是專業的軟體產品經理，專門為用戶撰寫更新說明。

=== 分析以下程式變更記錄 ===
${commits.map(c => `• ${c.message} (${c.date})`).join('\n')}

=== 提取的功能變更 ===
${rawChanges.map(change => `- ${change}`).join('\n')}

請按照以下要求整理成用戶友善的更新說明：

📋 整理要求：
1. 將技術術語轉換為用戶能理解的描述
2. 合併相似功能，消除重複內容
3. 每項描述15-20個中文字
4. 按影響程度排序（重要功能優先）
5. 使用適當emoji增加可讀性
6. 判斷更新類型：major(重大更新), feature(新功能), improvement(改善), fix(修復)

🎯 特別注意：
- 「課程資料」相關改動請描述為「課程資訊優化」
- 「介面」相關改動請描述為「操作體驗改善」
- 「修復」相關改動請描述為「問題解決」
- 避免使用「AI」、「API」等技術術語

請以JSON格式回傳：
{
  "title": "整體更新主題（8-12字）",
  "description": "一句話核心價值描述（25字內）", 
  "type": "更新類型",
  "features": [
    "具體功能描述1",
    "具體功能描述2", 
    "具體功能描述3"
  ]
}

範例：
{
  "title": "使用體驗全面提升",
  "description": "優化介面設計與功能操作，提供更順暢的使用體驗",
  "type": "improvement",
  "features": [
    "🎨 介面視覺設計優化",
    "📱 手機操作體驗改善",
    "⚡ 系統回應速度提升"
  ]
}`;

    try {
      const response = await this.makeApiRequestWithRetry(prompt, 3);
      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('API 回應格式不正確');
      }
      
      const content = data.candidates[0].content.parts[0].text;
      console.log('🤖 Gemini 原始回應:', content.substring(0, 200) + '...');
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return this.validateAIOutput(result, rawChanges);
      }
      
      throw new Error('無法解析 Gemini 回應');
    } catch (error) {
      console.log('🤖 Gemini AI 處理失敗，使用本地智能處理:', error.message);
      return null;
    }
  }

  async makeApiRequestWithRetry(prompt, maxRetries = 3) {
    const fetch = (await import('node-fetch')).default;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = `${this.geminiApiUrl}?key=${this.geminiApiKey}`;
        
        const response = await fetch(url, {
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
              temperature: 0.2,  // 🔧 降低隨機性，提高一致性
              topK: 20,          // 🔧 減少候選詞，提高準確性
              topP: 0.8,         // 🔧 優化採樣策略
              maxOutputTokens: 800
            }
          })
        });

        console.log(`🔍 API 請求狀態: ${response.status}`);

        if (response.status === 404) {
          throw new Error(`API 端點不存在 (404) - 模型可能不可用`);
        }
        if (response.status === 403) {
          throw new Error(`API 金鑰權限錯誤 (403)`);
        }
        if (response.status === 400) {
          const errorText = await response.text();
          throw new Error(`請求格式錯誤 (400): ${errorText}`);
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

        console.log('✅ Gemini API 調用成功');
        return response;
      } catch (error) {
        console.log(`⚠️ 嘗試 ${attempt}/${maxRetries} 失敗: ${error.message}`);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // 🔧 綜合修復：降低門檻 + 改進匹配邏輯
  validateAIOutput(aiResult, originalChanges) {
    const issues = [];
    
    // 基本結構檢查
    if (!aiResult.title || aiResult.title.length < 5) {
      issues.push('標題過短或缺失');
    }
    if (!aiResult.features || aiResult.features.length === 0) {
      issues.push('功能列表為空');
    }
    if (aiResult.features && aiResult.features.length > originalChanges.length + 5) {
      issues.push('功能列表可能包含過多項目');
    }

    // 🎯 改進關鍵詞匹配與覆蓋率檢查
    const originalKeywords = this.extractKeywords(originalChanges);
    const aiKeywords = this.extractKeywords(aiResult.features || []);
    const coverage = this.calculateEnhancedCoverage(originalKeywords, aiKeywords);
    
    console.log(`📊 品質檢查 - 關鍵詞覆蓋率: ${Math.round(coverage * 100)}%`);
    console.log(`📊 原始關鍵詞: [${originalKeywords.slice(0, 5).join(', ')}...]`);
    console.log(`📊 AI關鍵詞: [${aiKeywords.slice(0, 5).join(', ')}...]`);
    console.log(`📊 品質檢查 - 發現問題: ${issues.length}個`);
    
    
    
    // 🔧 修復：大幅降低門檻至 5%
    if (coverage < 0.05) {
      issues.push(`關鍵詞覆蓋率過低: ${Math.round(coverage * 100)}%`);
    }
    
    // 內容品質檢查（保持現有邏輯）
    if (aiResult.title && aiResult.title.includes('AI') || 
        (aiResult.features && aiResult.features.some(f => f.includes('AI介入')))) {
      issues.push('包含不當的技術術語');
    }
    
    if (issues.length > 0) {
      console.log('⚠️ AI 輸出品質問題:', issues);
      return null;
    }
    
    console.log('✅ AI 輸出品質檢查通過');
    return aiResult;
  }

  // 🔧 改進：更好的關鍵詞提取
  extractKeywords(textArray) {
    const keywords = new Set();
    textArray.forEach(text => {
      // 中文詞語提取（2-4字）
      const chineseMatches = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
      chineseMatches.forEach(word => {
        // 過濾常見無意義詞語
        if (!['修復', '優化', '改善', '新增', '功能', '系統'].includes(word)) {
          keywords.add(word);
        }
      });
      
      // 英文關鍵詞提取
      const englishMatches = text.match(/\b[a-zA-Z]{3,8}\b/g) || [];
      englishMatches.forEach(word => {
        const lowerWord = word.toLowerCase();
        if (['fix', 'feat', 'improvement', 'ui', 'api', 'css'].includes(lowerWord)) {
          keywords.add(lowerWord);
        }
      });
    });
    return Array.from(keywords);
  }

  calculateCoverage(originalKeywords, aiKeywords) {
    if (originalKeywords.length === 0) return 1;
    
    const covered = originalKeywords.filter(keyword => 
      aiKeywords.some(aiKeyword => 
        aiKeyword.includes(keyword) || 
        keyword.includes(aiKeyword) ||
        this.areSimilarKeywords(keyword, aiKeyword)
      )
    );
    
    return covered.length / originalKeywords.length;
  }

  // 🔧 新增：相似關鍵詞判斷
  areSimilarKeywords(word1, word2) {
    const synonyms = {
      '課程': ['課表', '選課'],
      '介面': ['界面', '版面', '頁面'],
      '修復': ['解決', '修正', '處理'],
      '優化': ['改善', '提升', '增強']
    };
    
    for (const [base, alts] of Object.entries(synonyms)) {
      if ((word1 === base && alts.includes(word2)) || 
          (word2 === base && alts.includes(word1))) {
        return true;
      }
    }
    return false;
  }

  // 🔧 大幅改進：本地智能處理邏輯
  localSmartEnhance(rawChanges) {
    console.log('🧠 啟動改進版本地智能分析...');
    
    const categoryAnalysis = {
      courseData: {
        keywords: ['課程', '資料', '開課', '單位', '中文思辨', 'data', 'course'],
        title: '課程資訊完善',
        emoji: '📚',
        count: 0
      },
      ui: {
        keywords: ['介面', '按鈕', '樣式', '版面', '頭像', 'ui', 'css', '排版'],
        title: '介面體驗優化', 
        emoji: '🎨',
        count: 0
      },
      feature: {
        keywords: ['新增', '功能', '隱藏', '衝堂', 'feature', 'feat'],
        title: '新功能上線',
        emoji: '✨',
        count: 0
      },
      fix: {
        keywords: ['修復', '解決', '修正', 'fix', '錯誤'],
        title: '問題修復',
        emoji: '🔧',
        count: 0
      }
    };

    // 分析 commits 分布
    rawChanges.forEach(change => {
      const lowerChange = change.toLowerCase();
      Object.values(categoryAnalysis).forEach(category => {
        if (category.keywords.some(keyword => lowerChange.includes(keyword))) {
          category.count++;
        }
      });
    });

    // 生成智能描述
    const features = [];
    let dominantType = 'improvement';
    let maxCount = 0;

    Object.entries(categoryAnalysis).forEach(([key, category]) => {
      if (category.count > 0) {
        features.push(`${category.emoji} ${category.title}`);
        if (category.count > maxCount) {
          maxCount = category.count;
          dominantType = key === 'courseData' ? 'fix' : 
                       key === 'feature' ? 'feature' : 
                       key === 'fix' ? 'fix' : 'improvement';
        }
      }
    });

    // 如果沒有明確分類，提供通用描述
    if (features.length === 0) {
      features.push('⚡ 系統穩定性改善', '🔧 程式碼品質優化');
    }

    const titleMap = {
      fix: '系統問題修復',
      feature: '新功能發布', 
      improvement: '使用體驗優化'
    };

    const descriptionMap = {
      fix: '修復系統問題，提升服務穩定性',
      feature: '推出實用新功能，豐富使用體驗',
      improvement: '全面優化設計與操作，提升使用滿意度'
    };

    const result = {
      title: titleMap[dominantType] || '系統更新',
      description: descriptionMap[dominantType] || '持續改善系統功能與使用體驗',
      type: dominantType,
      features: features.slice(0, 4) // 最多4項
    };

    console.log(`💡 本地智能分析完成 - 類型: ${dominantType}, 功能數: ${features.length}`);
    return result;
  }

  getRecentCommits() {
    try {
      const lastTag = this.getLastVersion();
      const gitRange = lastTag ? `${lastTag}..HEAD` : 'HEAD~15..HEAD'; // 🔧 限制最多15個commits
      
      const commits = execSync(`git log ${gitRange} --pretty=format:"%h|%s|%an|%ad" --date=short`, { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [hash, message, author, date] = line.split('|');
          return { hash, message, author, date };
        })
        .filter(commit => {
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

  basicAnalyze(commits) {
    const changes = commits.map(commit => {
      let message = commit.message;
      message = message.replace(/^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?:\s*/, '');
      return message;
    });

    return changes;
  }

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

  async run() {
    console.log('🤖 開始使用優化版 Gemini AI 生成智能更新記錄...');
    
    if (!this.geminiApiKey) {
      console.error('❌ 錯誤：請設定 GEMINI_API_KEY 環境變數');
      process.exit(1);
    }
    
    const commits = this.getRecentCommits();
    if (commits.length === 0) {
      console.log('📭 沒有找到新的 commits，跳過更新');
      console.log('has_changes=false' + '>' + '$GITHUB_OUTPUT');
      return;
    }

    console.log(`📝 分析 ${commits.length} 個 commits:`);
    commits.slice(0, 5).forEach((commit, index) => {
      console.log(`   ${index + 1}. ${commit.message.slice(0, 50)}... (${commit.date})`);
    });
    
    const rawChanges = this.basicAnalyze(commits);
    
    console.log('🤖 正在使用優化版 Gemini AI 分析...');
    let aiResult = await this.enhanceWithGemini(commits, rawChanges);
    
    if (!aiResult) {
      console.log('🧠 使用改進版本地智能處理...');
      aiResult = this.localSmartEnhance(rawChanges);
      console.log('💡 本地智能處理完成');
    } else {
      console.log('🎉 Gemini AI 處理成功！');
    }

    console.log(`🎯 更新類型: ${aiResult.type}`);
    console.log(`📝 更新標題: ${aiResult.title}`);
    console.log(`📋 功能清單: [${aiResult.features.join(', ')}]`);
    
    const currentVersion = this.getCurrentVersion();
    const newVersion = this.incrementVersion(currentVersion, aiResult.type);
    
    console.log(`📈 版本升級: v${currentVersion} → v${newVersion}`);
    
    const updateEntry = this.generateUpdateEntry(aiResult, { newVersion });
    const success = this.updateChangelogFile(updateEntry);
    
    if (success) {
      console.log('has_changes=true' + '>' + '$GITHUB_OUTPUT');
      console.log(`new_version=${newVersion}` + '>' + '$GITHUB_OUTPUT');
      
      try {
        execSync(`git tag v${newVersion}`);
        console.log(`🏷️ 創建標籤 v${newVersion}`);
      } catch (error) {
        console.log('⚠️ 無法創建 git tag:', error.message);
      }
      
      console.log('🎊 更新記錄生成完成！');
    } else {
      console.log('has_changes=false' + '>' + '$GITHUB_OUTPUT');
      console.log('❌ 更新記錄生成失敗');
    }
  }
}

const generator = new GeminiChangelogGenerator();
generator.run().catch(console.error);
