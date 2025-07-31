#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自動檢查與修改 CSS 檔案的 Python 腳本
功能：
- 檢查特定 CSS 規則是否存在和正確性
- 自動修復缺失或錯誤的樣式
- 支援 Navbar.css 的 IBS 按鈕相關修復
- 自動備份檔案和生成報告

使用方式：
python check_and_fix_css.py
"""

import re
import os
import shutil
from datetime import datetime

class CSSCheckerAndFixer:
    def __init__(self, css_file_path="frontend/src/components/Navbar.css"):
        self.css_file_path = css_file_path
        self.backup_path = f"{css_file_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # 定義要檢查的規則清單（可擴展）
        self.rules_to_check = [
            {
                'name': 'desktop-nav-section 顯示規則',
                'pattern': r'\.desktop-nav-section\s*\{\s*display:\s*flex',
                'expected': True,  # 是否應該存在
                'fix': '''
/* ===== 桌面版專用導航區域 ===== */
.desktop-nav-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}
                '''
            },
            {
                'name': '手機版隱藏 desktop-nav-section',
                'pattern': r'@media\s*\(max-width:\s*768px\)\s*\{\s*\.desktop-nav-section\s*\{\s*display:\s*none',
                'expected': True,
                'fix': '''
/* 📱 手機版隱藏桌面版導航區域 */
@media (max-width: 768px) {
  .desktop-nav-section {
    display: none !important;
  }
}
                '''
            },
            {
                'name': '重複的 desktop-nav-section 規則',
                'pattern': r'\.desktop-nav-section\s*\{',
                'expected_count': 1,  # 預期出現次數
                'fix': 'remove_duplicates'  # 特殊指令：移除重複
            },
            # 您可以在这里添加更多規則
        ]

    def create_backup(self):
        """創建備份檔案"""
        try:
            shutil.copy2(self.css_file_path, self.backup_path)
            print(f"✅ 已創建備份檔案: {self.backup_path}")
            return True
        except Exception as e:
            print(f"❌ 備份失敗: {e}")
            return False

    def read_css(self):
        """讀取 CSS 檔案"""
        try:
            with open(self.css_file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"❌ 讀取檔案失敗: {e}")
            return None

    def write_css(self, content):
        """寫入修改後的 CSS"""
        try:
            with open(self.css_file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ 已寫入修改後的檔案: {self.css_file_path}")
            return True
        except Exception as e:
            print(f"❌ 寫入檔案失敗: {e}")
            return False

    def check_rules(self, css_content):
        """檢查 CSS 規則"""
        report = []
        for rule in self.rules_to_check:
            matches = len(re.findall(rule['pattern'], css_content, re.DOTALL | re.IGNORECASE))
            
            if 'expected_count' in rule:
                is_valid = matches == rule['expected_count']
                status = f"找到 {matches} 個 (預期: {rule['expected_count']})"
            else:
                is_valid = (matches > 0) == rule['expected']
                status = "存在" if matches > 0 else "不存在"
            
            report.append({
                'name': rule['name'],
                'status': status,
                'is_valid': is_valid,
                'matches': matches
            })
        
        return report

    def fix_rules(self, css_content, report):
        """自動修復問題"""
        modified_content = css_content
        
        for item in report:
            rule = next(r for r in self.rules_to_check if r['name'] == item['name'])
            
            if not item['is_valid']:
                print(f"🔧 修復規則: {item['name']}")
                
                if 'fix' in rule:
                    if rule['fix'] == 'remove_duplicates':
                        # 移除重複規則
                        modified_content = re.sub(rule['pattern'], '', modified_content, count=item['matches'] - 1)
                        print(f"  ✅ 已移除 {item['matches'] - 1} 個重複規則")
                    else:
                        # 添加缺失規則
                        if not modified_content.endswith('\n'):
                            modified_content += '\n'
                        modified_content += rule['fix'] + '\n'
                        print("  ✅ 已添加缺失規則")
        
        return modified_content

    def generate_report(self, report):
        """生成檢查報告"""
        output = "\n=== CSS 檢查報告 ===\n"
        for item in report:
            status = "✅ 正常" if item['is_valid'] else "❌ 需要修復"
            output += f"{item['name']}: {item['status']} - {status}\n"
        return output

    def run(self):
        """執行完整流程"""
        print("🚀 開始自動檢查與修改 CSS 檔案...")
        print(f"📁 目標檔案: {self.css_file_path}")
        
        # 步驟1: 創建備份
        if not self.create_backup():
            return
        
        # 步驟2: 讀取檔案
        css_content = self.read_css()
        if css_content is None:
            return
        
        # 步驟3: 檢查規則
        report = self.check_rules(css_content)
        print(self.generate_report(report))
        
        # 步驟4: 自動修復
        fixed_content = self.fix_rules(css_content, report)
        
        # 步驟5: 寫入修改
        if fixed_content != css_content:
            self.write_css(fixed_content)
            print("\n🎉 修改完成！請檢查修復後的檔案。")
        else:
            print("\n✅ 檔案已正常，無需修改。")

if __name__ == "__main__":
    # 預設檔案路徑，您可以修改
    css_file = "frontend/src/components/Navbar.css"  # 修改為您的實際路徑
    
    fixer = CSSCheckerAndFixer(css_file)
    fixer.run()
