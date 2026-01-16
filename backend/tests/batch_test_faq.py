"""
批量测试客户问题提取能力 (Batch Test)

功能：
1. 连接 Supabase 数据库获取真实转录数据
2. 预处理提取客户语音
3. 批量调用混元 Lite API 进行分析
4. 生成统计报告
"""

import json
import time
import psycopg2
from openai import OpenAI
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm

# 配置
HUNYUAN_API_KEY = "sk-t5eMk6ZZSLu3CJlYpMmsPVNQQMcBrjY4N2uxhkfkMP3PgKv0"
HUNYUAN_BASE_URL = "https://api.hunyuan.cloud.tencent.com/v1"
DB_CONNECTION = "postgresql://postgres.ugzelbolcskrwcrgxqjf:2tZNtDeW8nI0NWJR@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

# 扩展的固定分类列表（基于方案1，增加了几个常见类别）
CATEGORIES = [
    "服务范围",    # 能不能做XX、做什么部位
    "价格咨询",    # 多少钱、怎么收费
    "质保期",      # 保修多久、出问题怎么办
    "上门时间",    # 什么时候来、能约什么时候
    "服务人员",    # 师傅专业吗、是自己的还是外包
    "施工流程",    # 怎么做、需要多久
    "联系方式",    # 留电话、加微信
    "其他",        # 不属于以上类别
]

# 方案1优化版 Prompt - 完整对话格式 + 严格只提取问题
EXTRACTION_PROMPT = """你是一个客户服务分析专家。请从以下销售通话记录中，提取出【客户】提出的问题。

要求：
1. 只提取客户说的问题（带问号或疑问语气的句子）
2. 不要提取客户的陈述、描述、确认或回应
3. 对每个问题进行分类（服务范围、价格咨询、质保期、上门时间、服务人员、施工流程、联系方式、其他）
4. 以 JSON 格式输出

输出格式：
```json
{
  "questions": [
    {"question": "客户原话", "category": "分类"}
  ]
}
```

通话记录：
"""

def format_dialog(transcript_json):
    """将转录数据格式化为完整对话格式（方案1核心）"""
    try:
        data = json.loads(transcript_json)
        dialog_lines = []
        for item in data:
            speaker = "销售" if item.get("SpeakerId") == "1" else "客户"
            text = item.get("Text", "").strip()
            if text:
                dialog_lines.append(f"[{speaker}] {text}")
        return "\n".join(dialog_lines)
    except:
        return ""

client = OpenAI(api_key=HUNYUAN_API_KEY, base_url=HUNYUAN_BASE_URL)

def get_transcripts(limit=20):
    """从数据库获取转录数据"""
    print(f"🔌 连接数据库...")
    try:
        conn = psycopg2.connect(DB_CONNECTION)
        cur = conn.cursor()
        
        # 获取长度适中的转录文本
        query = """
            SELECT id, deal_id, content
            FROM sync_transcripts
            WHERE LENGTH(content) > 1000 AND LENGTH(content) < 8000
            ORDER BY RANDOM()
            LIMIT %s;
        """
        cur.execute(query, (limit,))
        rows = cur.fetchall()
        
        print(f"✅ 成功获取 {len(rows)} 条数据")
        conn.close()
        return rows
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        return []

def preprocess_transcript(transcript_json):
    """预处理：只提取客户说的话"""
    try:
        data = json.loads(transcript_json)
        customer_texts = []
        for item in data:
            if item.get("SpeakerId") == "2":
                text = item.get("Text", "").strip()
                if text and len(text) > 1:
                    customer_texts.append(f"- {text}")
        return "\n".join(customer_texts)
    except:
        return ""

def analyze_transcript(row):
    """分析单条数据 - 方案1：完整对话格式"""
    tid, did, content = row
    
    # 格式化为完整对话（方案1核心改动）
    dialog_text = format_dialog(content)
    if not dialog_text:
        return None
        
    start_time = time.time()
    try:
        response = client.chat.completions.create(
            model="hunyuan-lite",
            messages=[
                {"role": "system", "content": "你是一个专业的客户服务分析助手。"},
                {"role": "user", "content": EXTRACTION_PROMPT + dialog_text}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        duration = time.time() - start_time
        result = response.choices[0].message.content
        
        # 解析结果
        questions = []
        try:
            json_str = result
            if "```json" in result:
                json_str = result.split("```json")[1].split("```")[0]
            elif "```" in result:
                json_str = result.split("```")[1].split("```")[0]
            
            parsed = json.loads(json_str.strip())
            questions = parsed.get("questions", [])
        except:
            pass
            
        return {
            "id": tid,
            "questions": questions,
            "duration": duration,
            "text_length": len(dialog_text)
        }
    except Exception as e:
        print(f"Error analyzing {tid}: {e}")
        return None

def run_batch_test():
    print("🚀 开始批量测试 (N=20)...")
    
    # 1. 获取数据
    rows = get_transcripts(20)
    if not rows:
        return
        
    results = []
    
    # 2. 并行处理
    print("⚡ 正在调用 AI 分析...")
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(analyze_transcript, row) for row in rows]
        for future in tqdm(futures, total=len(rows)):
            res = future.result()
            if res:
                results.append(res)
                
    # 3. 统计结果
    total_questions = sum(len(r["questions"]) for r in results)
    avg_time = sum(r["duration"] for r in results) / len(results) if results else 0
    categories = {}
    
    for r in results:
        for q in r["questions"]:
            # 跳过非字典类型（小模型有时返回格式不正确）
            if not isinstance(q, dict):
                continue
            # 兼容两种格式: q/c 或 question/category
            cat = q.get("c") or q.get("category") or "未分类"
            categories[cat] = categories.get(cat, 0) + 1
            
    # 4. 输出报告
    print("\n" + "="*50)
    print("📊 批量测试报告 (优化后)")
    print("="*50)
    print(f"成功分析样本数: {len(results)} / {len(rows)}")
    print(f"提取问题总数: {total_questions}")
    print(f"平均每单耗时: {avg_time:.2f} 秒")
    print(f"平均每单问题数: {total_questions / len(results):.1f}")
    
    print("\n🏆 问题分类 TOP 10:")
    sorted_cats = sorted(categories.items(), key=lambda x: x[1], reverse=True)
    for cat, count in sorted_cats[:10]:
        print(f"  - {cat}: {count}")
        
    print("\n💡 典型问题示例:")
    sample_count = 0
    for r in results[:5]:
        for q in r["questions"]:
            if sample_count >= 8: break
            question = q.get("q") or q.get("question") or ""
            category = q.get("c") or q.get("category") or ""
            if len(question) > 5:  # 只显示有意义的问题
                print(f"  [{category}] {question}")
                sample_count += 1

if __name__ == "__main__":
    run_batch_test()
