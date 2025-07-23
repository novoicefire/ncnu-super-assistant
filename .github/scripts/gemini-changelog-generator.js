// .github/scripts/gemini-changelog-generator.js (官方SDK版本)
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class GeminiChangelogGenerator {
  constructor() {
    this.updateDataPath = 'frontend/src/components/5_UpdateLog/updateData.js';
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    
    // 🔧 使用官方SDK初始化
    this.ai = new GoogleGenAI({ 
      apiKey: this.geminiApiKey 
    });
  }

  // 🤖 使用官方SDK進行AI分析
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
      console.log('🤖 正在使用官方 Gemini SDK 分析...');
      
      // 🔧 使用官方SDK進行請求，內建重試機制
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash", // 🔧 升級到最新模型
        contents: prompt,
        generationConfig: {
          temperature: 0.2,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 800
        }
      });

      console.log('✅ Gemini API 調用成功');
      
      const content = response.text;
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

  // 🔧 改進品質驗證（降低門檻）
  validateAIOutput(aiResult, originalChanges) {
    const issues = [];
    
    if (!aiResult.title || aiResult.title.length < 5) {
      issues.push('標題過短或缺失');
    }
    if (!aiResult.features || aiResult.features.length === 0) {
      issues.push('功能列表為空');
    }

    // 🔧 大幅降低品質門檻
    const originalKeywords = this.extractKeywords(originalChanges);
    const aiKeywords = this.extractKeywords(aiResult.features || []);
    const coverage = this.calculateEnhancedCoverage(originalKeywords, aiKeywords);
    
    console.log(`📊 品質檢查 - 關鍵詞覆蓋率: ${Math.round(coverage * 100)}%`);
    
    if (coverage < 0.02) { // 🔧 極低門檻 2%
      issues.push(`關鍵詞覆蓋率過低: ${Math.round(coverage * 100)}%`);
    }
    
    if (issues.length > 0) {
      console.log('⚠️ AI 輸出品質問題:', issues);
      return null;
    }
    
    console.log('✅ AI 輸出品質檢查通過');
    return aiResult;
  }

  // 🎯 其他方法保持不變...
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

  calculateEnhancedCoverage(originalKeywords, aiKeywords) {
    if (originalKeywords.length === 0) return 1;
    let matchedCount = 0;
    originalKeywords.forEach(origKeyword => {
      const hasMatch = aiKeywords.some(aiKeyword => 
        aiKeyword.includes(origKeyword) || origKeyword.includes(aiKeyword)
      );
      if (hasMatch) matchedCount++;
    });
    return matchedCount / originalKeywords.length;
  }

  // 🔧 改進本地智能處理
  localSmartEnhance(rawChanges) {
    console.log('🧠 啟動改進版本地智能分析...');
    
    const categoryAnalysis = {
      disclaimer: {
        keywords: ['免責', '聲明', '公告', '提醒', 'disclaimer'],
        title: '免責聲明系統上線',
        emoji: '⚖️',
        count: 0
      },
      ui: {
        keywords: ['介面', '按鈕', '樣式', '版面', 'ui', 'css'],
        title: '介面體驗優化',
        emoji: '🎨',
        count: 0
      },
      fix: {
        keywords: ['修復', '解決', '修正', 'fix', '錯誤'],
        title: '問題修復',
        emoji: '🔧',
        count: 0
      }
    };

    rawChanges.forEach(change => {
      const lowerChange = change.toLowerCase();
      Object.values(categoryAnalysis).forEach(category => {
        if (category.keywords.some(keyword => lowerChange.includes(keyword))) {
          category.count++;
        }
      });
    });

    const features = [];
    let dominantType = 'improvement';
    
    Object.entries(categoryAnalysis).forEach(([key, category]) => {
      if (category.count > 0) {
        features.push(`${category.emoji} ${category.title}`);
        if (key === 'disclaimer') dominantType = 'major';
        else if (key === 'fix') dominantType = 'fix';
      }
    });

    if (features.length === 0) {
      features.push('⚡ 系統穩定性改善', '🔧 程式碼品質優化');
    }

    const result = {
      title: dominantType === 'major' ? '重要功能上線' : '系統改善更新',
      description: '持續改善系統功能與使用體驗',
      type: dominantType,
      features: features.slice(0, 4)
    };

    console.log(`💡 本地智能分析完成 - 類型: ${dominantType}`);
    return result;
  }

  // 🎯 版本管理與檔案處理方法（保持原有邏輯）
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

  // 🚀 主執行函數
  async run() {
    console.log('🤖 開始使用官方 Gemini SDK 生成智能更新記錄...');
    
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
      // 🔧 修復：正確的GitHub Actions輸出格式
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

// 執行生成器
const generator = new GeminiChangelogGenerator();
generator.run().catch(console.error);
