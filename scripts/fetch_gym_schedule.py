"""
NCNU 體育館開放時間 PDF 解析與更新腳本
功能：
1. 從體育組網站下載最新的開放時間 PDF
2. 解析表格並提取開放時間資訊
3. 更新前端靜態 JS 檔案 (gymScheduleData.js)
可透過 GitHub Actions 每週自動執行並 commit 回 repo
"""

import requests
from bs4 import BeautifulSoup
import pdfplumber
import os
import re
from datetime import datetime, date
from urllib.parse import urljoin

# 體育組網站設定
BASE_URL = "https://pe.ncnu.edu.tw"
SCHEDULE_PAGE_URL = "https://pe.ncnu.edu.tw/p/406-1040-592,r39.php?Lang=zh-tw"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DATA_PATH = os.path.join(SCRIPT_DIR, '..', 'frontend', 'src', 'components', '0_Dashboard', 'gymScheduleData.js')


def fetch_pdf_links():
    """從網頁抓取所有開放時間 PDF 的下載連結"""
    print("正在從體育組網站抓取 PDF 連結...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    response = requests.get(SCHEDULE_PAGE_URL, headers=headers)
    response.encoding = 'utf-8'
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    pdf_links = []
    for link in soup.find_all('a', href=True):
        href = link.get('href')
        text = link.get_text(strip=True)
        
        # 尋找包含「開放時間」且為 PDF 的連結
        if '開放時間' in text and ('downloadfile' in href or href.endswith('.pdf')):
            full_url = urljoin(BASE_URL, href)
            # 從文字中提取年份和月份（民國年）
            match = re.search(r'(\d+)年(\d+)月', text)
            if match:
                roc_year = int(match.group(1))
                month = int(match.group(2))
                # 民國年轉西元年
                western_year = roc_year + 1911
                pdf_links.append({
                    'url': full_url,
                    'text': text,
                    'year': western_year,
                    'month': month,
                    'roc_year': roc_year,
                    'filename': f"gym_schedule_{roc_year}_{month:02d}.pdf"
                })
    
    print(f"找到 {len(pdf_links)} 個開放時間 PDF")
    return pdf_links


def download_pdf(pdf_info):
    """下載 PDF 文件"""
    url = pdf_info['url']
    filename = pdf_info['filename']
    filepath = os.path.join(SCRIPT_DIR, filename)
    
    print(f"正在下載 {pdf_info['text']}...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        with open(filepath, 'wb') as f:
            f.write(response.content)
        print(f"已儲存至 {filepath}")
        return filepath
    else:
        print(f"下載失敗，狀態碼：{response.status_code}")
        return None


def parse_pdf_schedule(pdf_path):
    """解析 PDF 中的開放時間表格"""
    print(f"正在解析 {pdf_path}...")
    
    all_data = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            # 提取表格
            tables = page.extract_tables()
            
            for table in tables:
                if table:
                    # 清理表格數據
                    for row in table:
                        cleaned_row = []
                        for cell in row:
                            if cell:
                                # 清理換行和多餘空白
                                cell = re.sub(r'\s+', ' ', str(cell).strip())
                            else:
                                cell = ''
                            cleaned_row.append(cell)
                        
                        # 過濾空行
                        if any(cleaned_row):
                            all_data.append(cleaned_row)
    
    return all_data


def update_available_data_range(file_content, pdf_links):
    """更新 AVAILABLE_DATA_RANGE 的日期範圍"""
    if not pdf_links:
        return file_content
    
    # 找出最早和最晚的月份
    earliest = min(pdf_links, key=lambda x: (x['year'], x['month']))
    latest = max(pdf_links, key=lambda x: (x['year'], x['month']))
    
    # 計算日期範圍
    start_year = earliest['year']
    start_month = earliest['month'] - 1  # JS 月份從 0 開始
    end_year = latest['year']
    end_month = latest['month'] - 1
    
    # 計算該月最後一天
    import calendar
    _, last_day = calendar.monthrange(latest['year'], latest['month'])
    
    # 建立新的 AVAILABLE_DATA_RANGE
    new_range = f"""// 可用資料的月份範圍（根據已下載的 PDF 時間表）
// {earliest['roc_year']}年{earliest['month']}月 = {earliest['year']}-{earliest['month']:02d}, {latest['roc_year']}年{latest['month']}月 = {latest['year']}-{latest['month']:02d}
export const AVAILABLE_DATA_RANGE = {{
    start: new Date({start_year}, {start_month}, 1),  // {start_year}年{earliest['month']}月1日 (月份從0開始)
    end: new Date({end_year}, {end_month}, {last_day}),   // {end_year}年{latest['month']}月{last_day}日
}};"""
    
    # 使用正則表達式替換
    pattern = r'// 可用資料的月份範圍.*?export const AVAILABLE_DATA_RANGE = \{[^}]+\};'
    updated_content = re.sub(pattern, new_range, file_content, flags=re.DOTALL)
    
    return updated_content


def update_gym_schedule_data(pdf_links):
    """更新 gymScheduleData.js 的日期範圍"""
    if not os.path.exists(FRONTEND_DATA_PATH):
        print(f"找不到 {FRONTEND_DATA_PATH}")
        return False
    
    try:
        with open(FRONTEND_DATA_PATH, 'r', encoding='utf-8') as f:
            content = f.read()
        
        updated_content = update_available_data_range(content, pdf_links)
        
        if updated_content != content:
            with open(FRONTEND_DATA_PATH, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"已更新 {FRONTEND_DATA_PATH}")
            return True
        else:
            print("檔案內容無變更")
            return False
    except Exception as e:
        print(f"更新檔案失敗：{e}")
        return False


def check_and_update_schedules():
    """
    主要更新流程：
    1. 檢查網站是否有新的 PDF
    2. 下載並解析 PDF
    3. 更新前端靜態 JS 檔案
    """
    print("=" * 60)
    print("NCNU 體育館開放時間自動更新")
    print(f"執行時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # 1. 抓取 PDF 連結
    pdf_links = fetch_pdf_links()
    
    if pdf_links:
        print(f"\n找到 {len(pdf_links)} 個開放時間 PDF:")
        for pdf in pdf_links:
            print(f"  - {pdf['text']} ({pdf['year']}/{pdf['month']:02d})")
        
        # 2. 更新前端靜態 JS 檔案
        updated = update_gym_schedule_data(pdf_links)
        
        if updated:
            print("\n✅ gymScheduleData.js 已更新！")
        else:
            print("\n⚠️ 無需更新或更新失敗")
    else:
        print("找不到任何開放時間 PDF")
    
    print("\n" + "=" * 60)
    print("更新流程結束")
    print("=" * 60)


def main():
    """主程式入口"""
    check_and_update_schedules()


if __name__ == "__main__":
    main()
