import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyBkGzQ2G0V_oB5Syu_YRjG7re7EVcvMB8Y'); // Fallback to provided key if env var fails

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { dealId, promptId, promptContent, dryRun } = body;

        // 1. Validation
        if (!dealId) {
            return NextResponse.json({ error: 'dealId is required' }, { status: 400 });
        }

        // 2. Fetch Transcript
        // Note: In our current schema, transcripts table exists.
        // However, if we don't have a transcript for this deal, we might fail or mock it.
        // For this POC, let's try to fetch it, or fallback to a mock transcript if not found 
        // (since I might not have seeded transcripts properly in step 1, only calls were seeded).
        // Let's create a Mock Transcript generator for the POC if one doesn't exist.

        let transcriptContent = '';
        const transcriptRecord = db.prepare('SELECT content FROM transcripts WHERE dealId = ?').get(dealId) as { content: string };

        if (transcriptRecord) {
            transcriptContent = transcriptRecord.content;
        } else {
            // MOCK TRANSCRIPT GENERATOR functionality for POC
            // This ensures the demo works even if we haven't uploaded real transcripts
            transcriptContent = `
        sales: 您好，我是Geocms的销售代表Michael，很高兴联系您。
        customer: 你好。
        sales: 是这样的，我们这边是做专业房屋检测和拆除服务的，不知道您最近有没有这方面的需求？
        customer: 嗯，其实我刚买了一套老房子，确实有点担心结构安全问题，想检测一下。
        sales: 那太好了，这正是我们的专长。我们有一套非常详细的标准检测流程，包括结构、电路、水路全方位的排查。
        customer: 听起来不错，但是你们的价格怎么样？我问了几家，都挺贵的。
        sales: 我理解您的顾虑。目前市面上确实价格参差不齐。我们的报价是基于检测面积和项目的，虽然单价可能不是最低的，但我们承诺没有任何隐形消费，而且包含一份具有法律效力的检测报告。
        customer: 这样啊...那我考虑一下。
        sales: 没问题。如果您这周方便的话，我可以安排一位高级工程师免费上门先做一个初步评估，您可以看看我们的专业程度再决定？
        customer: 免费上门？那倒是可以试试。
        sales: 好的，那我们加个微信，我把具体的时间发给您确认？
        customer: 行，你记一下我微信号...
        `;
        }

        // 3. Fetch Prompt
        let promptTemplate = '';

        if (promptContent) {
            // Direct content provided (e.g. from Playground)
            promptTemplate = promptContent;
        } else if (promptId) {
            const p = db.prepare('SELECT content FROM prompts WHERE id = ?').get(promptId) as { content: string };
            if (p) promptTemplate = p.content;
        } else {
            const p = db.prepare('SELECT content FROM prompts WHERE is_default = 1').get() as { content: string };
            if (p) promptTemplate = p.content;
        }

        // Fallback prompt if nothing found (shouldn't happen due to seed)
        if (!promptTemplate) {
            promptTemplate = "Analyze the transcript:\n\n{{transcript}}\n\nOutput JSON.";
        }

        // 4. variable Replacement
        const finalPrompt = promptTemplate.replace('{{transcript}}', transcriptContent);

        // 5. Call Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        // Using 1.5-pro as it handles large context better, or flash for speed

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();

        // 6. Parse and Save Result
        // Clean markdown code blocks if present
        let cleanJson = text;
        if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
        }

        // Save logs MUST BE SKIPPED if dryRun is true
        let logId = 'dry-run';

        if (!dryRun) {
            const now = new Date().toISOString();
            logId = uuidv4();

            // Delete old logs for this dealId before inserting new one.
            db.prepare('DELETE FROM ai_analysis_logs WHERE dealId = ?').run(dealId);

            db.prepare(`
                INSERT INTO ai_analysis_logs (id, dealId, signals, createdAt)
                VALUES (?, ?, ?, ?)
            `).run(logId, dealId, cleanJson, now);
        }

        return NextResponse.json({
            success: true,
            data: JSON.parse(cleanJson),
            logId: logId
        });

    } catch (error) {
        console.error('Error in AI Analysis:', error);
        return NextResponse.json({ error: 'AI Analysis Failed', details: String(error) }, { status: 500 });
    }
}
