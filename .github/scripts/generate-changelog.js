// .github/scripts/generate-changelog.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ChangelogGenerator {
  constructor() {
    this.updateDataPath = 'frontend/src/components/5_UpdateLog/updateData.js';
    this.configPath = '.github/changelog-config.json';
  }

  // 🎯 從 git 獲取最新的 commits
  getRecentCommits() {
    try {
      // 獲取上次發布後的所有 commits
      const lastTag = this.getLastVersion();
      const gitRange = lastTag ? `${lastTag}..HEAD` : 'HEAD~10..HEAD';
      
      const commits = execSync(`git log ${gitRange} --pretty=format:"%h|%s|%an|%ad" --date=short`, { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [hash, message, author, date] = line.split('|');
          return { hash, message, author, date };
        });

      return commits;
    } catch (error) {
      console.log('No previous version found, analyzing recent commits...');
      return [];
    }
  }

  // 🎯 分析 commit 訊息並分類
  analyzeCommits(commits) {
    const config = this.loadConfig();
    const features = [];
    const improvements = [];
    const fixes = [];
    const technical = [];

    commits.forEach(commit => {
      const message = commit.message.toLowerCase();
      
      // 跳過自動生成的 commit
      if (message.includes('docs: 自動更新版本')) return;
      if (message.includes('merge pull request')) return;
      if (message.includes('merge branch')) return;

      // 根據關鍵字分類
      if (this.matchesKeywords(message, config.keywords.major) || 
          this.matchesKeywords(message, config.keywords.feature)) {
        features.push(this.formatFeature(commit.message));
      } else if (this.matchesKeywords(message, config.keywords.fix)) {
        fixes.push(this.formatFeature(commit.message));
      } else if (this.matchesKeywords(message, config.keywords.improvement)) {
        improvements.push(this.formatFeature(commit.message));
      } else if (this.matchesKeywords(message, config.keywords.technical)) {
        technical.push(this.formatFeature(commit.message));
      } else {
        // 預設歸類為改進
        improvements.push(this.formatFeature(commit.message));
      }
    });

    return { features, improvements, fixes, technical };
  }

  // 🎯 檢查訊息是否包含關鍵字
  matchesKeywords(message, keywords) {
    return keywords.some(keyword => message.includes(keyword));
  }

  // 🎯 格式化功能描述
  formatFeature(message) {
    // 移除 conventional commit 前綴
    let formatted = message.replace(/^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?:\s*/, '');
    
    // 確保首字母大寫
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    
    // 確保以適當的標點符號結尾
    if (!formatted.endsWith('.') && !formatted.endsWith('!') && !formatted.endsWith('。')) {
      formatted += '';
    }

    return formatted;
  }

  // 🎯 決定更新類型和版本號
  determineVersionAndType(analysis) {
    const currentVersion = this.getCurrentVersion();
    const hasFeatures = analysis.features.length > 0;
    const hasFixes = analysis.fixes.length > 0;
    const hasImprovements = analysis.improvements.length > 0;

    let newVersion, updateType, title;

    if (hasFeatures && (analysis.features.length >= 3 || 
        analysis.features.some(f => f.includes('新增') || f.includes('支援')))) {
      // 主要功能更新
      newVersion = this.incrementVersion(currentVersion, 'minor');
      updateType = 'major';
      title = this.generateTitle(analysis, 'major');
    } else if (hasFeatures) {
      // 新功能
      newVersion = this.incrementVersion(currentVersion, 'minor');
      updateType = 'feature';
      title = this.generateTitle(analysis, 'feature');
    } else if (hasFixes || hasImprovements) {
      // 修復或改進
      newVersion = this.incrementVersion(currentVersion, 'patch');
      updateType = hasFixes ? 'fix' : 'improvement';
      title = this.generateTitle(analysis, updateType);
    } else {
      // 沒有顯著變更
      return null;
    }

    return { newVersion, updateType, title };
  }

  // 🎯 生成更新標題
  generateTitle(analysis, type) {
    const templates = {
      major: [
        '重大功能更新',
        '系統核心升級', 
        '全面功能增強'
      ],
      feature: [
        '新功能發布',
        '功能擴展更新',
        '體驗優化升級'
      ],
      fix: [
        '問題修復更新',
        '穩定性改善',
        '錯誤修正版本'
      ],
      improvement: [
        '性能優化更新',
        '使用體驗改善',
        '介面優化升級'
      ]
    };

    const titleList = templates[type] || templates.improvement;
    return titleList[Math.floor(Math.random() * titleList.length)];
  }

  // 🎯 版本號管理
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
      case 'minor': return `${major}.${minor + 1}.0`;
      case 'patch': return `${major}.${minor}.${patch + 1}`;
      default: return `${major}.${minor}.${patch + 1}`;
    }
  }

  // 🎯 載入配置
  loadConfig() {
    try {
      return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    } catch {
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      keywords: {
        major: ['重大', '全面', '支援全校', '新增系所', 'major'],
        feature: ['新增', '實現', '支援', '建立', 'feat', 'add'],
        fix: ['修復', '解決', '修正', '修改', 'fix', 'resolve'],
        improvement: ['優化', '改善', '提升', '更新', '調整', 'improve', 'optimize'],
        technical: ['重構', '架構', '技術', 'refactor', 'tech']
      }
    };
  }

  // 🎯 生成新的更新記錄
  generateNewEntry(analysis, versionInfo) {
    const today = new Date().toISOString().split('T')[0];
    
    const entry = {
      version: `v${versionInfo.newVersion}`,
      date: today,
      type: versionInfo.updateType,
      title: versionInfo.title,
      description: this.generateDescription(analysis, versionInfo.updateType),
      features: []
    };

    // 合併所有功能描述
    if (analysis.features.length > 0) {
      entry.features.push(...analysis.features.map(f => `✨ ${f}`));
    }
    if (analysis.improvements.length > 0) {
      entry.features.push(...analysis.improvements.map(f => `⚡ ${f}`));
    }
    if (analysis.fixes.length > 0) {
      entry.features.push(...analysis.fixes.map(f => `🔧 ${f}`));
    }

    // 如果有技術細節，加入到 technical 字段
    if (analysis.technical.length > 0) {
      entry.technical = analysis.technical;
    }

    return entry;
  }

  generateDescription(analysis, type) {
    const descriptions = {
      major: '重大功能更新！本次版本帶來了顯著的功能擴展和使用體驗改善。',
      feature: '新功能發布！為您帶來更豐富的功能和更便捷的操作體驗。',
      fix: '問題修復更新，解決了使用中遇到的問題，提升系統穩定性。',
      improvement: '性能優化更新，改善使用體驗並提升系統響應速度。'
    };

    return descriptions[type] || descriptions.improvement;
  }

  // 🎯 更新 updateData.js 檔案
  updateChangelogFile(newEntry) {
    try {
      let content = fs.readFileSync(this.updateDataPath, 'utf8');
      
      // 找到 updateHistory 陣列
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

  // 🎯 主要執行函數
  async run() {
    console.log('🚀 開始生成自動更新記錄...');
    
    const commits = this.getRecentCommits();
    if (commits.length === 0) {
      console.log('📭 沒有找到新的 commits，跳過更新');
      console.log('::set-output name=has_changes::false');
      return;
    }

    console.log(`📝 分析 ${commits.length} 個 commits...`);
    const analysis = this.analyzeCommits(commits);
    
    const versionInfo = this.determineVersionAndType(analysis);
    if (!versionInfo) {
      console.log('📭 沒有顯著變更，跳過版本更新');
      console.log('::set-output name=has_changes::false');
      return;
    }

    console.log(`🎯 準備發布版本 ${versionInfo.newVersion} (${versionInfo.updateType})`);
    
    const newEntry = this.generateNewEntry(analysis, versionInfo);
    const success = this.updateChangelogFile(newEntry);
    
    if (success) {
      console.log('::set-output name=has_changes::true');
      console.log(`::set-output name=new_version::${versionInfo.newVersion}`);
      
      // 創建 git tag
      try {
        execSync(`git tag v${versionInfo.newVersion}`);
        console.log(`🏷️ 創建標籤 v${versionInfo.newVersion}`);
      } catch (error) {
        console.log('⚠️ 無法創建 git tag:', error.message);
      }
    } else {
      console.log('::set-output name=has_changes::false');
    }
  }
}

// 執行生成器
const generator = new ChangelogGenerator();
generator.run().catch(console.error);
