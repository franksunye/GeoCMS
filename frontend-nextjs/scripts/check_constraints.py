#!/usr/bin/env python3
"""
检查数据库表的约束 (外键、非空等)
"""
import os
import psycopg2

def check_constraints():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL 未设置")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        table_name = "log_prompt_execution"
        print(f"\n🔍 检查表: {table_name}")
        print("-" * 50)

        # 1. 检查列信息 (非空约束)
        cur.execute("""
            SELECT column_name, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = %s
        """, (table_name,))
        
        print("\n[列结构 & 非空约束]")
        print(f"{'列名':<20} {'允许为空':<10} {'类型'}")
        for row in cur.fetchall():
            print(f"{row[0]:<20} {row[1]:<10} {row[2]}")

        # 2. 检查外键约束
        cur.execute("""
            SELECT
                tc.constraint_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = %s
        """, (table_name,))
        
        print("\n[外键约束]")
        rows = cur.fetchall()
        if not rows:
            print("无外键约束")
        else:
            for row in rows:
                print(f"约束名: {row[0]}")
                print(f"  {row[1]} ->Ref-> {row[2]}.{row[3]}")

        conn.close()

    except Exception as e:
        print(f"❌ 错误: {e}")

if __name__ == "__main__":
    check_constraints()
