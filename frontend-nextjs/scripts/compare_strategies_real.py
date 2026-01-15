
import json
import time
from openai import OpenAI
import os

# ---------------- CONFIG ----------------
HUNYUAN_API_KEY = os.getenv("HUNYUAN_API_KEY", "sk-t5eMk6ZZSLu3CJlYpMmsPVNQQMcBrjY4N2uxhkfkMP3PgKv0")
HUNYUAN_BASE_URL = "https://api.hunyuan.cloud.tencent.com/v1"

# 真实数据 (从 SQLite 提取, 长对话)
# ID: 8926527808450528941
REAL_TRANSCRIPT_JSON = """
[{"EndTime": 3120, "SilenceDuration": 2, "SpeakerId": "2", "BeginTime": 2000, "Text": "喂。", "ChannelId": 1, "SpeechRate": 107, "EmotionValue": 7.2}, 
{"EndTime": 7080, "SilenceDuration": 3, "SpeakerId": "1", "BeginTime": 3260, "Text": "哎，你好，东方永红的维修服务委员。", "ChannelId": 0, "SpeechRate": 267, "EmotionValue": 7.5}, 
{"EndTime": 9020, "SilenceDuration": 4, "SpeakerId": "2", "BeginTime": 7440, "Text": "啊啊，你好。", "ChannelId": 1, "SpeechRate": 227, "EmotionValue": 7.2}, 
{"EndTime": 11080, "SilenceDuration": 1, "SpeakerId": "1", "BeginTime": 8960, "Text": "哎，你好，咱那还维修吗？", "ChannelId": 0, "SpeechRate": 339, "EmotionValue": 7.2}, 
{"EndTime": 15920, "SilenceDuration": 2, "SpeakerId": "2", "BeginTime": 11820, "Text": "呃，没有，但是先不用了，先现在还好，也没什么事了。", "ChannelId": 1, "SpeechRate": 365, "EmotionValue": 7.4}, 
{"EndTime": 17620, "SilenceDuration": 5, "SpeakerId": "1", "BeginTime": 16120, "Text": "行好嘞。", "ChannelId": 0, "SpeechRate": 160, "EmotionValue": 6.5}, 
{"EndTime": 19040, "SilenceDuration": 1, "SpeakerId": "2", "BeginTime": 17600, "Text": "嗯，好好。", "ChannelId": 1, "SpeechRate": 208, "EmotionValue": 6.5}, 
{"EndTime": 20640, "SilenceDuration": 0, "SpeakerId": "1", "BeginTime": 18520, "Text": "嗯，好，再见。", "ChannelId": 0, "SpeechRate": 198, "EmotionValue": 6.5},
{"EndTime": 1588520, "SilenceDuration": 12, "SpeakerId": "2", "BeginTime": 1587720, "Text": "嗯。", "ChannelId": 1, "SpeechRate": 150, "EmotionValue": 6.1},
{"EndTime": 1599900, "SilenceDuration": 5, "SpeakerId": "2", "BeginTime": 1594200, "Text": "就是说就是说明年开春的话，我要定，我就提 前两周定，是不是是不是这意思？", "ChannelId": 1, "SpeechRate": 368, "EmotionValue": 7.6},
{"EndTime": 1601840, "SilenceDuration": 0, "SpeakerId": "2", "BeginTime": 1600760, "Text": "谢谢啊。", "ChannelId": 1, "SpeechRate": 222, "EmotionValue": 6.2},
{"EndTime": 1608400, "SilenceDuration": 3, "SpeakerId": "2", "BeginTime": 1605740, "Text": "行啊，因为这天气我感觉有点。", "ChannelId": 1, "SpeechRate": 315, "EmotionValue": 7.4},
{"EndTime": 1610409, "SilenceDuration": 0, "SpeakerId": "2", "BeginTime": 1608540, "Text": "说冷就冷了，你知道吧？", "ChannelId": 1, "SpeechRate": 353, "EmotionValue": 7.2},
{"EndTime": 1613520, "SilenceDuration": 0, "SpeakerId": "2", "BeginTime": 1611380, "Text": "我估计今年都够呛了。", "ChannelId": 1, "SpeechRate": 280, "EmotionValue": 7.3},
{"EndTime": 1620677, "SilenceDuration": 5, "SpeakerId": "2", "BeginTime": 1618800, "Text": "是，行，谢谢您了。", "ChannelId": 1, "SpeechRate": 287, "EmotionValue": 7.3},
{"EndTime": 1628640, "SilenceDuration": 0, "SpeakerId": "2", "BeginTime": 1625280, "Text": "我联系一下我手机号，你要不加我一下啊。", "ChannelId": 1, "SpeechRate": 339, "EmotionValue": 7.5},
{"EndTime": 1629880, "SilenceDuration": 0, "SpeakerId": "2", "BeginTime": 1628940, "Text": "哎。", "ChannelId": 1, "SpeechRate": 127, "EmotionValue": 6.8},
{"EndTime": 1632220, "SilenceDuration": 0, "SpeakerId": "2", "BeginTime": 1630200, "Text": "二二二幺五六。", "ChannelId": 1, "SpeechRate": 207, "EmotionValue": 7.2},
{"EndTime": 1635720, "SilenceDuration": 1, "SpeakerId": "2", "BeginTime": 1634120, "Text": "五二七零。", "ChannelId": 1, "SpeechRate": 187, "EmotionValue": 7.2},
{"EndTime": 1640160, "SilenceDuration": 2, "SpeakerId": "2", "BeginTime": 1638460, "Text": "嗯，幺三八二。", "ChannelId": 1, "SpeechRate": 247, "EmotionValue": 7.4},
{"EndTime": 1643760, "SilenceDuration": 2, "SpeakerId": "2", "BeginTime": 1642840, "Text": "好。", "ChannelId": 1, "SpeechRate": 130, "EmotionValue": 7.1},
{"EndTime": 1650620, "SilenceDuration": 4, "SpeakerId": "2", "BeginTime": 1648160, "Text": "哦，对对，谢谢你啊。", "ChannelId": 1, "SpeechRate": 243, "EmotionValue": 7.3},
{"EndTime": 1652449, "SilenceDuration": 0, "SpeakerId": "2", "BeginTime": 1650940, "Text": "好，哎，再见。", "ChannelId": 1, "SpeechRate": 278, "EmotionValue": 7.1}]
"""

