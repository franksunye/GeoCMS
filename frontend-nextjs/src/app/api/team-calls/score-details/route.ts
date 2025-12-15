import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getStorageUrl } from '@/lib/storage';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const dimension = searchParams.get('dimension');
  const tagName = searchParams.get('tagName');
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  try {
    // 1. Build tag filter
    const tagWhere: any = { active: 1 };

    if (category && category !== 'all') {
      tagWhere.category = category;
    }
    if (dimension && dimension !== 'all') {
      tagWhere.dimension = dimension;
    }
    if (tagName && tagName !== 'all') {
      tagWhere.name = tagName;
    }

    // Fetch Tags
    const tags = await prisma.tag.findMany({
      where: tagWhere,
      orderBy: [
        { category: 'asc' },
        { dimension: 'asc' },
        { code: 'asc' }
      ]
    });

    const tagIds = tags.map(t => t.id);

    if (tagIds.length === 0) {
      return NextResponse.json({ tags: [], calls: [], assessments: {} });
    }

    // 2. Fetch Recent Calls
    const calls = await prisma.call.findMany({
      select: {
        id: true,
        startedAt: true,
        outcome: true,
        agentId: true,
        duration: true,
        audioUrl: true,
        agent: { select: { name: true } }
      },
      orderBy: { startedAt: 'desc' },
      take: limit
    });

    if (calls.length === 0) {
      return NextResponse.json({ tags, calls: [], assessments: {} });
    }

    const callIds = calls.map(c => c.id);

    // 3. Fetch Assessments for these calls and tags
    const assessments = await prisma.callAssessment.findMany({
      where: {
        callId: { in: callIds },
        tagId: { in: tagIds }
      },
      select: {
        callId: true,
        tagId: true,
        score: true,
        contextText: true,
        contextEvents: true,
        confidence: true
      }
    });

    // 4. Structure Assessments for easy lookup: [callId]_[tagId] -> Assessment
    const assessmentMap: Record<string, any> = {};
    assessments.forEach(a => {
      const key = `${a.callId}_${a.tagId}`;
      assessmentMap[key] = {
        callId: a.callId,
        tagId: a.tagId,
        score: a.score,
        context_text: a.contextText,
        context_events: a.contextEvents,
        confidence: a.confidence
      };
    });

    // 5. Get Filter Options for the UI (cascading)
    const allTags = await prisma.tag.findMany({
      where: { active: 1 },
      select: {
        id: true,
        category: true,
        dimension: true,
        name: true
      },
      orderBy: [
        { category: 'asc' },
        { dimension: 'asc' },
        { name: 'asc' }
      ]
    });

    // Format calls to include agentName at top level
    const formattedCalls = calls.map(c => ({
      id: c.id,
      startedAt: c.startedAt,
      outcome: c.outcome,
      agentId: c.agentId,
      agentName: c.agent.name,
      duration: c.duration || 0,
      audioUrl: getStorageUrl(c.audioUrl)
    }));

    return NextResponse.json({
      tags,
      calls: formattedCalls,
      assessments: assessmentMap,
      filters: {
        allTags
      }
    });

  } catch (error) {
    console.error('Error fetching score details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
