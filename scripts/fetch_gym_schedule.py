"""
NCNU 體育館開放時間 PDF 解析腳本
功能：從體育組網站下載最新的開放時間 PDF，解析表格並轉換為 CSV 格式
"""

import requests
from bs4 import BeautifulSoup
import pdfplumber
import csv
import os
import re
from datetime import datetime
from urllib.parse import urljoin

# 設定
BASE_URL = "https://pe.ncnu.edu.tw"
SCHEDULE_PAGE_URL = "https://pe.ncnu.edu.tw/p/406-1040-592,r39.php?Lang=zh-tw"
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

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
            # 從文字中提取年份和月份
            match = re.search(r'(\d+)年(\d+)月', text)
            if match:
                year = match.group(1)
                month = match.group(2).zfill(2)
                pdf_links.append({
                    'url': full_url,
                    'text': text,
                    'year': year,
                    'month': month,
                    'filename': f"gym_schedule_{year}_{month}.pdf"
                })
    
    print(f"找到 {len(pdf_links)} 個開放時間 PDF")
    return pdf_links

def download_pdf(pdf_info):
    """下載 PDF 文件"""
    url = pdf_info['url']
    filename = pdf_info['filename']
    filepath = os.path.join(OUTPUT_DIR, filename)
    
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

def extract_schedule_info(raw_data, year, month):
    """從原始表格數據提取結構化的開放時間資訊"""
    schedule_entries = []
    
    current_facility = None  # 游泳館 或 健身房
    headers = None
    
    for row in raw_data:
        row_text = ' '.join(row).lower()
        
        # 判斷設施類型
        if '游泳' in row_text or 'pool' in row_text.lower():
            current_facility = '游泳館'
            continue
        elif '健身' in row_text or 'gym' in row_text.lower():
            current_facility = '健身房'
            continue
        
        # 嘗試識別表頭（通常包含「日期」、「時間」等關鍵字）
        if any(keyword in row_text for keyword in ['日期', '星期', '時段', '時間', '開放']):
            headers = row
            continue
        
        # 嘗試識別日期行（包含數字日期）
        if row and len(row) >= 2:
            first_cell = row[0]
            # 檢查是否為日期（數字或包含日期格式）
            if re.match(r'^(\d{1,2})[\/\-日]?', first_cell):
                entry = {
                    'year': year,
                    'month': month,
                    'facility': current_facility or '未知設施',
                    'date': first_cell,
                    'raw_data': row
                }
                
                # 如果有表頭，嘗試對應
                if headers and len(headers) == len(row):
                    for i, header in enumerate(headers):
                        if header:
                            entry[header] = row[i]
                
                schedule_entries.append(entry)
    
    return schedule_entries

def save_to_csv(data, output_filename):
    """將數據儲存為 CSV 格式"""
    if not data:
        print("沒有數據可儲存")
        return None
    
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    # 取得所有欄位
    all_keys = set()
    for row in data:
        all_keys.update(row.keys())
    
    # 確保基本欄位在前面
    priority_keys = ['year', 'month', 'facility', 'date']
    ordered_keys = priority_keys + [k for k in sorted(all_keys) if k not in priority_keys and k != 'raw_data']
    
    with open(output_path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=ordered_keys, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(data)
    
    print(f"CSV 已儲存至 {output_path}")
    return output_path

def save_raw_tables_to_csv(tables_data, pdf_info):
    """將原始表格數據直接儲存為 CSV（備用方案）"""
    output_filename = f"gym_schedule_{pdf_info['year']}_{pdf_info['month']}_raw.csv"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    with open(output_path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        for row in tables_data:
            writer.writerow(row)
    
    print(f"原始表格 CSV 已儲存至 {output_path}")
    return output_path

def process_schedule(pdf_info, keep_pdf=False):
    """完整處理流程：下載 → 解析 → 轉換 CSV"""
    # 下載 PDF
    pdf_path = download_pdf(pdf_info)
    if not pdf_path:
        return None
    
    # 解析 PDF
    raw_data = parse_pdf_schedule(pdf_path)
    
    if not raw_data:
        print("無法從 PDF 中提取表格數據")
        return None
    
    # 儲存原始表格（作為備用輸出）
    raw_csv = save_raw_tables_to_csv(raw_data, pdf_info)
    
    # 嘗試提取結構化數據
    structured_data = extract_schedule_info(raw_data, pdf_info['year'], pdf_info['month'])
    
    if structured_data:
        structured_csv = save_to_csv(
            structured_data, 
            f"gym_schedule_{pdf_info['year']}_{pdf_info['month']}_structured.csv"
        )
    else:
        print("無法提取結構化數據，請參考原始表格 CSV")
        structured_csv = None
    
    # 清理 PDF 文件（可選）
    if not keep_pdf and os.path.exists(pdf_path):
        os.remove(pdf_path)
        print(f"已刪除暫存 PDF: {pdf_path}")
    
    return {
        'raw_csv': raw_csv,
        'structured_csv': structured_csv
    }

def main():
    """主程式"""
    print("=" * 60)
    print("NCNU 體育館開放時間 PDF 解析工具")
    print("=" * 60)
    
    # 抓取 PDF 連結
    pdf_links = fetch_pdf_links()
    
    if not pdf_links:
        print("找不到任何開放時間 PDF")
        return
    
    print("\n找到以下開放時間表：")
    for i, pdf in enumerate(pdf_links, 1):
        print(f"  {i}. {pdf['text']}")
    
    # 處理所有 PDF
    results = []
    for pdf_info in pdf_links:
        print(f"\n{'=' * 40}")
        result = process_schedule(pdf_info, keep_pdf=True)
        if result:
            results.append({
                'info': pdf_info,
                'result': result
            })
    
    # 彙總結果
    print("\n" + "=" * 60)
    print("處理完成！")
    print("=" * 60)
    
    for r in results:
        print(f"\n{r['info']['text']}:")
        if r['result']['raw_csv']:
            print(f"  - 原始表格: {r['result']['raw_csv']}")
        if r['result']['structured_csv']:
            print(f"  - 結構化數據: {r['result']['structured_csv']}")

if __name__ == "__main__":
    main()
