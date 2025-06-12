"""
Mock数据和Demo数据系统
用于在不接入真正的OpenAI API之前提供演示数据
"""
import json
import random
from typing import Dict, Any, List

class MockDataGenerator:
    """Mock数据生成器"""
    
    def __init__(self):
        self.demo_responses = {
            "ai": {
                "title": "人工智能技术概述",
                "headings": [
                    "什么是人工智能",
                    "人工智能的发展历程", 
                    "人工智能的应用领域",
                    "人工智能的未来发展"
                ],
                "paragraphs": [
                    "人工智能（Artificial Intelligence，AI）是计算机科学的一个分支，致力于创建能够执行通常需要人类智能的任务的系统。",
                    "人工智能的发展可以追溯到20世纪50年代，经历了多次起伏，如今正处于快速发展期。",
                    "人工智能在医疗、金融、交通、教育等多个领域都有广泛应用，正在改变我们的生活方式。",
                    "未来人工智能将更加智能化、普及化，同时也需要关注伦理和安全问题。"
                ],
                "faqs": [
                    {
                        "question": "人工智能会取代人类工作吗？",
                        "answer": "人工智能会改变工作方式，但更多是协助人类而非完全取代。新技术往往会创造新的工作机会。"
                    },
                    {
                        "question": "人工智能安全吗？",
                        "answer": "人工智能的安全性取决于如何设计和使用。需要建立相应的伦理规范和监管机制。"
                    }
                ]
            },
            "web": {
                "title": "网站开发最佳实践",
                "headings": [
                    "前端开发技术",
                    "后端架构设计",
                    "数据库优化",
                    "性能优化策略"
                ],
                "paragraphs": [
                    "现代网站开发需要掌握HTML、CSS、JavaScript等前端技术，以及各种框架和工具。",
                    "后端架构设计需要考虑可扩展性、可维护性和安全性，选择合适的技术栈。",
                    "数据库设计和优化是网站性能的关键因素，需要合理设计表结构和索引。",
                    "性能优化包括代码优化、缓存策略、CDN使用等多个方面。"
                ],
                "faqs": [
                    {
                        "question": "如何选择前端框架？",
                        "answer": "选择前端框架需要考虑项目需求、团队技能、社区支持等因素。React、Vue、Angular都是不错的选择。"
                    },
                    {
                        "question": "网站安全如何保障？",
                        "answer": "网站安全需要从多个层面考虑：HTTPS、输入验证、SQL注入防护、XSS防护等。"
                    }
                ]
            },
            "business": {
                "title": "创业公司发展指南",
                "headings": [
                    "商业模式设计",
                    "团队建设",
                    "融资策略",
                    "市场推广"
                ],
                "paragraphs": [
                    "成功的商业模式需要清晰的价值主张、目标客户群体和盈利模式。",
                    "优秀的团队是创业成功的关键，需要合理的人才配置和激励机制。",
                    "融资需要准备充分的商业计划书，选择合适的投资人和融资时机。",
                    "市场推广要精准定位目标用户，选择合适的推广渠道和策略。"
                ],
                "faqs": [
                    {
                        "question": "如何验证商业模式？",
                        "answer": "通过MVP（最小可行产品）快速验证市场需求，收集用户反馈并迭代改进。"
                    },
                    {
                        "question": "什么时候开始融资？",
                        "answer": "当产品有一定用户基础和收入数据时，是比较好的融资时机。"
                    }
                ]
            }
        }
    
    def generate_content(self, prompt: str) -> Dict[str, Any]:
        """
        根据提示词生成Mock内容
        
        Args:
            prompt: 用户输入的提示词
            
        Returns:
            生成的结构化内容
        """
        # 简单的关键词匹配
        prompt_lower = prompt.lower()
        
        if any(keyword in prompt_lower for keyword in ["ai", "人工智能", "机器学习", "深度学习"]):
            return self.demo_responses["ai"]
        elif any(keyword in prompt_lower for keyword in ["网站", "web", "前端", "后端", "开发"]):
            return self.demo_responses["web"]
        elif any(keyword in prompt_lower for keyword in ["创业", "商业", "公司", "business"]):
            return self.demo_responses["business"]
        else:
            # 默认返回AI相关内容，但修改标题
            content = self.demo_responses["ai"].copy()
            content["title"] = f"关于'{prompt[:20]}...'的内容"
            return content
    
    def generate_simple_response(self, prompt: str) -> str:
        """
        生成简单的文本响应（用于向后兼容）
        
        Args:
            prompt: 用户输入的提示词
            
        Returns:
            生成的文本内容
        """
        content = self.generate_content(prompt)
        
        # 将结构化内容转换为简单文本
        response = f"# {content['title']}\n\n"
        
        for i, heading in enumerate(content['headings']):
            response += f"## {heading}\n\n"
            if i < len(content['paragraphs']):
                response += f"{content['paragraphs'][i]}\n\n"
        
        response += "## 常见问题\n\n"
        for faq in content['faqs']:
            response += f"**{faq['question']}**\n\n{faq['answer']}\n\n"
        
        return response

# 全局Mock数据生成器实例
mock_generator = MockDataGenerator()

def get_mock_content(prompt: str) -> Dict[str, Any]:
    """获取Mock结构化内容"""
    return mock_generator.generate_content(prompt)

def get_mock_response(prompt: str) -> str:
    """获取Mock文本响应"""
    return mock_generator.generate_simple_response(prompt)
