"""
数据库迁移脚本：为知识库添加统计和质量字段
"""
from sqlalchemy import create_engine, text

DATABASE_URL = "sqlite:///./test_ai_native.db"

def migrate():
    """执行迁移"""
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    
    with engine.connect() as conn:
        # 检查字段是否已存在
        result = conn.execute(text("PRAGMA table_info(knowledge_base)"))
        columns = [row[1] for row in result]
        
        # 添加新字段（如果不存在）
        if 'tags' not in columns:
            conn.execute(text("ALTER TABLE knowledge_base ADD COLUMN tags TEXT"))
            print("✅ 添加字段: tags")
        
        if 'reference_count' not in columns:
            conn.execute(text("ALTER TABLE knowledge_base ADD COLUMN reference_count INTEGER DEFAULT 0"))
            print("✅ 添加字段: reference_count")
        
        if 'last_used_at' not in columns:
            conn.execute(text("ALTER TABLE knowledge_base ADD COLUMN last_used_at DATETIME"))
            print("✅ 添加字段: last_used_at")
        
        if 'quality_score' not in columns:
            conn.execute(text("ALTER TABLE knowledge_base ADD COLUMN quality_score INTEGER DEFAULT 0"))
            print("✅ 添加字段: quality_score")
        
        if 'is_archived' not in columns:
            conn.execute(text("ALTER TABLE knowledge_base ADD COLUMN is_archived INTEGER DEFAULT 0"))
            print("✅ 添加字段: is_archived")
        
        # 创建使用日志表
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS knowledge_usage_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                knowledge_id INTEGER NOT NULL,
                used_in_context VARCHAR(200),
                used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (knowledge_id) REFERENCES knowledge_base(id)
            )
        """))
        print("✅ 创建表: knowledge_usage_logs")
        
        # 创建索引
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_knowledge_usage_logs_knowledge_id 
            ON knowledge_usage_logs(knowledge_id)
        """))
        print("✅ 创建索引: idx_knowledge_usage_logs_knowledge_id")
        
        conn.commit()
        print("\n✅ 数据库迁移完成！")

if __name__ == "__main__":
    migrate()

