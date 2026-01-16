import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Prompt Types (not exported - Next.js route files can only export route handlers)
const PROMPT_TYPES = [
    { value: 'quality_check', label: '质量检测', description: '识别通话中的销售行为信号并评分' },
    { value: 'summarization', label: '通话摘要', description: '生成通话内容的结构化摘要' },
    { value: 'sentiment', label: '情感分析', description: '分析通话中的情感倾向' },
    { value: 'coaching', label: '辅导建议', description: '根据通话生成销售辅导建议' },
    { value: 'custom', label: '自定义', description: '自定义分析逻辑' }
];

// Available Variables (not exported - Next.js route files can only export route handlers)
const AVAILABLE_VARIABLES = [
    { name: 'transcript', description: '通话文本记录（JSON格式或纯文本）', example: '{{transcript}}' },
    { name: 'signals', description: '已配置的信号列表', example: '{{signals}}' },
    { name: 'tags', description: '已配置的标签列表', example: '{{tags}}' },
    { name: 'call_metadata', description: '通话元数据（时长、销售等）', example: '{{call_metadata}}' },
    { name: 'scoring_rules', description: '评分规则配置', example: '{{scoring_rules}}' }
];

// GET: Fetch all prompts with metadata
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const includeMetadata = searchParams.get('metadata') === 'true';

        const prompts = await prisma.prompt.findMany({
            orderBy: [
                { isDefault: 'desc' },
                { updatedAt: 'desc' }
            ]
        });

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
            await prisma.prompt.updateMany({
                data: { isDefault: false }
            });
        }

        await prisma.prompt.create({
            data: {
                id,
                name,
                version: version || '1.0',
                content,
                description: description || '',
                promptType: prompt_type || 'quality_check',
                variables: variables ? JSON.stringify(variables) : null,
                outputSchema: output_schema ? JSON.stringify(output_schema) : null,
                isDefault: is_default ? true : false,
                active: active !== false ? 1 : 0,
                createdAt: now,
                updatedAt: now,
            }
        });

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
            await prisma.prompt.updateMany({
                data: { isDefault: false }
            });
        }

        // Build update data dynamically
        const updateData: any = { updatedAt: now };

        if (name !== undefined) updateData.name = name;
        if (version !== undefined) updateData.version = version;
        if (content !== undefined) updateData.content = content;
        if (description !== undefined) updateData.description = description;
        if (prompt_type !== undefined) updateData.promptType = prompt_type;
        if (variables !== undefined) updateData.variables = variables ? JSON.stringify(variables) : null;
        if (output_schema !== undefined) updateData.outputSchema = output_schema ? JSON.stringify(output_schema) : null;
        if (is_default !== undefined) updateData.isDefault = is_default ? true : false;
        if (active !== undefined) updateData.active = active ? 1 : 0;

        await prisma.prompt.update({
            where: { id },
            data: updateData
        });

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
        const prompt = await prisma.prompt.findUnique({
            where: { id },
            select: { isDefault: true }
        });

        if (prompt?.isDefault) {
            return NextResponse.json({ error: 'Cannot delete the default prompt' }, { status: 400 });
        }

        await prisma.prompt.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting prompt:', error);
        return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 });
    }
}
