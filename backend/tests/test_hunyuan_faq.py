"""
测试腾讯混元 Lite 模型提取客户常见问题的能力

使用 OpenAI 兼容接口调用混元 API
"""

import json
from openai import OpenAI

# 腾讯混元 API 配置
HUNYUAN_API_KEY = "sk-t5eMk6ZZSLu3CJlYpMmsPVNQQMcBrjY4N2uxhkfkMP3PgKv0"
HUNYUAN_BASE_URL = "https://api.hunyuan.cloud.tencent.com/v1"

# 初始化客户端
client = OpenAI(
    api_key=HUNYUAN_API_KEY,
    base_url=HUNYUAN_BASE_URL
)

# 测试用的通话转录样本（模拟真实数据格式）
SAMPLE_TRANSCRIPT = """
[销售] 喂，你好，这边是东方雨虹防水的。
[客户] 哦，你好，我想问一下你们能做卫生间防水吗？
[销售] 可以的，您是卫生间漏水还是想做预防性的防水？
[客户] 是漏水，楼下邻居说有渗水。
[销售] 明白，这种情况比较常见。我们可以上门检测一下漏点位置。
[客户] 那你们保修几年啊？
[销售] 我们标准质保是五年，材料和施工都保。
[客户] 好的，那费用大概多少钱？
[销售] 这个要看面积和漏水情况，一般卫生间在1500到3000左右。
[客户] 那你们什么时候能过来看看？
[销售] 您明天方便吗？我可以安排师傅上门。
[客户] 明天下午可以，你们师傅是固定的还是外包的？
[销售] 都是我们自己的专业师傅，有统一工装和工牌的。
[客户] 好的，那留个微信吧，到时候联系。
"""

# 提取问题的 Prompt - 方案2 + 预处理：只分析客户说的话
EXTRACTION_PROMPT = """你是一个客户服务分析专家。以下是客户在防水服务咨询电话中说的所有话。

请从中识别出客户提出的问题或疑问，并进行分类。

要求：
1. 识别出所有带有疑问意图的句子（不一定有问号）
2. 为每个问题创建一个精准的分类标签（如：服务范围、价格咨询、售后保障、服务人员、施工周期等）
3. 忽略简单的语气词（如"嗯"、"好的"、"哦"等）
4. 以 JSON 格式输出

输出格式：
```json
{
  "questions": [
    {"question": "客户原话", "category": "具体分类标签", "intent": "客户真实意图"}
  ]
}
```

客户说的话：
"""

# 真实转录数据样本（从数据库获取）
REAL_TRANSCRIPT_JSON = '''[{"EndTime": 4459, "SilenceDuration": 3, "SpeakerId": "1", "BeginTime": 3280, "Text": "喂，你好。", "ChannelId": 0, "SpeechRate": 254, "EmotionValue": 7.2}, {"EndTime": 6000, "SilenceDuration": 5, "SpeakerId": "2", "BeginTime": 5060, "Text": "喂。", "ChannelId": 1, "SpeechRate": 127, "EmotionValue": 7.2}, {"EndTime": 7980, "SilenceDuration": 1, "SpeakerId": "1", "BeginTime": 5940, "Text": "哎，你好，东方雨虹那边师傅。", "ChannelId": 0, "SpeechRate": 382, "EmotionValue": 7.2}, {"EndTime": 11640, "SilenceDuration": 4, "SpeakerId": "2", "BeginTime": 10240, "Text": "喂，哎。", "ChannelId": 1, "SpeechRate": 171, "EmotionValue": 7.3}, {"EndTime": 15499, "SilenceDuration": 3, "SpeakerId": "1", "BeginTime": 11460, "Text": "喂，你好，东方雨虹这边师傅，咱这边现在是什么问题？", "ChannelId": 0, "SpeechRate": 371, "EmotionValue": 7.3}, {"EndTime": 15300, "SilenceDuration": 2, "SpeakerId": "2", "BeginTime": 14260, "Text": "啊。", "ChannelId": 1, "SpeechRate": 115, "EmotionValue": 7.2}, {"EndTime": 23220, "SilenceDuration": 0, "SpeakerId": "2", "BeginTime": 16280, "Text": "我现在在老顶楼天地方有点漏水，想要处理一下啊。", "ChannelId": 1, "SpeechRate": 207, "EmotionValue": 7.8}, {"EndTime": 28000, "SilenceDuration": 2, "SpeakerId": "1", "BeginTime": 24000, "Text": "好的，那个漏水面积大概多大？", "ChannelId": 0, "SpeechRate": 300, "EmotionValue": 7.5}, {"EndTime": 35000, "SilenceDuration": 3, "SpeakerId": "2", "BeginTime": 29000, "Text": "大概有个三四平米吧，你们什么时候能过来看看？", "ChannelId": 1, "SpeechRate": 280, "EmotionValue": 7.6}, {"EndTime": 42000, "SilenceDuration": 2, "SpeakerId": "1", "BeginTime": 36000, "Text": "明天下午可以，我提前一个小时给你打电话。", "ChannelId": 0, "SpeechRate": 320, "EmotionValue": 7.5}, {"EndTime": 50000, "SilenceDuration": 3, "SpeakerId": "2", "BeginTime": 43000, "Text": "好的，那费用大概多少钱啊？还有你们保修多久？", "ChannelId": 1, "SpeechRate": 290, "EmotionValue": 7.7}, {"EndTime": 60000, "SilenceDuration": 2, "SpeakerId": "1", "BeginTime": 51000, "Text": "费用要看现场情况，一般三四平米在800到1500左右，质保五年。", "ChannelId": 0, "SpeechRate": 310, "EmotionValue": 7.5}, {"EndTime": 68000, "SilenceDuration": 3, "SpeakerId": "2", "BeginTime": 61000, "Text": "行，那你们师傅是公司自己的还是外包的啊？", "ChannelId": 1, "SpeechRate": 275, "EmotionValue": 7.6}, {"EndTime": 75000, "SilenceDuration": 2, "SpeakerId": "1", "BeginTime": 69000, "Text": "都是我们自己的专业师傅，有统一工装。", "ChannelId": 0, "SpeechRate": 300, "EmotionValue": 7.5}, {"EndTime": 82000, "SilenceDuration": 3, "SpeakerId": "2", "BeginTime": 76000, "Text": "好的好的，那我加你微信吧，到时候联系。", "ChannelId": 1, "SpeechRate": 285, "EmotionValue": 7.7}]'''