CATEGORIES = ["价格咨询", "服务范围", "上门时间", "质保期", "服务人员", "施工流程", "联系方式", "公司资质", "其他", "非问题"]

client = OpenAI(api_key=HUNYUAN_API_KEY, base_url=HUNYUAN_BASE_URL)
TRANSCRIPT_DATA = json.loads(REAL_TRANSCRIPT_JSON)

# ---------------- STRATEGY 1: 批量合并 (Batch) ----------------
def test_batch_real():
    print("\n🔹 [测试 1/2] 批量合并 (Batch Strategy)")
    
    # 1. 预处理：提取客户文本
    customer_texts = []
    for item in TRANSCRIPT_DATA:
        if item.get("SpeakerId") == "2":
            text = item.get("Text", "").strip()
            if len(text) > 1:
                customer_texts.append(f"- {text}")
    
    combined_text = "\n".join(customer_texts)
    print(f"输入文本 (Length: {len(combined_text)}):\n{combined_text[:100]}...")
    
    prompt = f"""你是一个客户问题提取助手。
分类列表: {", ".join(CATEGORIES)}
请从以下客户对话中提取问题，并分类。
输出格式: JSON数组 [{{"q": "问题", "c": "分类"}}]

对话内容:
{combined_text}
"""
    
    start_t = time.time()
    try:
        completion = client.chat.completions.create(
            model="hunyuan-lite",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        duration = time.time() - start_t
        print(f"⏱️ 耗时: {duration:.2f}s")
        print(f"📝 结果:\n{completion.choices[0].message.content}")
        
    except Exception as e:
        print(f"❌ 错误: {e}")


# ---------------- STRATEGY 2: 全量上下文 + 逐句分析 ----------------
def test_full_context_real():
    print("\n🔹 [测试 2/2] 全量上下文 + 逐句分析 (Full Context Single-Turn)")
    
    start_t_total = time.time()
    context_buffer = [] # 存储 "Role: Text"
    
    for i, item in enumerate(TRANSCRIPT_DATA):
        # 1. 更新上下文
        role_label = "销售" if item["SpeakerId"] == "1" else "客户"
        text = item["Text"]
        context_buffer.append(f"{role_label}: {text}")
        
        # 2. 判断是否分析 (只分析客户 + 长度足够)
        if item["SpeakerId"] == "2" and len(text) > 1:
            timestamp = item["BeginTime"]
            
            # Prompt: 全量上下文
            prompt = f"""你是一个对话分析助手。
分类列表: {", ".join(CATEGORIES)}

【完整对话记录】:
{chr(10).join(context_buffer)}

【当前客户发言】:
"{text}"

任务：
1. 判断【当前客户发言】是否是一个具体的疑问/提问（忽略单纯的回答、拒绝或感叹）。
2. 如果是提问，属于哪个分类？
3. 如果不是提问，输出 "非问题"。

输出格式(JSON): {{"category": "分类名", "reason": "简短理由"}}"""

            # print(f"Analyzing [{timestamp}ms] {text[:10]}...", end="", flush=True)
            t0 = time.time()
            try:
                completion = client.chat.completions.create(
                    model="hunyuan-lite",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1
                )
                res_text = completion.choices[0].message.content.strip()
                t1 = time.time()
                
                # Parse
                clean_json = res_text.replace("```json", "").replace("```", "").strip()
                try:
                    data = json.loads(clean_json)
                    cat = data.get("category", "Unknown")
                    reason = data.get("reason", "No reason")
                except:
                   cat = res_text
                   reason = "Parse Error"
                
                print(f"[{timestamp}ms] \"{text}\"")
                print(f"  -> {cat} ({reason}) [{t1-t0:.2f}s]")
                
            except Exception as e:
                print(f"❌ Error: {e}")

    total_duration = time.time() - start_t_total
    print(f"⏱️ 总耗时: {total_duration:.2f}s")


if __name__ == "__main__":
    print(f"数据源: 真实通话记录 (ID: 5803332455699693447)")
    test_batch_real()
    test_full_context_real()
