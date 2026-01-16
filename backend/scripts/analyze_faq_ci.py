#!/usr/bin/env python3
"""
FAQ Analysis Script for CI/Local (Multi-DB Support)
使用 Hunyuan-Lite 从客服通话中提取高质量 FAQ 问题
支持 PostgreSQL (生产) 和 SQLite (本地测试)
"""

import os
import json
import time
import argparse
import re
import sqlite3
from datetime import datetime, timedelta
from openai import OpenAI
from tqdm import tqdm

# 尝试导入 PostgreSQL 支持 (可选)
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    print("ℹ️  提示: psycopg2 未安装，将使用 SQLite 模式")

def load_env_local():
    """读取 .env.local 文件中的环境变量"""
    try:
        if os.path.exists(".env.local"):
            with open(".env.local", "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, value = line.split("=", 1)
                        if key.strip() == "HUNYUAN_API_KEY":
                            return value.strip().strip('"').strip("'")
    except Exception as e:
        print(f"⚠️  读取 .env.local 失败: {e}")
    return None

# 环境变量 (优先从环境变量读取，其次从 .env.local)
DATABASE_URL = os.getenv("DATABASE_URL")
HUNYUAN_API_KEY = os.getenv("HUNYUAN_API_KEY") or load_env_local()
HUNYUAN_BASE_URL = "https://api.hunyuan.cloud.tencent.com/v1"

# 配置
CONTEXT_WINDOW = 20
CATEGORIES = [
    "价格咨询", "服务范围", "上门时间", "质保期",
    "服务人员", "施工流程", "联系方式", "公司资质",
    "材料品牌", "施工周期", "付款方式", "优惠活动",
    "其他问题", "非问题"
]

def get_db_connection(db_url=None):
    """获取数据库连接，自动检测类型"""
    if not db_url:
        # 默认使用本地 SQLite
        db_url = "team-calls.db"
    
    if db_url.startswith("postgres://") or db_url.startswith("postgresql://"):
        if not PSYCOPG2_AVAILABLE:
            raise RuntimeError("PostgreSQL URL 需要安装 psycopg2-binary")
        print(f"🔗 连接 PostgreSQL...")
        return psycopg2.connect(db_url, sslmode='require'), 'postgres'
    else:
        # SQLite (文件路径)
        print(f"🔗 连接 SQLite: {db_url}")
        return sqlite3.connect(db_url), 'sqlite'

def ensure_schema(conn, db_type):
    """确保数据库表结构存在"""
    if db_type == 'postgres':
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS biz_faq_questions (
                    id TEXT PRIMARY KEY,
                    deal_id TEXT,
                    transcript_id TEXT,
                    call_id TEXT,
                    "timestamp" BIGINT,
                    question TEXT,
                    category TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            cur.execute("""
                CREATE TABLE IF NOT EXISTS log_prompt_execution (
                    id TEXT PRIMARY KEY,
                    prompt_id TEXT,
                    call_id TEXT,
                    input_variables TEXT,
                    raw_output TEXT,
                    execution_time_ms INTEGER,
                    status TEXT,
                    error_message TEXT,
                    is_dry_run BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # [自动修复] 尝试移除 call_id 的 NOT NULL 约束，以允许空值
            try:
                cur.execute("ALTER TABLE log_prompt_execution ALTER COLUMN call_id DROP NOT NULL")
                conn.commit()
                print("✅ 已更新 schema: log_prompt_execution.call_id 允许为空")
            except Exception as e:
                conn.rollback()
                # 忽略错误（可能是已经允许为空，或表不存在等其他情况）
                # print(f"⚠️Schema 调整跳过: {e}")

            # [自动修复] 确保 prompt_id = 'faq_v3_ci' 存在于 cfg_prompts 表中
            try:
                # 兼容 Prisma Schema: id, name, content, description, prompt_type, created_at, updated_at
                cur.execute("""
                    INSERT INTO cfg_prompts 
                    (id, name, content, description, prompt_type, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """, (
                    'faq_v3_ci', 
                    'FAQ V3 Analysis (CI)', 
                    'Actual prompt is dynamically built in script: analyze_faq_ci.py', 
                    'GitHub Actions 自动 FAQ 提取 (V3 策略)', 
                    'analysis', 
                    datetime.now(), 
                    datetime.now()
                ))
                conn.commit()
                print("✅ 已确保 Prompt ID 'faq_v3_ci' 存在")
                
            except Exception as e:
                conn.rollback()
                print(f"⚠️ 无法注册 Prompt ID: {e}")

            conn.commit()
    else:  # SQLite
        cursor = conn.cursor()
        # SQLite 表通常已存在，这里做兼容性检查
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS biz_faq_questions (
                id TEXT PRIMARY KEY,
                deal_id TEXT,
                transcript_id TEXT,
                call_id TEXT,
                timestamp INTEGER,
                question TEXT,
                category TEXT,
                created_at TEXT
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS log_prompt_execution (
                id TEXT PRIMARY KEY,
                prompt_id TEXT,
                call_id TEXT,
                input_variables TEXT,
                raw_output TEXT,
                execution_time_ms INTEGER,
                status TEXT,
                error_message TEXT,
                is_dry_run INTEGER DEFAULT 0,
                created_at TEXT
            )
        """)
        conn.commit()

def format_timestamp(ms):
    """毫秒转 MM:SS"""
    seconds = ms // 1000
    return f"{seconds // 60:02d}:{seconds % 60:02d}"

def is_valid_safety_check(text):
    """启发式过滤噪音"""
    if len(text) < 2:
        return False
    
    clean_text = re.sub(r'[。，！？、\.,;!?\s]', '', text).strip()
    if len(clean_text) < 2:
        return False
    
    STOPWORDS = {
        "喂", "喂喂", "哎", "你好", "嗯", "嗯嗯", "嗯啊",
        "好", "好的", "好吧", "对", "对对", "对的", "行", "行的",
        "啊", "哦", "噢", "呃", "额", "诶",
        "是", "是的", "可以", "没问题",
        "谢谢", "谢谢你", "再见", "拜拜", "不用了", "不需要",
        "知道了", "明白", "了解", "收到"
    }
    if clean_text in STOPWORDS:
        return False
        
    digit_count = sum(1 for c in text if c.isdigit() or c in "零一二三四五六七八九幺")
    if len(text) > 0 and (digit_count / len(text)) > 0.5:
        return False
        
    return True

def analyze_transcript(client, conn, cur, transcript_id, deal_id, call_id, content, db_type='postgres'):
    """分析单个通话记录"""
    extracted_questions = []
    placeholder = '%s' if db_type == 'postgres' else '?'
    
    # 解析 content (可能是 JSON 字符串或已解析的对象)
    try:
        if isinstance(content, str):
            transcript_items = json.loads(content)
        else:
            transcript_items = content
    except:
        return []
    
    context_buffer = []
    
    for item in transcript_items:
        speaker = item.get("SpeakerId", "")
        text = item.get("Text", "").strip()
        timestamp = item.get("BeginTime", 0)
        
        if not text:
            continue
            
        context_buffer.append({"speaker": speaker, "text": text})
        if len(context_buffer) > CONTEXT_WINDOW:
            context_buffer.pop(0)
        
        if speaker == "2" and len(text) >= 4 and is_valid_safety_check(text):
            # 构建 Prompt
            history_str = "\n".join([
                f"{'销售' if c['speaker'] == '1' else '客户'}: {c['text']}"
                for c in context_buffer[:-1]
            ])
            
            prompt = f"""你是一个客服对话分类助手。你的任务是判断客户发言是否为提问，并从以下分类中选择一个。

## 可选分类（必须从中选择）：
1. 价格咨询 - 询问费用、报价、价格、多少钱、贵不贵
2. 服务范围 - 询问能否处理某类问题、是否提供某项服务、能不能做
3. 上门时间 - 询问什么时候能来、多久到、预约时间、今天/明天可以吗
4. 质保期 - 询问保修期限、质保多久、售后保障
5. 服务人员 - 询问师傅资质、是否外包、技术人员信息
6. 施工流程 - 询问怎么做、施工步骤、工艺方法、要做什么
7. 联系方式 - 询问电话、微信、如何联系、留个号码
8. 公司资质 - 询问公司规模、资质证书、是否正规、什么公司
9. 材料品牌 - 询问使用什么材料、品牌、材料质量
10. 施工周期 - 询问要做多久、工期、几天能完工
11. 付款方式 - 询问怎么付款、能否分期、什么时候付
12. 优惠活动 - 询问有没有优惠、折扣、活动
13. 其他问题 - 是提问，但不属于以上任何分类（将被系统丢弃，请谨慎选择）
14. 非问题 - 不是提问（陈述、回应、语气词、拒绝、报号码）

## 对话上下文：
{history_str}

## 当前客户发言：
"{text}"

## 输出要求：
- 只输出 JSON 格式
- category 必须是上面 14 个分类之一
- 格式: {{"category": "分类名", "reason": "简短理由"}}"""

            # 调用 LLM
            trace_id = f"faq_trace_{transcript_id}_{timestamp}"
            start_time = time.time()
            
            try:
                response = client.chat.completions.create(
                    model="hunyuan-lite",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1,
                    timeout=30
                )
                raw_output = response.choices[0].message.content.strip()
                execution_time = int((time.time() - start_time) * 1000)
                
                # 统一使用 Upsert 逻辑记录日志
                if db_type == 'postgres':
                    sql = """
                        INSERT INTO log_prompt_execution 
                        (id, prompt_id, call_id, input_variables, raw_output, 
                         execution_time_ms, status, error_message, is_dry_run, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE SET
                            raw_output = EXCLUDED.raw_output,
                            execution_time_ms = EXCLUDED.execution_time_ms,
                            status = EXCLUDED.status
                    """
                    cur.execute(sql, (
                        trace_id, "faq_v3_ci", call_id, prompt, raw_output, 
                        execution_time, "success", "", 0, datetime.now()
                    ))
                else:  # SQLite
                    sql = """
                        INSERT OR REPLACE INTO log_prompt_execution 
                        (id, prompt_id, call_id, input_variables, raw_output, 
                         execution_time_ms, status, error_message, is_dry_run, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """
                    cur.execute(sql, (
                        trace_id, "faq_v3_ci", call_id, prompt, raw_output, 
                        execution_time, "success", "", 0, datetime.now().isoformat()
                    ))
                conn.commit()
                print(f"    📝 已记录日志: {trace_id[:50]}...")
                
                # 解析结果
                result = json.loads(raw_output)
                category = result.get("category", "")
                
                # V3 策略: 严格过滤
                if category in CATEGORIES and category not in ["非问题", "其他问题", "其他"]:
                    extracted_questions.append({
                        "timestamp": timestamp,
                        "question": text,
                        "category": category,
                        "time_display": format_timestamp(timestamp)
                    })
                    
            except Exception as e:
                # 记录错误
                if db_type == 'postgres':
                    sql = """
                        INSERT INTO log_prompt_execution 
                        (id, prompt_id, call_id, input_variables, raw_output, 
                         execution_time_ms, status, error_message, is_dry_run, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO NOTHING
                    """
                    cur.execute(sql, (
                        trace_id, "faq_v3_ci", call_id, prompt, "",  # 使用 call_id（可能是 None/NULL）
                        0, "error", str(e), 0, datetime.now()
                    ))
                else:  # SQLite
                    sql = """
                        INSERT OR REPLACE INTO log_prompt_execution 
                        (id, prompt_id, call_id, input_variables, raw_output, 
                         execution_time_ms, status, error_message, is_dry_run, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """
                    cur.execute(sql, (
                        trace_id, "faq_v3_ci", call_id, prompt, "",  # 使用 call_id（可能是 None）
                        0, "error", str(e), 0, datetime.now().isoformat()
                    ))
                conn.commit()
    
    return extracted_questions

def main():
    parser = argparse.ArgumentParser(description="FAQ 分析 (本地/CI)")
    parser.add_argument("--limit", type=int, default=10, help="处理记录数 (默认 10, 用于本地测试)")
    parser.add_argument("--days", type=int, default=0, help="仅分析最近 N 天的数据 (0=全部)")
    parser.add_argument("--force", action="store_true", help="强制重新分析 (幂等更新)")
    args = parser.parse_args()
    
    if not HUNYUAN_API_KEY:
        print("❌ 错误: 需要设置 HUNYUAN_API_KEY 环境变量")
        return
    
    print(f"🚀 开始 FAQ 分析")
    print(f"📊 限制: {args.limit} 条 | 时间范围: {'最近 ' + str(args.days) + ' 天' if args.days > 0 else '全部'}")
    
    # 连接数据库
    try:
        conn, db_type = get_db_connection(DATABASE_URL)
        print(f"✅ 数据库连接成功 ({db_type.upper()})")
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        return
    
    # 初始化表结构
    ensure_schema(conn, db_type)
    
    # 查询待分析数据
    if db_type == 'postgres':
        from psycopg2.extras import RealDictCursor
        cur_factory = RealDictCursor
        placeholder = '%s'
        length_check = "LENGTH(t.content::text) > 100"
    else:
        cur_factory = None
        placeholder = '?'
        length_check = "LENGTH(t.content) > 100"
    
    cursor = conn.cursor() if db_type == 'sqlite' else conn.cursor(cursor_factory=cur_factory)
    
    # 动态构建排除逻辑 (增量处理)
    exclude_logic = ""
    if not args.force:
        # 如果不是强制重新跑，则排除掉已经在日志表中存在记录（代表已经尝试处理过）的 transcript
        # 匹配规则：log_prompt_execution.id 包含 faq_trace_{transcript_id}
        # 注意：%% 在 psycopg2 中会被转义为单个 % (用于 LIKE 匹配)
        if db_type == 'postgres':
            exclude_logic = "AND NOT EXISTS (SELECT 1 FROM log_prompt_execution l WHERE l.id LIKE 'faq_trace_' || t.id || '_%%')"
        else:
            exclude_logic = "AND NOT EXISTS (SELECT 1 FROM log_prompt_execution l WHERE l.id LIKE 'faq_trace_' || t.id || '_%')"
        print(f"🔄 增量模式: 跳过已处理的记录")
    else:
        print(f"⚠️ 强制模式 (--force): 将重新处理所有记录")

    sql = f"""
        SELECT t.id, t.deal_id, t.content, c.id as call_id
        FROM sync_transcripts t
        LEFT JOIN biz_calls c ON t.audio_url = c.audio_url
        WHERE t.content IS NOT NULL 
          AND {length_check}
          {exclude_logic}
    """
    
    if args.days > 0:
        cutoff = datetime.now() - timedelta(days=args.days)
        if db_type == 'postgres':
            cursor.execute(sql + " AND t.created_at > %s ORDER BY t.created_at DESC LIMIT %s", (cutoff, args.limit))
        else:
            cursor.execute(sql + f" AND t.created_at > datetime('now', '-{args.days} days') ORDER BY t.created_at DESC LIMIT ?", (args.limit,))
    else:
        if db_type == 'postgres':
            cursor.execute(sql + " ORDER BY t.created_at DESC LIMIT %s", (args.limit,))
        else:
            cursor.execute(sql + " ORDER BY t.created_at DESC LIMIT ?", (args.limit,))
    
    rows = cursor.fetchall()
    
    if len(rows) == 0:
        print("ℹ️  没有新的待分析记录（所有数据已处理或无符合条件的数据）")
        print("💡 提示: 使用 --force 可重新分析已处理过的记录")
        cursor.close()
        conn.close()
        return
    
    print(f"✅ 获取到 {len(rows)} 条待分析记录")
    
    client = OpenAI(api_key=HUNYUAN_API_KEY, base_url=HUNYUAN_BASE_URL)
    total_new = 0
    
    for row in tqdm(rows, desc="分析中", ncols=80):
        if db_type == 'postgres':
            tid, deal_id, content, call_id = row['id'], row['deal_id'], row['content'], row['call_id']
        else:
            tid, deal_id, content, call_id = row[0], row[1], row[2], row[3]
        
        questions = analyze_transcript(client, conn, cursor, tid, deal_id, call_id, content, db_type)
        print(f"  📞 Transcript {tid[:20]}...: 提取 {len(questions)} 个问题")
        
        for q in questions:
            if db_type == 'postgres':
                cursor.execute("""
                    INSERT INTO biz_faq_questions 
                    (id, deal_id, transcript_id, call_id, "timestamp", question, category, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        question = EXCLUDED.question,
                        category = EXCLUDED.category
                """, (
                    f"faq_v3_{tid}_{q['timestamp']}", deal_id, tid, call_id,
                    q['timestamp'], q['question'], q['category'], datetime.now()
                ))
            else:  # SQLite
                cursor.execute("""
                    INSERT OR REPLACE INTO biz_faq_questions 
                    (id, deal_id, transcript_id, call_id, timestamp, question, category, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    f"faq_v3_{tid}_{q['timestamp']}", deal_id, tid, call_id,
                    q['timestamp'], q['question'], q['category'], datetime.now().isoformat()
                ))
            total_new += 1
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("-" * 50)
    print(f"🎉 分析完成! 新增/更新 FAQ: {total_new} 条")

if __name__ == "__main__":
    main()
