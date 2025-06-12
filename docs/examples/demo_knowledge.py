#!/usr/bin/env python3
"""
知识库功能演示脚本
运行方式：从项目根目录执行 python docs/examples/demo_knowledge.py
"""
import requests
import json
import sys
import os

# 添加项目根目录到路径，以便导入模块
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

API_URL = "http://localhost:8000"

def test_api_connection():
    """测试API连接"""
    try:
        response = requests.get(f"{API_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("✅ API服务连接正常")
            return True
        else:
            print(f"❌ API服务异常: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 无法连接API服务: {e}")
        return False

def create_sample_knowledge():
    """创建示例知识"""
    print("\n📚 创建示例知识...")
    
    # 公司信息
    company_info = {
        "topic": "company_info",
        "content": {
            "name": "GeoCMS科技有限公司",
            "description": "专注于AI驱动的智能建站系统开发",
            "mission": "让每个人都能轻松创建专业网站",
            "vision": "成为全球领先的智能建站平台",
            "founded": "2024年",
            "location": "北京市海淀区"
        },
        "description": "公司基本信息"
    }
    
    # 产品信息
    product_info = {
        "topic": "product_info",
        "content": {
            "name": "GeoCMS智能建站系统",
            "description": "基于大语言模型的智能内容生成与管理系统",
            "features": [
                "AI驱动的内容生成",
                "知识库感知",
                "多种内容类型支持",
                "实时预览功能"
            ],
            "benefits": [
                "提高内容创作效率",
                "确保内容一致性",
                "降低技术门槛",
                "节省时间成本"
            ],
            "target_audience": "中小企业、个人创业者、内容创作者",
            "pricing": "基础版免费，专业版99元/月"
        },
        "description": "产品详细信息"
    }
    
    knowledge_items = [company_info, product_info]
    
    for item in knowledge_items:
        try:
            response = requests.post(f"{API_URL}/api/knowledge", json=item, timeout=10)
            if response.status_code == 200:
                print(f"✅ 创建知识成功: {item['topic']}")
            else:
                print(f"❌ 创建知识失败: {item['topic']} - {response.json().get('detail', '未知错误')}")
        except Exception as e:
            print(f"❌ 创建知识失败: {item['topic']} - {e}")

def list_knowledge():
    """列出所有知识"""
    print("\n📋 当前知识库内容:")
    try:
        response = requests.get(f"{API_URL}/api/knowledge", timeout=10)
        if response.status_code == 200:
            knowledge_list = response.json()
            if knowledge_list:
                for knowledge in knowledge_list:
                    print(f"  📚 {knowledge['topic']}: {knowledge.get('description', '无描述')}")
            else:
                print("  📝 暂无知识条目")
        else:
            print(f"❌ 获取知识列表失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 获取知识列表失败: {e}")

def test_knowledge_aware_generation():
    """测试知识感知的内容生成"""
    print("\n🧠 测试知识感知的内容生成...")
    
    test_prompts = [
        "为我们公司创建一个介绍页面",
        "写一篇关于我们产品的宣传文案",
        "创建一个关于人工智能的技术博客"  # 这个应该不需要特定知识
    ]
    
    for prompt in test_prompts:
        print(f"\n📝 测试提示词: {prompt}")
        try:
            response = requests.post(
                f"{API_URL}/api/run-prompt",
                json={"prompt": prompt},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get("status") == "missing_knowledge":
                    print("⚠️ 检测到缺失知识:")
                    for missing in result.get('missing_knowledge', []):
                        print(f"  - {missing.get('topic')}: {missing.get('description')}")
                else:
                    print("✅ 内容生成成功")
                    if result.get('knowledge_used'):
                        print(f"📚 使用的知识: {', '.join(result['knowledge_used'])}")
                    else:
                        print("📝 未使用特定知识")
            else:
                print(f"❌ 生成失败: {response.json().get('detail', '未知错误')}")
        except Exception as e:
            print(f"❌ 生成失败: {e}")

def get_knowledge_stats():
    """获取知识库统计"""
    print("\n📊 知识库统计信息:")
    try:
        response = requests.get(f"{API_URL}/api/knowledge/stats/summary", timeout=10)
        if response.status_code == 200:
            stats = response.json()
            print(f"  总知识条目: {stats.get('total_knowledge', 0)}")
            print(f"  可用模板: {len(stats.get('available_templates', []))}")
            
            topic_counts = stats.get('topic_counts', {})
            if topic_counts:
                print("  各类型分布:")
                for topic, count in topic_counts.items():
                    print(f"    - {topic}: {count}")
        else:
            print(f"❌ 获取统计失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 获取统计失败: {e}")

def main():
    """主函数"""
    print("🌍 GeoCMS 知识库功能演示")
    print("=" * 50)
    
    # 测试API连接
    if not test_api_connection():
        print("请确保后端服务正在运行: python -m uvicorn app.main:app --reload")
        sys.exit(1)
    
    # 创建示例知识
    create_sample_knowledge()
    
    # 列出知识
    list_knowledge()
    
    # 获取统计信息
    get_knowledge_stats()
    
    # 测试知识感知生成
    test_knowledge_aware_generation()
    
    print("\n🎉 演示完成！")
    print("💡 提示: 从项目根目录运行 'streamlit run frontend/streamlit_app.py' 来体验完整的前端界面")

if __name__ == "__main__":
    main()
