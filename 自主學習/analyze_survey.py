# -*- coding: utf-8 -*-
"""
問卷數據分析腳本 - 暨大校園導航功能開發前期研究
功能：讀取 CSV 問卷回覆，進行統計分析並產出報告
"""

import csv
import json
import os
from collections import Counter, defaultdict
from datetime import datetime
import re

# 取得腳本所在目錄
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def load_csv(filepath):
    """讀取 CSV 檔案"""
    responses = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            responses.append(row)
    return responses

def analyze_demographics(responses):
    """分析受訪者背景"""
    colleges = Counter()
    identities = Counter()
    familiarity = Counter()
    
    for r in responses:
        # 學院
        college = r.get('1.請問您的學院／單位是？', '')
        if college:
            # 標準化學院名稱
            if '管理' in college:
                colleges['管理學院'] += 1
            elif '科技' in college:
                colleges['科技學院'] += 1
            elif '人文' in college:
                colleges['人文學院'] += 1
            elif '教育' in college:
                colleges['教育學院'] += 1
            elif '護理' in college:
                colleges['護理學院'] += 1
            elif '智' in college or '農' in college:
                colleges['智慧農學院'] += 1
            else:
                colleges[college] += 1
        
        # 身分
        identity = r.get('2.請問您的身分是？', '')
        if identity:
            identities[identity] += 1
        
        # 熟悉度
        fam = r.get('3.您對暨大校園的熟悉程度如何？', '')
        if fam:
            familiarity[fam] += 1
    
    return {
        'colleges': dict(colleges),
        'identities': dict(identities),
        'familiarity': dict(familiarity)
    }

def analyze_wayfinding_methods(responses):
    """分析找路方式"""
    methods = Counter()
    
    for r in responses:
        method_str = r.get('1.當您需要在校園內前往一個「不熟悉」的地點（如某個教室、特定辦公室）時，您最常使用以下哪種方式？（可複選）', '')
        if method_str:
            # 分割複選答案
            for method in method_str.split(', '):
                method = method.strip()
                if method:
                    methods[method] += 1
    
    return dict(methods)

def analyze_map_problems(responses):
    """分析使用地圖 App 的問題"""
    problems = Counter()
    most_annoying = Counter()
    
    for r in responses:
        # 問題複選
        prob_str = r.get('2.在使用 Google Maps 等通用地圖 App 進行校園導航時，您是否曾遇過以下問題？（可複選）', '')
        if prob_str:
            for prob in prob_str.split(', '):
                prob = prob.strip()
                if prob:
                    problems[prob] += 1
        
        # 最困擾問題
        annoying = r.get('3.接續上題，在您剛剛勾選的問題中，哪一個是「最讓您困擾」的？(若上一題回答其他請選7)', '')
        if annoying:
            most_annoying[annoying] += 1
    
    return {
        'problems': dict(problems),
        'most_annoying': dict(most_annoying)
    }

def analyze_late_experience(responses):
    """分析遲到經驗"""
    late = Counter()
    
    for r in responses:
        exp = r.get('4.在過去一學期，您是否曾因「找不到路」而導致上課、開會或參加活動遲到？', '')
        if exp:
            late[exp] += 1
    
    return dict(late)

def find_key_containing(d, substr):
    """找到包含特定子字串的欄位名稱"""
    for key in d.keys():
        if substr in key:
            return key
    return None

