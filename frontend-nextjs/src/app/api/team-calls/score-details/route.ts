import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const dimension = searchParams.get('dimension');
  const tagName = searchParams.get('tagName');
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  try {
    // 1. Fetch Tags
    let tagQuery = 'SELECT * FROM tags WHERE active = 1';
    const tagParams: any[] = [];

    if (category && category !== 'all') {
      tagQuery += ' AND category = ?';
      tagParams.push(category);
    }

    if (dimension && dimension !== 'all') {
      tagQuery += ' AND dimension = ?';
      tagParams.push(dimension);
    }

    if (tagName && tagName !== 'all') {
      tagQuery += ' AND name = ?';
      tagParams.push(tagName);
    }

    // Sort tags for consistent display
    tagQuery += ' ORDER BY category, dimension, code';

    const tags = db.prepare(tagQuery).all(tagParams) as any[];
    const tagIds = tags.map(t => t.id);

    if (tagIds.length === 0) {
      return NextResponse.json({ tags: [], calls: [], assessments: {} });
    }

    // 2. Fetch Recent Calls
    const calls = db.prepare(`
      SELECT c.id, c.startedAt, c.outcome, c.agentId, a.name as agentName
      FROM calls c
      LEFT JOIN agents a ON c.agentId = a.id
      ORDER BY c.startedAt DESC 
      LIMIT ?
    `).all(limit) as any[];

    if (calls.length === 0) {
      return NextResponse.json({ tags, calls: [], assessments: {} });
    }

    const callIds = calls.map(c => c.id);

    // 3. Fetch Assessments for these calls and tags
    // better-sqlite3 doesn't support array binding easily for IN clause, need to generate placeholders
    const callPlaceholders = callIds.map(() => '?').join(',');
    const tagPlaceholders = tagIds.map(() => '?').join(',');

    const assessmentQuery = `
      SELECT callId, tagId, score, context_text, confidence
      FROM call_assessments
      WHERE callId IN (${callPlaceholders})
      AND tagId IN (${tagPlaceholders})
    `;

    const assessments = db.prepare(assessmentQuery).all([...callIds, ...tagIds]) as any[];

    // 4. Structure Assessments for easy lookup: [callId]_[tagId] -> Assessment
    const assessmentMap: Record<string, any> = {};
    assessments.forEach(a => {
      const key = `${a.callId}_${a.tagId}`;
      assessmentMap[key] = a;
    });

    // 5. Get Filter Options for the UI (cascading)
    const allTags = db.prepare('SELECT id, category, dimension, name FROM tags WHERE active = 1 ORDER BY category, dimension, name').all();

    return NextResponse.json({
      tags,
      calls,
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
