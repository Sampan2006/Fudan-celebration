import pandas as pd
import json
from datetime import datetime

def convert_timeline_data():
    # 读取Excel文件
    df = pd.read_excel('../assets/timeline.xlsx')
    
    # 转换为字典列表
    events = []
    for _, row in df.iterrows():
        # 确保年份是字符串格式
        year = str(row['年份']) if pd.notna(row['年份']) else ''
        
        event = {
            "year": year,
            "title": row['标题'] if pd.notna(row['标题']) else '',
            "description": row['描述'] if pd.notna(row['描述']) else '',
            "image": f"images/{row['图片']}" if pd.notna(row['图片']) else '',
            "category": row['类别'] if pd.notna(row['类别']) else 'general'
        }
        events.append(event)
    
    # 按年份排序
    events.sort(key=lambda x: x['year'])
    
    # 定义事件类别
    categories = {
        "milestone": {
            "name": "重要里程碑",
            "color": "#B40404"
        },
        "campus": {
            "name": "校园发展",
            "color": "#1B4B99"
        },
        "academic": {
            "name": "学术发展",
            "color": "#006633"
        },
        "general": {
            "name": "普通事件",
            "color": "#666666"
        }
    }
    
    timeline_data = {
        "events": events,
        "categories": categories
    }
    
    # 写入JSON文件
    with open('../assets/timeline-data.json', 'w', encoding='utf-8') as f:
        json.dump(timeline_data, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    convert_timeline_data() 