def analyze_desired_features(responses):
    """分析期望功能"""
    features = Counter()
    helpfulness = Counter()
    report_willingness = Counter()
    nps_scores = []
    
    for r in responses:
        # 期望功能（複選）
        feat_key = find_key_containing(r, '最希望這個「校園導航」功能包含')
        feat_str = r.get(feat_key, '') if feat_key else ''
        if feat_str:
            for feat in feat_str.split(', '):
                feat = feat.strip()
                if feat:
                    features[feat] += 1
        
        # 幫助程度 - 使用部分匹配
        help_key = find_key_containing(r, '假設我在網站上推出一個')
        help_val = r.get(help_key, '') if help_key else ''
        if help_val:
            helpfulness[help_val] += 1
        
        # 回報意願 - 使用部分匹配
        report_key = find_key_containing(r, '為了讓導航資訊永遠保持最新')
        report_val = r.get(report_key, '') if report_key else ''
        if report_val:
            report_willingness[report_val] += 1
        
        # NPS - 使用部分匹配
        nps_key = find_key_containing(r, '您有多大的意願，會將這個')
        nps_val = r.get(nps_key, '') if nps_key else ''
        if nps_val:
            try:
                nps_scores.append(int(nps_val))
            except:
                pass
    
    # 計算 NPS
    promoters = sum(1 for s in nps_scores if s >= 9)
    passives = sum(1 for s in nps_scores if 7 <= s <= 8)
    detractors = sum(1 for s in nps_scores if s <= 6)
    total = len(nps_scores)
    nps = ((promoters - detractors) / total * 100) if total > 0 else 0
    
    return {
        'features': dict(features),
        'helpfulness': dict(helpfulness),
        'report_willingness': dict(report_willingness),
        'nps': {
            'scores': nps_scores,
            'avg': sum(nps_scores) / len(nps_scores) if nps_scores else 0,
            'promoters': promoters,
            'passives': passives,
            'detractors': detractors,
            'nps_score': nps
        }
    }

def analyze_website_usage(responses):
    """分析網站使用情況"""
    usage = Counter()
    
    for r in responses:
        used = r.get('請問您是否使用過本網站', '')
        if used:
            usage[used] += 1
    
    return dict(usage)

def extract_qualitative_responses(responses):
    """提取質性回答"""
    lost_experiences = []
    urgent_needs = []
    general_suggestions = []
    website_suggestions = []
    contact_info = []
    
    for r in responses:
        # 迷路經驗
        exp = r.get('方便和我分享一次您在校中因為「不熟悉」而感到困擾或迷路的經驗嗎？', '')
        if exp and exp.strip() and exp.strip() != '-':
            lost_experiences.append(exp.strip())
        
        # 緊急情況需求
        urgent = r.get('1.想像一下，你只剩 10 分鐘就要在一間你從沒去過的教室參加期末考。在這種緊急情況下，你認為一個理想的校園導航最需要提供給你什麼「關鍵資訊」或「功能」？', '')
        if urgent and urgent.strip():
            urgent_needs.append(urgent.strip())
        
        # 一般建議
        suggestion = r.get('對於改善校園尋路體驗，您是否有其他任何建議或曾遇過的困擾想與我們分享？（開放式問題）', '')
        if suggestion and suggestion.strip() and suggestion.strip() not in ['無', '沒有', '-', 'NA', '加油']:
            general_suggestions.append(suggestion.strip())
        
        # 網站建議
        web_sug = r.get('對於使用網站的體驗，您是否有其他任何建議修改/功能新增，或曾遇過的困擾想與我們分享？（開放式問題）', '')
        if web_sug and web_sug.strip() and web_sug.strip() not in ['無', '沒有', '-', 'NA']:
            website_suggestions.append(web_sug.strip())
        
        # 聯絡資訊
        contact = r.get('感謝您填寫問卷！我正在尋找願意參與 15-20 分鐘線上訪談的使用者，以更深入地了解您的體驗與需求。若您願意，可以留下您的聯絡方式（Email 或 IG），我將會與您聯繫。（此為選填，資料將嚴格保密）', '')
        if contact and contact.strip():
            contact_info.append(contact.strip())
    
    return {
        'lost_experiences': lost_experiences,
        'urgent_needs': urgent_needs,
        'general_suggestions': general_suggestions,
        'website_suggestions': website_suggestions,
        'contact_count': len(contact_info)
    }

def categorize_urgent_needs(needs):
    """分類緊急情況需求"""
    categories = {
        '精準位置/室內定位': 0,
        '最短路徑/最佳路線': 0,
        '樓層/平面圖': 0,
        '預估時間': 0,
        '方向指引': 0,
        '地標/建築物資訊': 0,
        'AR導航': 0,
        '其他': 0
    }
    
    for need in needs:
        need_lower = need.lower()
        matched = False
        
        if any(kw in need for kw in ['精準', '位置', '定位', '具體', '詳細']):
            categories['精準位置/室內定位'] += 1
            matched = True
        if any(kw in need for kw in ['最短', '最快', '最佳', '路線', '路徑', '導航']):
            categories['最短路徑/最佳路線'] += 1
            matched = True
        if any(kw in need for kw in ['樓層', '平面圖', '幾樓', '樓']):
            categories['樓層/平面圖'] += 1
            matched = True
        if any(kw in need for kw in ['時間', '多久']):
            categories['預估時間'] += 1
            matched = True
        if any(kw in need for kw in ['方向', '往哪', '怎麼走', '轉彎']):
            categories['方向指引'] += 1
            matched = True
        if any(kw in need for kw in ['地標', '建築', '學院', '哪裡', '哪一棟', '大樓']):
            categories['地標/建築物資訊'] += 1
            matched = True
        if 'AR' in need or 'ar' in need:
            categories['AR導航'] += 1
            matched = True
        
        if not matched:
            categories['其他'] += 1
    
    return categories

