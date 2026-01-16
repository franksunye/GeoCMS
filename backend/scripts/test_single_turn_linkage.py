
import json
import time
from openai import OpenAI
import os

# ---------------- CONFIG ----------------
HUNYUAN_API_KEY = os.getenv("HUNYUAN_API_KEY", "sk-t5eMk6ZZSLu3CJlYpMmsPVNQQMcBrjY4N2uxhkfkMP3PgKv0")
HUNYUAN_BASE_URL = "https://api.hunyuan.cloud.tencent.com/v1"

# 模拟真实通话数据 (更丰富，包含语气词和上下文)
SAMPLE_TRANSCRIPT = [
    {"BeginTime": 1050, "SpeakerId": "1", "Text": "你好，这里是东方雨虹。"},
    {"BeginTime": 3200, "SpeakerId": "2", "Text": "你好。"},
    {"BeginTime": 5100, "SpeakerId": "1", "Text": "老师傅，您是卫生间漏水吗？"},
    {"BeginTime": 8500, "SpeakerId": "2", "Text": "对，楼下说漏了，挺急的。"},
    {"BeginTime": 12000, "SpeakerId": "1", "Text": "明白，那我们需要上门检测一下才能定方案。"},
    {"BeginTime": 15200, "SpeakerId": "2", "Text": "那你们怎么收费啊？是免费看吗？"},
    {"BeginTime": 19000, "SpeakerId": "1", "Text": "检测是免费的，修的话要看具体工艺。"},
    {"BeginTime": 22500, "SpeakerId": "2", "Text": "行吧...那个，"},
    {"BeginTime": 24000, "SpeakerId": "2", "Text": "你们是正规公司吧？有资质吗？"},
    {"BeginTime": 27000, "SpeakerId": "1", "Text": "我们是上市公司，资质齐全的。"},
    {"BeginTime": 30000, "SpeakerId": "2", "Text": "哦哦，行。那假如修好了又漏了怎么办？"},
    {"BeginTime": 35000, "SpeakerId": "1", "Text": "我们有质保的。"},
    {"BeginTime": 38000, "SpeakerId": "2", "Text": "质保多久啊？"}
]

# 原始 8 类 + 用户喜欢的“资质”
# 注意：Lite 模型可能会自己发挥，单句分析模式下我们通常允许一定的灵活性，或者严格限制
CATEGORIES = ["价格咨询", "服务范围", "上门时间", "质保期", "服务人员", "施工流程", "联系方式", "公司资质", "其他"]

client = OpenAI(api_key=HUNYUAN_API_KEY, base_url=HUNYUAN_BASE_URL)

def format_timestamp(ms):
    seconds = ms // 1000
    return f"{seconds // 60:02d}:{seconds % 60:02d}"

def test_single_turn_linkage():
    print(f"\n🚀 开始单句分析测试 (模拟上下文 + 时间戳透传)")
    print(f"目标: 验证 [时间戳] -> [问题] -> [分类] 的精准链接\n")
    
    formatted_results = []
    
    # 模拟“滑动窗口”上下文：只保留最近 6 句，保证 Token 很少
    context_buffer = [] 
    
    for i, item in enumerate(SAMPLE_TRANSCRIPT):
        # 1. 更新上下文
        role = "销售" if item["SpeakerId"] == "1" else "客户"
        context_buffer.append(f"{role}: {item['Text']}")
        if len(context_buffer) > 6:
            context_buffer.pop(0)
            
        # 2. 只分析客户说的话（且长度 > 2）
        if item["SpeakerId"] == "2" and len(item["Text"]) > 2:
            current_text = item["Text"]
            timestamp = item["BeginTime"]
            time_str = format_timestamp(timestamp)
            
            # 构建 Prompt：强调根据上下文判断“当前这句”
            prompt = f"""你是一个对话分析助手。
分类列表: {", ".join(CATEGORIES)}

【近期对话上下文】:
{chr(10).join(context_buffer[:-1])}

【当前客户发言】:
"{current_text}"

任务：
1. 判断【当前客户发言】是否是在提问（忽略单纯的回答或感叹）。
2. 如果是提问，属于哪个分类？
3. 如果不是提问，输出 "非问题"。

输出格式(JSON): {{"is_question": true/false, "category": "分类名", "reason": "简短理由"}}"""

            print(f"Analyzing [{time_str}] {current_text} ...", end="", flush=True)
            
            try:
                start_t = time.time()
                completion = client.chat.completions.create(
                    model="hunyuan-lite",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1
                )
                res_text = completion.choices[0].message.content.strip()
                duration = time.time() - start_t
                
                # 尝试解析 JSON
                clean_json = res_text.replace("```json", "").replace("```", "").strip()
                try:
                    res_data = json.loads(clean_json)
                except:
                    # 容错：如果模型返回非标准JSON，简单处理
                    res_data = {"is_question": False, "raw": res_text}

                print(f" ✅ {duration:.2f}s")
                
                if res_data.get("is_question"):
                    # 💡 核心价值：直接拿到了原始的 item["BeginTime"]，实现了 100% 准确的链接
                    formatted_results.append({
                        "timestamp_ms": timestamp,
                        "time_display": time_str,
                        "question": current_text,
                        "category": res_data.get("category"),
                        "ai_reason": res_data.get("reason")
                    })
                    print(f"   🎯 捕获问题: [{res_data.get('category')}] - {res_data.get('reason')}")
                else:
                    print(f"   Start - (非问题)")

            except Exception as e:
                print(f" ❌ Error: {e}")

    print("\n\n🏆 最终生成的数据库记录预览 (Phase 2):")
    print("-" * 60)
    print(f"{'时间':<10} {'分类':<10} {'问题内容'}")
    print("-" * 60)
    for r in formatted_results:
        print(f"{r['time_display']:<10} {r['category']:<10} {r['question']}")
    print("-" * 60)
    print(f"共发现 {len(formatted_results)} 个问题。每个问题都携带了原始毫秒级时间戳。")

if __name__ == "__main__":
    test_single_turn_linkage()
