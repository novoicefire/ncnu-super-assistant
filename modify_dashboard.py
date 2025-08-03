#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dashboard 點擊觸發修改腳本
將懸浮觸發改為點擊觸發，並支援點擊外部關閉功能
"""

import os
import re
import shutil
from datetime import datetime

def backup_files(files):
    """備份原始檔案"""
    backup_dir = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    os.makedirs(backup_dir, exist_ok=True)
    
    for file_path in files:
        if os.path.exists(file_path):
            filename = os.path.basename(file_path)
            backup_path = os.path.join(backup_dir, filename)
            shutil.copy2(file_path, backup_path)
            print(f"✅ 已備份: {filename} -> {backup_path}")
    
    return backup_dir

def modify_statuscard(filepath):
    """修改 StatusCard.jsx - 從懸浮觸發改為點擊觸發"""
    print("🔧 正在修改 StatusCard.jsx...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. 修改函式參數，加入 isOpen 和 onClick
    content = re.sub(
        r'const StatusCard = \(\s*\{([^}]+)\}\s*\) => \{',
        r'const StatusCard = ({ icon, title, value, status, cardContent, onClick, isOpen = false, isClickable = false, animationDelay = 0 }) => {',
        content
    )

    # 2. 移除 isHovered 狀態
    content = re.sub(r'\s*const \[isHovered, setIsHovered\] = useState\(false\);\s*', '', content)

    # 3. 移除 handleMouseEnter 函式
    content = re.sub(r'// 🎯 滑鼠進入處理\s*const handleMouseEnter = \(\) => \{[^}]*\};\s*', '', content, flags=re.DOTALL)

    # 4. 移除 handleMouseLeave 函式  
    content = re.sub(r'// 🎯 滑鼠離開處理\s*const handleMouseLeave = \(\) => \{[^}]*\};\s*', '', content, flags=re.DOTALL)

    # 5. 修改 handleClick 函式內容
    content = re.sub(
        r'(// 🎯 點擊處理\s*const handleClick = \([^)]*\) => \{)[^}]*(\};)',
        r'\1\n    e.stopPropagation();\n    if (onClick) {\n      onClick();\n    }\n  \2',
        content,
        flags=re.DOTALL
    )

    # 6. 修改 JSX 部分 - 移除 mouse events，改為 click
    content = re.sub(
        r'onMouseEnter=\{handleMouseEnter\}\s*onMouseLeave=\{handleMouseLeave\}',
        'onClick={handleClick}',
        content
    )

    # 7. 將彈窗顯示條件從 isHovered 改為 isOpen
    content = content.replace(
        '{isHovered && createPortal(<PopupCard />, document.body)}',
        '{isOpen && createPortal(<PopupCard />, document.body)}'
    )

    # 8. 加入 isOpen 狀態變化時重新計算位置的 useEffect
    useEffect_code = """
  // [新增] 當 isOpen 改變時重新計算位置
  useEffect(() => {
    if (isOpen) {
      setTimeout(calculatePopupPosition, 10);
    }
  }, [isOpen]);