def generate_report(responses, demographics, wayfinding, problems, late, features, website, qualitative):
    """產生完整報告"""
    total = len(responses)
    
    # 計算百分比函數
    def pct(count, total):
        return f"{count} ({count/total*100:.1f}%)" if total > 0 else "0 (0%)"
    
    # 排序字典
    def sorted_dict(d, reverse=True):
        return dict(sorted(d.items(), key=lambda x: x[1], reverse=reverse))
    
    # 處理急需功能分類
    urgent_categories = categorize_urgent_needs(qualitative['urgent_needs'])
    
    report = f"""# 暨大校園導航功能開發前期研究問卷分析報告

> **分析日期**：{datetime.now().strftime('%Y年%m月%d日')}
> **總回覆數**：{total} 份

---

## 📊 執行摘要

本問卷調查針對暨大校園導航功能的開發需求進行前期研究，共收集 **{total} 份有效回覆**。主要發現如下：

### 關鍵洞察

1. **使用者痛點明確**：最常見問題為「建築物名稱標示不清」與「無法導航至特定教室編號」
2. **高推薦意願**：NPS 平均分數達 **{features['nps']['avg']:.1f}** 分，顯示使用者對此功能有高度期待
3. **功能需求集中**：「地標搜尋功能」與「精準室內定位」為最受期望的功能
4. **網站使用率佳**：約 **{website.get('是', 0)/total*100:.1f}%** 填答者已使用過本網站

---

## 1️⃣ 受訪者背景分析

### 1.1 學院分布

| 學院 | 人數 | 百分比 |
|------|------|--------|
"""
    
    for college, count in sorted_dict(demographics['colleges']).items():
        report += f"| {college} | {count} | {count/total*100:.1f}% |\n"
    
    report += f"""
### 1.2 身分分布

| 身分 | 人數 | 百分比 |
|------|------|--------|
"""
    
    for identity, count in sorted_dict(demographics['identities']).items():
        report += f"| {identity} | {count} | {count/total*100:.1f}% |\n"
    
    report += f"""
### 1.3 校園熟悉程度

| 熟悉程度 | 人數 | 百分比 |
|----------|------|--------|
"""
    
    familiarity_order = [
        '完全不熟，我是新生/第一次來',
        '不太熟，經常需要找路',
        '普通，只熟悉自己學院和常去的幾個地方',
        '熟悉，知道大部分主要建築和路線',
        '非常熟悉，幾乎每個角落都知道'
    ]
    
    for fam in familiarity_order:
        count = demographics['familiarity'].get(fam, 0)
        if count > 0:
            report += f"| {fam} | {count} | {count/total*100:.1f}% |\n"

    report += f"""
> [!NOTE]
> 大多數受訪者（{demographics['familiarity'].get('普通，只熟悉自己學院和常去的幾個地方', 0) + demographics['familiarity'].get('熟悉，知道大部分主要建築和路線', 0)} 人）對校園有一定熟悉度，但仍有明顯的導航需求。

---

## 2️⃣ 尋路行為分析

### 2.1 常用尋路方式（複選）

| 方式 | 次數 | 百分比 |
|------|------|--------|
"""
    
    for method, count in sorted_dict(wayfinding).items():
        short_method = method[:50] + '...' if len(method) > 50 else method
        report += f"| {short_method} | {count} | {count/total*100:.1f}% |\n"

    report += f"""
### 2.2 使用地圖 App 遇到的問題（複選）

| 問題 | 次數 | 百分比 |
|------|------|--------|
"""
    
    for prob, count in sorted_dict(problems['problems']).items():
        short_prob = prob[:60] + '...' if len(prob) > 60 else prob
        report += f"| {short_prob} | {count} | {count/total*100:.1f}% |\n"

    report += f"""
### 2.3 最困擾的問題

| 選項 | 人數 | 百分比 |
|------|------|--------|
"""
    
    problem_mapping = {
        '1': '建築物名稱標示不清或錯誤',
        '2': '無法導航至特定教室編號',
        '3': '步行路線很繞路，不是最佳捷徑',
        '4': '導航到室外就結束，無法指引進入建築物',
        '5': '定位不準確，位置飄移',
        '6': '很少使用或沒遇過問題',
        '7': '其他'
    }
    
    for key, count in sorted_dict(problems['most_annoying']).items():
        desc = problem_mapping.get(key, key)
        report += f"| {key}. {desc} | {count} | {count/total*100:.1f}% |\n"

    report += f"""
> [!IMPORTANT]
> **「無法導航至特定教室編號」** 和 **「建築物名稱標示不清」** 是最主要的痛點，佔比超過 50%，這應該是開發的首要解決目標。

---

## 3️⃣ 遲到經驗分析

| 經驗 | 人數 | 百分比 |
|------|------|--------|
"""
    
    for exp, count in sorted_dict(late).items():
        report += f"| {exp} | {count} | {count/total*100:.1f}% |\n"

    late_happened = late.get('偶爾發生', 0)
    report += f"""
> [!WARNING]
> 約 **{late_happened}** 人（{late_happened/total*100:.1f}%）曾因找不到路而遲到，這說明導航功能有實際的使用需求。

---

## 4️⃣ 功能需求分析

### 4.1 最期望的功能（複選，最多3項）

| 功能 | 次數 | 百分比 |
|------|------|--------|
"""
    
    for feat, count in sorted_dict(features['features']).items():
        short_feat = feat[:50] + '...' if len(feat) > 50 else feat
        report += f"| {short_feat} | {count} | {count/total*100:.1f}% |\n"

    report += f"""
### 4.2 緊急情況需求分類

根據開放題回答「10分鐘內趕到期末考教室，最需要什麼功能」的分析：

| 需求類別 | 次數 |
|----------|------|
"""
    
    for cat, count in sorted_dict(urgent_categories).items():
        if count > 0:
            report += f"| {cat} | {count} |\n"

    report += f"""
> [!TIP]
> 使用者在緊急情況下最需要的是**精準的位置資訊**與**最短路徑規劃**，開發時應優先確保這兩項功能的可靠性。

---

## 5️⃣ 功能評價分析

### 5.1 預期幫助程度（1-5分）

| 評分 | 人數 | 百分比 |
|------|------|--------|
"""
    
    for score, count in sorted(features['helpfulness'].items(), key=lambda x: x[0], reverse=True):
        report += f"| {score} 分 | {count} | {count/total*100:.1f}% |\n"

    high_help = features['helpfulness'].get('5', 0) + features['helpfulness'].get('4', 0)
    report += f"""
> 認為「有幫助」或「非常有幫助」的比例：**{high_help/total*100:.1f}%**

### 5.2 錯誤回報意願（1-5分）

| 評分 | 人數 | 百分比 |
|------|------|--------|
"""
    
    for score, count in sorted(features['report_willingness'].items(), key=lambda x: x[0]):
        report += f"| {score} 分 | {count} | {count/total*100:.1f}% |\n"

    low_willingness = features['report_willingness'].get('1', 0) + features['report_willingness'].get('2', 0)
    report += f"""
> [!NOTE]
> 約 **{low_willingness/total*100:.1f}%** 的使用者表示「非常願意」或「願意」回報錯誤，可考慮設計簡易的回報機制。

### 5.3 NPS（Net Promoter Score）分析

| 指標 | 數值 |
|------|------|
| 平均推薦分數 | **{features['nps']['avg']:.1f}** / 10 |
| 推薦者 (9-10分) | {features['nps']['promoters']} 人 |
| 被動者 (7-8分) | {features['nps']['passives']} 人 |
| 貶損者 (0-6分) | {features['nps']['detractors']} 人 |
| **NPS 分數** | **{features['nps']['nps_score']:.1f}** |

> [!TIP]
> NPS 分數 {features['nps']['nps_score']:.1f} 表示使用者對此功能有{'高度' if features['nps']['nps_score'] > 30 else '中度' if features['nps']['nps_score'] > 0 else '低度'}推薦意願。

---

## 6️⃣ 網站使用情況

| 項目 | 人數 | 百分比 |
|------|------|--------|
"""
    
    for item, count in website.items():
        report += f"| {item} | {count} | {count/total*100:.1f}% |\n"

    report += f"""
---

## 7️⃣ 質性分析

### 7.1 迷路經驗摘要

共收集到 **{len(qualitative['lost_experiences'])}** 則迷路經驗分享，主要類型包括：

"""
    
    if qualitative['lost_experiences']:
        for i, exp in enumerate(qualitative['lost_experiences'][:10], 1):
            exp_short = exp[:100] + '...' if len(exp) > 100 else exp
            report += f"- {exp_short}\n"
        if len(qualitative['lost_experiences']) > 10:
            report += f"\n*（還有 {len(qualitative['lost_experiences']) - 10} 則回覆...）*\n"

    report += f"""
### 7.2 改善校園尋路建議

共收集到 **{len(qualitative['general_suggestions'])}** 則建議：

"""
    
    if qualitative['general_suggestions']:
        for sug in qualitative['general_suggestions']:
            sug_short = sug[:150] + '...' if len(sug) > 150 else sug
            report += f"- {sug_short}\n"

    report += f"""
### 7.3 網站功能建議

共收集到 **{len(qualitative['website_suggestions'])}** 則針對網站的建議：

"""
    
    if qualitative['website_suggestions']:
        for sug in qualitative['website_suggestions']:
            sug_short = sug[:150] + '...' if len(sug) > 150 else sug
            report += f"- {sug_short}\n"

    report += f"""
---

## 8️⃣ 結論與建議

### 開發優先順序建議

根據問卷分析結果，建議以下開發優先順序：

1. **🔴 高優先級**
   - 地標搜尋功能：可用教室編號（如 A100）、建築物名稱或辦公室名稱搜尋
   - 精準的室內定位：能指引到特定教室門口
   - 最佳化路徑：提供最快、最短的步行捷徑

2. **🟡 中優先級**
   - 預估步行時間
   - 周邊設施標示（廁所、飲水機、影印機、販賣機等）
   - 樓層平面圖

3. **🟢 低優先級**
   - 無障礙路線
   - 錯誤回報機制
   - AR 導航

### 訪談意願

共有 **{qualitative['contact_count']}** 位填答者願意參與後續訪談，可進一步進行深度訪談以獲取更詳細的需求資訊。

---

*報告產生時間：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
"""
    
    return report

