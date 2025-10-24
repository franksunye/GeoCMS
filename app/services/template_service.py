"""
模板管理服务 - Sprint 5 模板系统
"""
from sqlalchemy.orm import Session
from app.models import Template
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import re

class TemplateService:
    """模板管理服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_template(
        self,
        name: str,
        content_template: str,
        description: Optional[str] = None,
        variables: Optional[List[str]] = None,
        category: Optional[str] = None
    ) -> Template:
        """
        创建新模板
        
        Args:
            name: 模板名称
            content_template: 模板内容（包含变量占位符）
            description: 模板描述
            variables: 变量列表
            category: 模板分类
            
        Returns:
            创建的模板
        """
        template = Template(
            name=name,
            content_template=content_template,
            description=description,
            variables=json.dumps(variables or [], ensure_ascii=False),
            category=category
        )
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template
    
    def update_template(
        self,
        template_id: int,
        name: Optional[str] = None,
        content_template: Optional[str] = None,
        description: Optional[str] = None,
        variables: Optional[List[str]] = None,
        category: Optional[str] = None
    ) -> Optional[Template]:
        """
        更新模板
        
        Args:
            template_id: 模板ID
            name: 新名称
            content_template: 新模板内容
            description: 新描述
            variables: 新变量列表
            category: 新分类
            
        Returns:
            更新后的模板
        """
        template = self.db.query(Template).filter(Template.id == template_id).first()
        if not template:
            return None
        
        if name:
            template.name = name
        if content_template:
            template.content_template = content_template
        if description:
            template.description = description
        if variables is not None:
            template.variables = json.dumps(variables, ensure_ascii=False)
        if category:
            template.category = category
        
        template.updated_at = datetime.now()
        self.db.commit()
        self.db.refresh(template)
        return template
    
    def get_template(self, template_id: int) -> Optional[Template]:
        """获取模板"""
        return self.db.query(Template).filter(Template.id == template_id).first()
    
    def list_templates(
        self,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Template]:
        """
        列出模板
        
        Args:
            category: 筛选分类
            skip: 跳过数量
            limit: 限制数量
            
        Returns:
            模板列表
        """
        q = self.db.query(Template)
        
        if category:
            q = q.filter(Template.category == category)
        
        return q.order_by(Template.updated_at.desc()).offset(skip).limit(limit).all()
    
    def delete_template(self, template_id: int) -> bool:
        """删除模板"""
        template = self.db.query(Template).filter(Template.id == template_id).first()
        if not template:
            return False
        
        self.db.delete(template)
        self.db.commit()
        return True
    
    def render_template(
        self,
        template_id: int,
        variables: Dict[str, str]
    ) -> Optional[str]:
        """
        渲染模板
        
        Args:
            template_id: 模板ID
            variables: 变量字典
            
        Returns:
            渲染后的内容
        """
        template = self.get_template(template_id)
        if not template:
            return None
        
        content = template.content_template
        
        # 替换变量占位符
        for key, value in variables.items():
            placeholder = f"{{{{{key}}}}}"
            content = content.replace(placeholder, str(value))
        
        # 记录使用
        template.usage_count = (template.usage_count or 0) + 1
        self.db.commit()
        
        return content
    
    def get_template_variables(self, template_id: int) -> List[str]:
        """获取模板变量列表"""
        template = self.get_template(template_id)
        if not template:
            return []
        
        try:
            return json.loads(template.variables) if template.variables else []
        except:
            return []
    
    def extract_variables_from_template(self, content_template: str) -> List[str]:
        """
        从模板内容中提取变量
        
        Args:
            content_template: 模板内容
            
        Returns:
            变量列表
        """
        # 匹配 {{variable}} 格式
        pattern = r'\{\{(\w+)\}\}'
        matches = re.findall(pattern, content_template)
        return list(set(matches))
    
    def get_template_preview(
        self,
        template_id: int,
        sample_variables: Optional[Dict[str, str]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        获取模板预览
        
        Args:
            template_id: 模板ID
            sample_variables: 示例变量
            
        Returns:
            预览信息
        """
        template = self.get_template(template_id)
        if not template:
            return None
        
        variables = self.get_template_variables(template_id)
        
        # 生成示例变量
        if not sample_variables:
            sample_variables = {var: f"示例{var}" for var in variables}
        
        # 渲染预览
        preview_content = template.content_template
        for key, value in sample_variables.items():
            placeholder = f"{{{{{key}}}}}"
            preview_content = preview_content.replace(placeholder, str(value))
        
        return {
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "category": template.category,
            "variables": variables,
            "preview": preview_content,
            "usage_count": template.usage_count or 0
        }
    
    def get_popular_templates(self, limit: int = 10) -> List[Template]:
        """获取热门模板"""
        return self.db.query(Template).order_by(
            Template.usage_count.desc()
        ).limit(limit).all()
    
    def search_templates(
        self,
        query: str,
        category: Optional[str] = None
    ) -> List[Template]:
        """
        搜索模板
        
        Args:
            query: 搜索关键词
            category: 筛选分类
            
        Returns:
            模板列表
        """
        q = self.db.query(Template)
        
        if query:
            q = q.filter(
                (Template.name.like(f"%{query}%")) |
                (Template.description.like(f"%{query}%"))
            )
        
        if category:
            q = q.filter(Template.category == category)
        
        return q.all()