"""
    # 在 calculatePopupPosition 函式之後插入
    content = re.sub(
        r'(// 🎯 計算卡片最佳位置[\s\S]*?\};)',
        r'\1' + useEffect_code,
        content,
        count=1
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ StatusCard.jsx 修改完成")

def modify_todaystatus(filepath):
    """修改 TodayStatus.jsx - 加入狀態管理和外部點擊關閉"""
    print("🔧 正在修改 TodayStatus.jsx...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. 加入 useRef 到 import
    content = content.replace(
        'import React, { useState, useEffect, useCallback } from',
        'import React, { useState, useEffect, useCallback, useRef } from'
    )

    # 2. 在函式開始處加入狀態管理
    insert_code = """
  // [新增] 點擊觸發狀態管理
  const [activeCard, setActiveCard] = useState(null);
  const todayStatusRef = useRef(null);

  // [新增] 點擊外部關閉功能
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (todayStatusRef.current && !todayStatusRef.current.contains(event.target)) {
        setActiveCard(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // [新增] 處理卡片點擊
  const handleCardClick = (cardId) => {
    setActiveCard(prevActiveCard => (prevActiveCard === cardId ? null : cardId));
  };
"""

    content = re.sub(
        r'(const TodayStatus = \(\) => \{)',
        r'\1' + insert_code,
        content
    )

    # 3. 為容器 div 加入 ref
    content = re.sub(
        r'(<div className={`today-status[^>]*>)',
        r'<div ref={todayStatusRef} className={`today-status${isCollapsed ? \' collapsed\' : \'\'}${todayData.isLoading ? \' loading\' : \'\'}`}>',
        content
    )

    # 4. 為所有 StatusCard 加入 isOpen 和 onClick 屬性
    def replace_statuscard(match):
        card_content = match.group(0)
        
        # 根據 title 確定 cardId
        title_match = re.search(r'title="([^"]+)"', card_content)
        if not title_match:
            return card_content
        
        title = title_match.group(1)
        card_id_map = {
            '今日課程': 'courses',
            '校園活動': 'events', 
            '總學分': 'credits'
        }
        
        card_id = card_id_map.get(title)
        if not card_id:
            return card_content
        
        # 如果已經有 isOpen，跳過
        if 'isOpen=' in card_content:
            return card_content
            
        # 在 animationDelay 之前插入新屬性
        new_content = re.sub(
            r'(animationDelay=\{\d+\})',
            f'isOpen={{activeCard === \'{card_id}\'}} onClick={{() => handleCardClick(\'{card_id}\')}} \\1',
            card_content
        )
        
        return new_content

    # 應用 StatusCard 修改
    content = re.sub(r'<StatusCard[^>]*\s*/>', replace_statuscard, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ TodayStatus.jsx 修改完成")

def modify_dashboard_css(filepath):
    """修改 Dashboard.css - 加入點擊觸發樣式"""
    print("🔧 正在修改 Dashboard.css...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # 1. 註解掉原本的 .status-card:hover 樣式
    result = []
    inside_hover_block = False
    brace_count = 0
    
    for line in lines:
        if '.status-card:hover' in line and '{' in line and not inside_hover_block:
            inside_hover_block = True
            brace_count = line.count('{') - line.count('}')
            result.append('/* [腳本修改] 原始懸浮樣式已註解\n')
            result.append(line)
        elif inside_hover_block:
            result.append(line)
            brace_count += line.count('{') - line.count('}')
            if brace_count <= 0:
                inside_hover_block = False
                result.append('*/\n')
        else:
            result.append(line)

    # 2. 加入新的點擊觸發樣式
    new_styles = """
/* ===== 點擊觸發樣式 (由腳本自動加入) ===== */

/* 卡片開啟狀態樣式 */
.status-card.is-open {
  transform: translateY(-2px);
  box-shadow: var(--theme-shadow-secondary);
  border-color: var(--primary-color) !important;
  z-index: 1001;
}

/* 可點擊卡片的懸浮效果 */
.status-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: var(--theme-shadow-primary);
}

/* 確保開啟狀態在懸浮時保持不變 */
.status-card.clickable.is-open:hover {
  transform: translateY(-2px);
  box-shadow: var(--theme-shadow-secondary);
}

/* 開啟狀態的箭頭動畫 */
.status-card.is-open .card-arrow {
  transform: translateX(4px);
  opacity: 1;
}

/* 可點擊卡片的游標 */
.status-card.clickable {
  cursor: pointer;
}

/* ===== 點擊觸發樣式結束 ===== */
"""

    result.append(new_styles)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(result)
    
    print("✅ Dashboard.css 修改完成")

def main():
    """主函式"""
    print("🚀 開始 Dashboard 點擊觸發修改...")
    print("=" * 50)
    
    # 定義檔案路徑
    base_dir = os.path.join('frontend', 'src', 'components', '0_Dashboard')
    files = {
        'statuscard': os.path.join(base_dir, 'StatusCard.jsx'),
        'todaystatus': os.path.join(base_dir, 'TodayStatus.jsx'), 
        'dashboard_css': os.path.join(base_dir, 'Dashboard.css')
    }
    
    # 檢查檔案是否存在
    missing_files = []
    for name, path in files.items():
        if not os.path.exists(path):
            missing_files.append(f"{name}: {path}")
    
    if missing_files:
        print("❌ 找不到以下檔案:")
        for file in missing_files:
            print(f"   {file}")
        print("\n請確保在專案根目錄執行此腳本。")
        return
    
    # 備份原始檔案
    print("📦 備份原始檔案...")
    backup_dir = backup_files(list(files.values()))
    print(f"📁 備份資料夾: {backup_dir}")
    
    try:
        # 執行修改
        modify_statuscard(files['statuscard'])
        modify_todaystatus(files['todaystatus'])  
        modify_dashboard_css(files['dashboard_css'])
        
        print("\n" + "=" * 50)
        print("🎉 修改完成！")
        print("\n📋 修改摘要:")
        print("   • StatusCard.jsx: 懸浮觸發 → 點擊觸發")
        print("   • TodayStatus.jsx: 加入狀態管理 & 外部點擊關閉")
        print("   • Dashboard.css: 加入點擊觸發樣式")
        
        print(f"\n💡 如果有問題，可以從 {backup_dir} 還原檔案")
        print("\n🔄 請重新啟動開發伺服器以查看效果:")
        print("   cd frontend && npm run dev")
        
    except Exception as e:
        print(f"\n❌ 修改過程中發生錯誤: {e}")
        print(f"💡 請從 {backup_dir} 還原檔案並手動修改")

if __name__ == '__main__':
    main()
