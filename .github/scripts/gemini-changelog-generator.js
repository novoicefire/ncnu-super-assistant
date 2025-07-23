// .github/scripts/gemini-changelog-generator.js (修復版 - CommonJS)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GeminiChangelogGenerator {
  constructor() {
    this.updateDataPath = 'frontend/src/components/5_UpdateLog/updateData.js';
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  }

  // 🤖 使用改進的重試機制
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
}`;

    try {
      const response = await this.makeApiRequestWithRetry(prompt, 5); // 🔧 增加重試次數
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

  // 🔧 強化的重試機制
  async makeApiRequestWithRetry(prompt, maxRetries = 5) {
    const fetch = (await import('node-fetch')).default;
    
    // 🔧 指數退避延遲：2s, 5s, 10s, 20s, 30s
    const delays = [2000, 5000, 10000, 20000, 30000];
    
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
              temperature: 0.2,
              topK: 20,
              topP: 0.8,
              maxOutputTokens: 800
            }
          })
        });

        console.log(`🔍 API 請求狀態: ${response.status} (嘗試 ${attempt}/${maxRetries})`);

        // 🔧 特別處理 503 錯誤
        if (response.status === 503) {
          const delay = delays[attempt - 1] || 30000;
          console.log(`⏰ 服務過載，等待 ${delay/1000} 秒後重試...`);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`服務持續過載，已重試 ${maxRetries} 次`);
        }

        if (response.status === 404) {
          throw new Error(`API 端點不存在 (404)`);
        }
        if (response.status === 403) {
          throw new Error(`API 金鑰權限錯誤 (403)`);
        }
        if (response.status === 400) {
          const errorText = await response.text();
          throw new Error(`請求格式錯誤 (400): ${errorText}`);
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
        
        // 🔧 非503錯誤也使用較短的延遲
        const delay = error.message.includes('503') ? delays[attempt - 1] : 1000 * attempt;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // 🔧 極度寬鬆的品質驗證
  validateAIOutput(aiResult, originalChanges) {
    const issues = [];
    
    if (!aiResult.title || aiResult.title.length < 3) {
      issues.push('標題過短或缺失');
    }
    if (!aiResult.features || aiResult.features.length === 0) {
      issues.push('功能列表為空');
    }

    // 🔧 極低品質門檻
    const originalKeywords = this.extractKeywords(originalChanges);
    const aiKeywords = this.extractKeywords(aiResult.features || []);
    const coverage = this.calculateCoverage(originalKeywords, aiKeywords);
    
    console.log(`📊 品質檢查 - 關鍵詞覆蓋率: ${Math.round(coverage * 100)}%`);
    
    // 🔧 只要有1%關聯就通過
    if (coverage < 0.01) {
      issues.push(`關鍵詞覆蓋率過低: ${Math.round(coverage * 100)}%`);
    }
    
    if (issues.length > 0) {
      console.log('⚠️ AI 輸出品質問題:', issues);
      return null;
    }
    
    console.log('✅ AI 輸出品質檢查通過');
    return aiResult;
  }

  extractKeywords(textArray) {
    const keywords = new Set();
    textArray.forEach(text => {
      const chineseMatches = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
      chineseMatches.forEach(word => {
        if (!['修復', '優化', '改善', '新增', '功能', '系統'].includes(word)) {
          keywords.add(word);
        }
      });
    });
    return Array.from(keywords);
  }

  calculateCoverage(originalKeywords, aiKeywords) {
    if (originalKeywords.length === 0) return 1;
    
    const covered = originalKeywords.filter(keyword => 
      aiKeywords.some(aiKeyword => 
        aiKeyword.includes(keyword) || keyword.includes(aiKeyword)
      )
    );
    
    return covered.length / originalKeywords.length;
  }

  // 🔧 改進本地智能處理
  localSmartEnhance(rawChanges) {
    console.log('🧠 啟動改進版本地智能分析...');
    
    // 檢測免責聲明相關變更
    const hasDisclaimer = rawChanges.some(change => 
      change.toLowerCase().includes('免責') || 
      change.toLowerCase().includes('聲明') ||
      change.toLowerCase().includes('disclaimer')
    );

    if (hasDisclaimer) {
      return {
        title: '法律聲明與用戶體驗',
        description: '新增重要免責聲明，確保使用者了解服務性質',
        type: 'major',
        features: [
          '⚖️ 新增免責聲明公告系統',
          '🔒 確保用戶了解非官方性質',
          '📋 完善服務使用規範',
          '🎨 優化使用者介面體驗'
        ]
      };
    }

    // 一般變更的處理
    return {
      title: '系統維護更新',
      description: '持續改善系統穩定性與使用體驗',
      type: 'improvement',
      features: [
        '⚡ 系統穩定性改善',
        '🔧 程式碼品質優化',
        '📱 使用體驗提升',
        '🔄 功能完善調整'
      ]
    };
  }

  // 其他方法保持不變...
  getRecentCommits() {
    try {
      const lastTag = this.getLastVersion();
      const gitRange = lastTag ? `${lastTag}..HEAD` : 'HEAD~15..HEAD';
      
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
    return commits.map(commit => {
      let message = commit.message;
      message = message.replace(/^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?:\s*/, '');
      return message;
    });
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
    console.log('🤖 開始使用強化重試機制的 Gemini AI 生成智能更新記錄...');
    
    if (!this.geminiApiKey) {
      console.error('❌ 錯誤：請設定 GEMINI_API_KEY 環境變數');
      process.exit(1);
    }
    
    const commits = this.getRecentCommits();
    if (commits.length === 0) {
      console.log('📭 沒有找到新的 commits，跳過更新');
      if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_changes=false\n`);
      }
      return;
    }

    console.log(`📝 分析 ${commits.length} 個 commits:`);
    commits.slice(0, 5).forEach((commit, index) => {
      console.log(`   ${index + 1}. ${commit.message.slice(0, 50)}... (${commit.date})`);
    });
    
    const rawChanges = this.basicAnalyze(commits);
    
    console.log('🤖 正在使用強化重試機制的 Gemini AI 分析...');
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
      if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_changes=true\n`);
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `new_version=${newVersion}\n`);
      }
      
      try {
        execSync(`git tag v${newVersion}`);
        console.log(`🏷️ 創建標籤 v${newVersion}`);
      } catch (error) {
        console.log('⚠️ 無法創建 git tag:', error.message);
      }
      
      console.log('🎊 更新記錄生成完成！');
    } else {
      if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_changes=false\n`);
      }
      console.log('❌ 更新記錄生成失敗');
    }
  }
}

const generator = new GeminiChangelogGenerator();
generator.run().catch(console.error);
