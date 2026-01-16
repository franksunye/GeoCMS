
import json
import time
from openai import OpenAI
import os

# ---------------- CONFIG ----------------
HUNYUAN_API_KEY = os.getenv("HUNYUAN_API_KEY", "sk-t5eMk6ZZSLu3CJlYpMmsPVNQQMcBrjY4N2uxhkfkMP3PgKv0")
HUNYUAN_BASE_URL = "https://api.hunyuan.cloud.tencent.com/v1"

CATEGORIES = ["价格咨询", "服务范围", "上门时间", "质保期", "服务人员", "施工流程", "联系方式", "公司资质", "其他", "非问题"]

# 模拟一段“依赖上下文”的对话
# 难点：第6句 "那怎么弄呢？" (施工流程/服务范围) 依赖前文知道是漏水
# 难点：第8句 "贵吗？" (价格咨询) 依赖前文
CONTEXT_DIALOG = [
    {"role": "销售", "text": "你好，东方雨虹防水服务。"},
    {"role": "客户", "text": "你好，我家卫生间好像漏水了。"},  # 关键背景
    {"role": "销售", "text": "请问是渗水还是明水？有流到楼下吗？"},
    {"role": "客户", "text": "楼下说天花板湿了。"},
    {"role": "销售", "text": "那看来主要是防水层失效了。"},
    {"role": "客户", "text": "那怎么弄呢？"},             # Target 1: 依赖上下文理解是问“修补方案”
    {"role": "销售", "text": "我们需要先上门检测，然后制定方案，可能需要注浆或者根据情况重做。"},
    {"role": "客户", "text": "听起来挺复杂的。"},
    {"role": "客户", "text": "贵吗？"}                    # Target 2: 简单的“贵吗”需要关联到“上门检测/维修”
]

TARGET_INDICES = [5, 8] # 要测试的句子索引 (0-based)

client = OpenAI(api_key=HUNYUAN_API_KEY, base_url=HUNYUAN_BASE_URL)

def run_test_with_buffer(buffer_size):
    print(f"\n🧪 测试 Context Buffer = {buffer_size} 句")
    print("-" * 40)
    
    for target_idx in TARGET_INDICES:
        target_item = CONTEXT_DIALOG[target_idx]
        target_text = target_item["text"]
        
        # 截取前 N 句作为 context
        start_ctx = max(0, target_idx - buffer_size)
        context_items = CONTEXT_DIALOG[start_ctx : target_idx]
        
        context_str = "\n".join([f"{item['role']}: {item['text']}" for item in context_items])
        if not context_str:
            context_str = "(无上下文)"
            
        prompt = f"""你是一个对话分析助手。
分类列表: {", ".join(CATEGORIES)}

【近期对话上下文】:
{context_str}

【当前客户发言】:
"{target_text}"

任务：
1. 判断【当前客户发言】是否是在提问。
2. 如果是，属于哪个分类？
3. 如果不是，输出 "非问题"。

输出格式(JSON): {{"category": "分类名", "reason": "简短理由"}}"""

        try:
            start_t = time.time()
            completion = client.chat.completions.create(
                model="hunyuan-lite",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            res_text = completion.choices[0].message.content.strip()
            # 简单清洗
            clean_json = res_text.replace("```json", "").replace("```", "").strip()
            try:
                data = json.loads(clean_json)
                category = data.get("category", "Unknown")
                reason = data.get("reason", "")
            except:
                category = res_text
                reason = "JSON Parse Error"
            
            print(f"句子: \"{target_text}\"")
            print(f"  -> 分类: {category}")
            print(f"  -> 理由: {reason}")
            
        except Exception as e:
            print(f"Error: {e}")

def main():
    # 测试不同 buffer 大小
    # 0 = 只要当前句
    # 2 = 只要最近一轮
    # 10 = 全量/长上下文
    buffer_sizes = [0, 2, 8]
    
    for size in buffer_sizes:
        run_test_with_buffer(size)

if __name__ == "__main__":
    main()
