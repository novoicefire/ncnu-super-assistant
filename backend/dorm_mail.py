# backend/dorm_mail.py - 宿舍包裹查詢模組
"""
宿舍包裹查詢模組
負責從學校宿舍包裹系統爬取未領取包裹資訊，並提供篩選功能
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
import re


def fetch_dorm_mail_data():
    """
    從學校宿舍包裹系統爬取包裹資料
    
    Returns:
        list: 包裹資料列表，每個項目包含：
            - id: 包裹編號
            - arrival_time: 到達時間
            - recipient: 收件人姓名（部分遮蔽）
            - carrier: 物流公司
            - type: 類型（包裹/掛號）
            - tracking_number: 追蹤號碼
            - department: 系所班級
            - days_since_arrival: 到達天數
        若失敗則返回 None
    """
    url = "https://ccweb.ncnu.edu.tw/dormmail/Default.asp"
    
    try:
        # 不設定 encoding，讓 requests 自動偵測
        response = requests.get(url, timeout=10)
        
        # 嘗試偵測正確的編碼
        # 學校網站可能使用 Big5 或 UTF-8
        if response.apparent_encoding:
            response.encoding = response.apparent_encoding
        else:
            # 手動嘗試常見編碼
            try:
                # 先嘗試 Big5（台灣常用）
                test_content = response.content.decode('big5')
                response.encoding = 'big5'
            except:
                try:
                    # 再嘗試 UTF-8
                    test_content = response.content.decode('utf-8')
                    response.encoding = 'utf-8'
                except:
                    # 最後使用 gb2312
                    response.encoding = 'gb2312'
        
        print(f"Debug: 使用編碼 {response.encoding}")
        
        if response.status_code != 200:
            print(f"Error: Failed to fetch data, status code: {response.status_code}")
            return None
        
        return parse_dorm_mail_html(response.text)
    
    except requests.exceptions.Timeout:
        print("Error: Request timeout when fetching dorm mail data")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Error: Request failed: {e}")
        return None
    except Exception as e:
        print(f"Error: Unexpected error when fetching dorm mail data: {e}")
        return None


def parse_dorm_mail_html(html_content):
    """
    解析 HTML 內容並提取包裹資訊
    
    學校網站使用全形空格 (U+3000) 分隔欄位，資料格式為：
    　編號　日期　收件人　郵寄公司　種類　追蹤號碼　系所　天數　
    
    Args:
        html_content: HTML 字串
        
    Returns:
        list: 解析後的包裹資料列表
    """
    soup = BeautifulSoup(html_content, 'lxml')
    mail_list = []
    
    try:
        # 取得所有文字內容
        body = soup.find('body')
        if not body:
            print("Error: Cannot find body element")
            return []
        
        text_content = body.get_text()
        
        # 用全形空格 (U+3000) 分隔所有內容
        FULLWIDTH_SPACE = '\u3000'
        parts = text_content.split(FULLWIDTH_SPACE)
        
        # 過濾空白項目和換行
        parts = [p.strip() for p in parts if p.strip()]
        
        print(f"Debug: 總共分隔出 {len(parts)} 個部分")
        
        # 尋找包含日期格式的項目作為資料開始點（YYYY/MM/DD 或 YYYY/M/D）
        i = 0
        while i < len(parts):
            part = parts[i]
            
            # 檢查是否包含日期格式 (YYYY/MM/DD)
            if '/' in part and ('2025' in part or '2024' in part or '2023' in part or 
                                '2022' in part or '2021' in part or '2020' in part or
                                '2019' in part or '2018' in part or '2017' in part or
                                '2016' in part or '2015' in part or '2014' in part or
                                '2013' in part or '2012' in part or '2011' in part or
                                '2010' in part):
                # 找到日期，往前一個應該是編號
                if i > 0:
                    # 確保有足夠的欄位
                    if i + 6 < len(parts):
                        try:
                            mail_item = {
                                'id': parts[i - 1].strip(),
                                'arrival_time': part.strip(),
                                'recipient': parts[i + 1].strip() if i + 1 < len(parts) else '',
                                'carrier': parts[i + 2].strip() if i + 2 < len(parts) else '',
                                'type': parts[i + 3].strip() if i + 3 < len(parts) else '',
                                'tracking_number': parts[i + 4].strip() if i + 4 < len(parts) else '',
                                'department': parts[i + 5].strip() if i + 5 < len(parts) else '',
                                'days_since_arrival': parts[i + 6].strip() if i + 6 < len(parts) else ''
                            }
                            
                            # 驗證資料有效性
                            recipient_name = mail_item['recipient']
                            if recipient_name and mail_item['id']:
                                # 收件人名字應該是中文名，長度通常 2-5 字
                                if 1 <= len(recipient_name) <= 10:
                                    mail_list.append(mail_item)
                                    print(f"Debug: 成功解析包裹 {mail_item['id']} - {mail_item['recipient']}")
                            
                            # 跳過已處理的欄位
                            i += 7
                        except (IndexError, ValueError) as e:
                            print(f"Debug: 解析錯誤在索引 {i}: {e}")
                            i += 1
                    else:
                        i += 1
                else:
                    i += 1
            else:
                i += 1
        
        print(f"Successfully parsed {len(mail_list)} mail items")
        return mail_list
        
    except Exception as e:
        print(f"Error: Failed to parse HTML content: {e}")
        import traceback
        traceback.print_exc()
        return []


def filter_by_department(mail_list, department):
    """
    依系所班級篩選包裹
    
    Args:
        mail_list: 包裹資料列表
        department: 系所名稱（如：「資工系」）
        
    Returns:
        list: 篩選後的包裹列表
    """
    if not mail_list or not department:
        return []
    
    filtered = []
    department = department.strip()
    
    for mail in mail_list:
        # 支援部分匹配（例如「資工」可以匹配「資工系碩1」）
        if department in mail.get('department', ''):
            filtered.append(mail)
    
    return filtered


def filter_by_name(mail_list, name_pattern):
    """
    依姓名格式篩選包裹
    
    支援多種匹配方式：
    1. 完整匹配：「武Ｏ星」匹配「武Ｏ星」
    2. 只輸入姓氏：「武」匹配所有姓武的
    3. 完整姓名（自動轉換）：「武星星」匹配「武Ｏ星」（自動將中間字替換為Ｏ）
    
    Args:
        mail_list: 包裹資料列表
        name_pattern: 姓名格式（如：「武Ｏ星」或「武星星」）
        
    Returns:
        list: 篩選後的包裹列表
    """
    if not mail_list or not name_pattern:
        return []
    
    filtered = []
    name_pattern = name_pattern.strip()
    
    for mail in mail_list:
        recipient = mail.get('recipient', '')
        
        # 方式 1：完全匹配
        if name_pattern == recipient:
            filtered.append(mail)
            continue
        
        # 方式 2：部分匹配 - 只輸入姓氏
        if len(name_pattern) == 1 and recipient.startswith(name_pattern):
            filtered.append(mail)
            continue
        
        # 方式 3：智慧匹配 - 完整姓名轉換為「姓Ｏ名」格式
        # 例如：「武星星」→ 檢查是否匹配「武Ｏ星」
        if len(name_pattern) >= 2:
            # 如果輸入的是完整姓名（沒有Ｏ），自動轉換
            if 'Ｏ' not in name_pattern and 'O' not in name_pattern:
                # 將中間的字替換為Ｏ進行匹配
                # 例如：「武星星」(3字) → 「武Ｏ星」
                if len(name_pattern) == 3:
                    # 三字姓名：姓 + Ｏ + 名
                    converted_pattern = name_pattern[0] + 'Ｏ' + name_pattern[2]
                    if converted_pattern == recipient:
                        filtered.append(mail)
                        continue
                elif len(name_pattern) == 2:
                    # 二字姓名：姓 + 名（可能沒有中間字）
                    # 直接匹配或嘗試加Ｏ
                    if name_pattern == recipient:
                        filtered.append(mail)
                        continue
                elif len(name_pattern) == 4:
                    # 四字姓名：可能是複姓或姓名各兩字
                    # 嘗試：姓(2字) + Ｏ + 名 或 姓 + Ｏ + 名(2字)
                    # 先嘗試：前兩字 + Ｏ + 最後一字
                    converted1 = name_pattern[:2] + 'Ｏ' + name_pattern[3]
                    if converted1 == recipient:
                        filtered.append(mail)
                        continue
                    # 再嘗試：第一字 + Ｏ + 後兩字
                    converted2 = name_pattern[0] + 'Ｏ' + name_pattern[2:]
                    if converted2 == recipient:
                        filtered.append(mail)
                        continue
            
            # 如果已經包含Ｏ，嘗試部分匹配
            # 移除收件人姓名中的Ｏ進行比對
            recipient_without_o = recipient.replace('Ｏ', '').replace('O', '')
            pattern_without_o = name_pattern.replace('Ｏ', '').replace('O', '')
            
            # 如果去掉Ｏ後還有2個字以上，且都包含在對方中
            if len(pattern_without_o) >= 2 and len(recipient_without_o) >= 2:
                if pattern_without_o in recipient_without_o or recipient_without_o in pattern_without_o:
                    filtered.append(mail)
    
    return filtered


def get_all_departments(mail_list):
    """
    從包裹列表中提取所有不重複的系所
    
    Args:
        mail_list: 包裹資料列表
        
    Returns:
        list: 系所名稱列表（已排序）
    """
    if not mail_list:
        return []
    
    departments = set()
    for mail in mail_list:
        dept = mail.get('department', '').strip()
        if dept:
            departments.add(dept)
    
    return sorted(list(departments))