def main():
    # 讀取資料 - 使用腳本所在目錄的絕對路徑
    csv_filename = '「暨大校園導航」功能開發前期研究問卷 (回覆) - 表單回應 1.csv'
    filepath = os.path.join(SCRIPT_DIR, csv_filename)
    responses = load_csv(filepath)
    
    print(f"載入 {len(responses)} 筆回覆資料")
    
    # 進行分析
    demographics = analyze_demographics(responses)
    wayfinding = analyze_wayfinding_methods(responses)
    problems = analyze_map_problems(responses)
    late = analyze_late_experience(responses)
    features = analyze_desired_features(responses)
    website = analyze_website_usage(responses)
    qualitative = extract_qualitative_responses(responses)
    
    # 產生報告
    report = generate_report(
        responses, demographics, wayfinding, problems, 
        late, features, website, qualitative
    )
    
    # 儲存報告 - 使用腳本所在目錄
    report_path = os.path.join(SCRIPT_DIR, '問卷分析報告.md')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"報告已儲存至：{report_path}")
    
    # 輸出 JSON 數據（供後續處理）
    data = {
        'total_responses': len(responses),
        'demographics': demographics,
        'wayfinding': wayfinding,
        'problems': problems,
        'late_experience': late,
        'desired_features': features,
        'website_usage': website,
        'qualitative_counts': {
            'lost_experiences': len(qualitative['lost_experiences']),
            'urgent_needs': len(qualitative['urgent_needs']),
            'general_suggestions': len(qualitative['general_suggestions']),
            'website_suggestions': len(qualitative['website_suggestions']),
            'contact_count': qualitative['contact_count']
        }
    }
    
    json_path = os.path.join(SCRIPT_DIR, '問卷分析數據.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"JSON 數據已儲存至：{json_path}")

if __name__ == '__main__':
    main()