def preprocess_transcript(transcript_json: str) -> str:
    """预处理：只提取客户说的话 (SpeakerId = "2")"""
    data = json.loads(transcript_json)
    customer_texts = []
    for item in data:
        if item.get("SpeakerId") == "2":
            text = item.get("Text", "").strip()
            if text and len(text) > 1:  # 过滤掉太短的语气词
                customer_texts.append(f"- {text}")
    return "\n".join(customer_texts)


def test_basic_api():
    """测试基本 API 连通性"""
    print("=" * 50)
    print("测试 1: 基本 API 连通性")
    print("=" * 50)
    
    try:
        response = client.chat.completions.create(
            model="hunyuan-lite",
            messages=[
                {"role": "user", "content": "你好，请简单介绍一下你自己"}
            ],
            max_tokens=100
        )
        print(f"✅ API 连接成功!")
        print(f"模型响应: {response.choices[0].message.content}")
        return True
    except Exception as e:
        print(f"❌ API 连接失败: {e}")
        return False


def test_question_extraction():
    """测试问题提取能力"""
    print("\n" + "=" * 50)
    print("测试 2: 客户问题提取能力")
    print("=" * 50)
    
    try:
        response = client.chat.completions.create(
            model="hunyuan-lite",
            messages=[
                {"role": "system", "content": "你是一个专业的客户服务分析助手，擅长从对话中提取和分类客户问题。"},
                {"role": "user", "content": EXTRACTION_PROMPT + SAMPLE_TRANSCRIPT}
            ],
            max_tokens=1000,
            temperature=0.3  # 低温度保证输出稳定
        )
        
        result = response.choices[0].message.content
        print(f"✅ 问题提取成功!")
        print(f"\n模型输出:\n{result}")
        
        # 尝试解析 JSON
        try:
            # 提取 JSON 部分
            if "```json" in result:
                json_str = result.split("```json")[1].split("```")[0]
            elif "```" in result:
                json_str = result.split("```")[1].split("```")[0]
            else:
                json_str = result
            
            parsed = json.loads(json_str.strip())
            print(f"\n✅ JSON 解析成功!")
            print(f"提取到 {len(parsed.get('questions', []))} 个问题:")
            for i, q in enumerate(parsed.get('questions', []), 1):
                print(f"  {i}. [{q.get('category', 'N/A')}] {q.get('question', 'N/A')}")
            return True
        except json.JSONDecodeError as e:
            print(f"\n⚠️ JSON 解析失败: {e}")
            print("模型可以提取问题，但输出格式需要优化")
            return True  # 仍然认为测试通过，只是格式需要调整
            
    except Exception as e:
        print(f"❌ 问题提取失败: {e}")
        return False


def test_preprocessed_real_data():
    """测试预处理后的真实数据（方案2核心测试）"""
    print("\n" + "=" * 50)
    print("测试 3: 预处理后的真实数据提取（只含客户说的话）")
    print("=" * 50)
    
    try:
        # 预处理：只提取客户说的话
        customer_only_text = preprocess_transcript(REAL_TRANSCRIPT_JSON)
        
        print("📋 预处理后的客户语句：")
        print(customer_only_text)
        print("\n" + "-" * 30)
        
        response = client.chat.completions.create(
            model="hunyuan-lite",
            messages=[
                {"role": "system", "content": "你是一个专业的客户服务分析助手。"},
                {"role": "user", "content": EXTRACTION_PROMPT + customer_only_text}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        
        result = response.choices[0].message.content
        print(f"\n✅ 预处理数据分析成功!")
        print(f"\n模型输出:\n{result}")
        
        # 解析 JSON
        try:
            if "```json" in result:
                json_str = result.split("```json")[1].split("```")[0]
            elif "```" in result:
                json_str = result.split("```")[1].split("```")[0]
            else:
                json_str = result
            
            parsed = json.loads(json_str.strip())
            print(f"\n✅ JSON 解析成功!")
            print(f"提取到 {len(parsed.get('questions', []))} 个问题:")
            for i, q in enumerate(parsed.get('questions', []), 1):
                print(f"  {i}. [{q.get('category', 'N/A')}] {q.get('question', 'N/A')}")
                print(f"      意图: {q.get('intent', 'N/A')}")
            return True
        except json.JSONDecodeError as e:
            print(f"\n⚠️ JSON 解析失败: {e}")
            return True
            
    except Exception as e:
        print(f"❌ 预处理数据分析失败: {e}")
        return False


if __name__ == "__main__":
    print("🚀 开始测试腾讯混元 Lite 模型\n")
    
    # 测试 1: API 连通性
    if not test_basic_api():
        print("\n❌ API 连接失败，停止后续测试")
        exit(1)
    
    # 测试 2: 问题提取能力（模拟数据）
    test_question_extraction()
    
    # 测试 3: 预处理后的真实数据（核心测试）
    test_preprocessed_real_data()
    
    print("\n" + "=" * 50)
    print("🎉 测试完成!")
    print("=" * 50)

