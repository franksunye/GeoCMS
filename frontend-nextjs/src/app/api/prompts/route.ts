import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Prompt Types
export const PROMPT_TYPES = [
    { value: 'quality_check', label: '质量检测', description: '识别通话中的销售行为信号并评分' },
    { value: 'summarization', label: '通话摘要', description: '生成通话内容的结构化摘要' },
    { value: 'sentiment', label: '情感分析', description: '分析通话中的情感倾向' },
    { value: 'coaching', label: '辅导建议', description: '根据通话生成销售辅导建议' },
    { value: 'custom', label: '自定义', description: '自定义分析逻辑' }
];

// Available Variables
export const AVAILABLE_VARIABLES = [
    { name: 'transcript', description: '通话文本记录（JSON格式或纯文本）', example: '{{transcript}}' },
    { name: 'signals', description: '已配置的信号列表', example: '{{signals}}' },
    { name: 'tags', description: '已配置的标签列表', example: '{{tags}}' },
    { name: 'call_metadata', description: '通话元数据（时长、坐席等）', example: '{{call_metadata}}' },
    { name: 'scoring_rules', description: '评分规则配置', example: '{{scoring_rules}}' }
];

// GET: Fetch all prompts with metadata
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const includeMetadata = searchParams.get('metadata') === 'true';

        const prompts = db.prepare('SELECT * FROM prompts ORDER BY is_default DESC, updatedAt DESC').all();

        if (includeMetadata) {
            return NextResponse.json({
                prompts,
                promptTypes: PROMPT_TYPES,
                availableVariables: AVAILABLE_VARIABLES
            });
        }

        return NextResponse.json(prompts);
    } catch (error) {
        console.error('Error fetching prompts:', error);
        return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
    }
}

// POST: Create a new prompt
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, version, content, description, prompt_type, variables, output_schema, is_default, active } = body;

        // Validation
        if (!name || !content) {
            return NextResponse.json({ error: 'Name and Content are required' }, { status: 400 });
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        // If setting as default, unset others first
        if (is_default) {
            db.prepare('UPDATE prompts SET is_default = 0').run();
        }

        const stmt = db.prepare(`
      INSERT INTO prompts (id, name, version, content, description, prompt_type, variables, output_schema, is_default, active, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            name,
            version || '1.0',
            content,
            description || '',
            prompt_type || 'quality_check',
            variables ? JSON.stringify(variables) : null,
            output_schema ? JSON.stringify(output_schema) : null,
            is_default ? 1 : 0,
            active !== false ? 1 : 0,
            now,
            now
        );

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error('Error creating prompt:', error);
        return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
    }
}

// PUT: Update an existing prompt
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, version, content, description, prompt_type, variables, output_schema, is_default, active } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const now = new Date().toISOString();

        if (is_default) {
            db.prepare('UPDATE prompts SET is_default = 0').run();
        }

        const updates: string[] = [];
        const params: any[] = [];

        if (name) { updates.push('name = ?'); params.push(name); }
        if (version) { updates.push('version = ?'); params.push(version); }
        if (content) { updates.push('content = ?'); params.push(content); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description); }
        if (prompt_type) { updates.push('prompt_type = ?'); params.push(prompt_type); }
        if (variables !== undefined) {
            updates.push('variables = ?');
            params.push(variables ? JSON.stringify(variables) : null);
        }
        if (output_schema !== undefined) {
            updates.push('output_schema = ?');
            params.push(output_schema ? JSON.stringify(output_schema) : null);
        }
        if (is_default !== undefined) { updates.push('is_default = ?'); params.push(is_default ? 1 : 0); }
        if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0); }

        updates.push('updatedAt = ?');
        params.push(now);

        params.push(id); // For WHERE clause

        const sql = `UPDATE prompts SET ${updates.join(', ')} WHERE id = ?`;
        db.prepare(sql).run(...params);

        return NextResponse.json({ success: true, id });

    } catch (error) {
        console.error('Error updating prompt:', error);
        return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
    }
}

// DELETE: Deactivate a prompt (soft delete) or hard delete if needed
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Check if this is the default prompt
        const prompt = db.prepare('SELECT is_default FROM prompts WHERE id = ?').get(id) as any;
        if (prompt?.is_default) {
            return NextResponse.json({ error: 'Cannot delete the default prompt' }, { status: 400 });
        }

        db.prepare('DELETE FROM prompts WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting prompt:', error);
        return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 });
    }
}
