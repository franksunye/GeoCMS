
import json
import time
from openai import OpenAI
import os

# ---------------- CONFIG ----------------
# 请在此填入 API Key
HUNYUAN_API_KEY = "sk-t5eMk6ZZSLu3CJlYpMmsPVNQQMcBrjY4N2uxhkfkMP3PgKv0"
HUNYUAN_BASE_URL = "https://api.hunyuan.cloud.tencent.com/v1"

# 模拟真实通话数据 (带时间戳)
SAMPLE_TRANSCRIPT = [
    {"BeginTime": 1000, "SpeakerId": "1", "Text": "你好，这里是东方雨虹。"},
    {"BeginTime": 3500, "SpeakerId": "2", "Text": "你好。"},
    {"BeginTime": 5000, "SpeakerId": "1", "Text": "老师傅，您是卫生间漏水吗？"},
    {"BeginTime": 8000, "SpeakerId": "2", "Text": "对，楼下说漏了。"},
    {"BeginTime": 12000, "SpeakerId": "1", "Text": "明白，那我们需要上门检测一下。"},
    {"BeginTime": 15000, "SpeakerId": "2", "Text": "那你们怎么收费啊？"},
    {"BeginTime": 18000, "SpeakerId": "1", "Text": "检测是免费的，具体维修要看情况。"},
    {"BeginTime": 22000, "SpeakerId": "2", "Text": "行吧，那明天上午来吧。"},
    {"BeginTime": 25000, "SpeakerId": "1", "Text": "好的，明天见。"},
    {"BeginTime": 28000, "SpeakerId": "2", "Text": "你们是正规公司吧？有资质吗？"}
]

CATEGORIES = ["价格咨询", "服务范围", "上门时间", "质保期", "服务人员", "施工流程", "联系方式", "其他"]

client = OpenAI(api_key=HUNYUAN_API_KEY, base_url=HUNYUAN_BASE_URL)

# ---------------- STRATEGY 1: 批量合并 (Current) ----------------
def test_batch_strategy():
    print("\n🔹 测试策略 1: 批量合并 (Batch)")
    
    # 预处理：只取客户说的话，拼成大段
    customer_lines = []
    for item in SAMPLE_TRANSCRIPT:
        if item["SpeakerId"] == "2":
            customer_lines.append(item["Text"])
    
    combined_text = "\n".join(customer_lines)
    
    prompt = f"""你是一个客户问题提取助手。
分类列表: {", ".join(CATEGORIES)}
请从以下客户对话中提取问题，并分类。
输出格式: JSON数组 [{{"q": "问题", "c": "分类"}}]

对话内容:
{combined_text}
"""
    
    start_time = time.time()
    try:
        completion = client.chat.completions.create(
            model="hunyuan-lite",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        duration = time.time() - start_time
        print(f"⏱️ 耗时: {duration:.2f}s")
        print(f"📝 结果:\n{completion.choices[0].message.content}")
    except Exception as e:
        print(f"❌ 错误: {e}")

# ---------------- STRATEGY 2: 逐句分析 (Proposed) ----------------
def test_single_turn_strategy():
    print("\n🔹 测试策略 2: 逐句分析 (Single-Turn)")
    
    total_duration = 0
    results = []
    
    # 模拟“带上下文”的单句判断
    # 这里简单起见，我们只把当前句丢进去，或者把前几句拼进去做 prompt context
    # 用户提议：全貌作为 Context，但只判断“当前这一句”
    
    context_text = "\n".join([f"{'销售' if x['SpeakerId']=='1' else '客户'}: {x['Text']}" for x in SAMPLE_TRANSCRIPT])
    
    start_time_all = time.time()
    
    # 遍历每一句客户的话
    for item in SAMPLE_TRANSCRIPT:
        if item["SpeakerId"] == "2" and len(item["Text"]) > 2:
            target_sentence = item["Text"]
            timestamp = item["BeginTime"]
            
            prompt = f"""你是一个分类助手。
分类列表: {", ".join(CATEGORIES)}

背景对话:
{context_text}

任务：请判断背景对话中，客户说的这句话 "{target_sentence}" 是否是一个问题。
如果是，请从分类列表中选择一个最合适的分类。
如果不是问题，返回 "无"。

输出格式：仅输出分类名称，或 "无"。
"""
            t0 = time.time()
            try:
                completion = client.chat.completions.create(
                    model="hunyuan-lite",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1
                )
                res = completion.choices[0].message.content.strip()
                t1 = time.time()
                total_duration += (t1 - t0)
                
                print(f"[{timestamp}ms] '{target_sentence}' -> {res} ({t1-t0:.2f}s)")
                results.append({"time": timestamp, "text": target_sentence, "result": res})
                
            except Exception as e:
                print(f"❌ 错误: {e}")

    print(f"⏱️ 总耗时（串行）: {total_duration:.2f}s")
    # 注意：并发可以加速，但 Token 消耗是一样的，且上下文重复发送 Token 量大增

if __name__ == "__main__":
    test_batch_strategy()
    test_single_turn_strategy()
