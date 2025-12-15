import prisma from '@/lib/prisma';

// --- Types ---
export type TranscriptEntry = {
    BeginTime?: number;
    SpeakerId?: string | number;
    Content?: string;
    Text?: string;
}

export type AnalysisResult = {
    rawOutput: string;
    parsedOutput: any;
    preparedPrompt: string;
    replacements: any[];
    isMock: boolean;
    networkError: string | null;
    executionTime: number;
    parseError?: string | null;
}

// --- Configuration ---
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// --- Helper Functions ---

// Format transcript JSON to readable string with truncation
export function formatTranscript(content: string | null): string {
    if (!content) return '';
    try {
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) return content;

        const fullText = parsed.map((item: TranscriptEntry) => {
            const time = new Date(item.BeginTime || 0).toISOString().substr(14, 5);
            return `[${time}] ${item.SpeakerId === 0 ? 'Agent' : 'Customer'}: ${item.Content || item.Text}`;
        }).join('\n');

        // Truncate if too long (max 30,000 chars to avoid timeouts)
        const MAX_LENGTH = 30000;
        if (fullText.length > MAX_LENGTH) {
            const keepStart = 20000;
            const keepEnd = 5000;
            return fullText.substring(0, keepStart) +
                `\n\n... [Transcript Truncated (${fullText.length - MAX_LENGTH} chars omitted) for Performance] ...\n\n` +
                fullText.substring(fullText.length - keepEnd);
        }

        return fullText;
    } catch (e) {
        return content;
    }
}

// Get signals list for variable replacement
async function getSignalsList(): Promise<string> {
    const signals = await prisma.signal.findMany({
        where: { active: 1 },
        select: { code: true, name: true, category: true, dimension: true, description: true }
    });

    if (signals.length === 0) {
        const tags = await prisma.tag.findMany({
            where: { active: 1 },
            select: { code: true, name: true, category: true, dimension: true, description: true }
        });
        return JSON.stringify(tags, null, 2);
    }
    return JSON.stringify(signals, null, 2);
}

// Get tags list for variable replacement
async function getTagsList(): Promise<string> {
    const tags = await prisma.tag.findMany({
        where: { active: 1 },
        select: { code: true, name: true, category: true, dimension: true, scoreRange: true, description: true }
    });
    return JSON.stringify(tags, null, 2);
}

// Get scoring rules for variable replacement
async function getScoringRules(): Promise<string> {
    const rules = await prisma.scoringRule.findMany({
        where: { active: 1 },
        select: { name: true, tagCode: true, targetDimension: true, scoreAdjustment: true, weight: true, description: true }
    });
    return JSON.stringify(rules, null, 2);
}

function generateMockResponse(transcript: string): string {
    return JSON.stringify({
        signals: [
            {
                code: "opening_complete",
                name: "开场完成",
                category: "Sales",
                dimension: "Process",
                polarity: "positive",
                score: 5,
                confidence: 0.95,
                timestamp_sec: 2,
                context_text: "您好，我是Geocms的销售代表Michael",
                reasoning: "Mock: 销售人员清晰地介绍了自己的姓名和公司。"
            }
        ],
        summary: {
            overall_assessment: "Mock: 这是一次模拟的分析结果。"
        }
    }, null, 2);
}

// Replace variables in prompt content
export function replaceVariables(
    content: string,
    variables: Record<string, string>
): { result: string; replacements: Array<{ variable: string; found: boolean }> } {
    const replacements: Array<{ variable: string; found: boolean }> = [];
    let result = content;

    const variablePatterns = [
        { pattern: /\{\{transcript\}\}/g, key: 'transcript' },
        { pattern: /\{\{signals\}\}/g, key: 'signals' },
        { pattern: /\{\{tags\}\}/g, key: 'tags' },
        { pattern: /\{\{call_metadata\}\}/g, key: 'call_metadata' },
        { pattern: /\{\{scoring_rules\}\}/g, key: 'scoring_rules' }
    ];

    for (const { pattern, key } of variablePatterns) {
        const found = pattern.test(content);
        replacements.push({ variable: key, found });

        if (found && variables[key]) {
            result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), variables[key]);
        }
    }

    return { result, replacements };
}

// Call DeepSeek API
export async function callDeepSeek(prompt: string, isPing: boolean = false): Promise<string> {
    if (!DEEPSEEK_API_KEY) {
        throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    const messages = [
        { role: "system", content: "You are a helpful AI assistant specialized in analyzing sales calls. You MUST return valid JSON. Do not return markdown blocks. Strictly follow the field names in the prompt." },
        { role: "user", content: prompt }
    ];

    if (isPing) {
        messages[1].content = "Reply with 'Pong'";
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: messages,
                temperature: isPing ? 0.1 : 0.7,
                max_tokens: isPing ? 10 : 4000,
                stream: false
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`DeepSeek API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error: any) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// --- Main Service Logic ---

/**
 * Analyzes a call using the provided prompt content.
 * Handles data fetching, variable replacement, AI execution, and result parsing.
 */
export async function analyzeCall(callId: string, promptContent: string, isPing: boolean = false): Promise<AnalysisResult> {
    const startTime = Date.now();
    let isMock = false;
    let networkError = null;
    let rawOutput = '';
    let parsedOutput: any = null;
    let parseError: string | null = null;

    // 1. Get Call Data
    const call = await prisma.call.findUnique({
        where: { id: callId },
        include: {
            agent: { select: { name: true } }
        }
    });

    if (!call) {
        throw new Error(`Call not found: ${callId}`);
    }

    // Get transcript
    const transcript = await prisma.transcript.findFirst({
        where: { dealId: callId },
        orderBy: { createdAt: 'desc' },
        select: { content: true }
    });

    // 2. Prepare Variables
    const variables: Record<string, string> = {
        transcript: formatTranscript(transcript?.content || null),
        signals: await getSignalsList(),
        tags: await getTagsList(),
        call_metadata: JSON.stringify({
            callId: call.id,
            agentName: call.agent.name,
            startedAt: call.startedAt,
            duration: call.duration,
            outcome: call.outcome
        }, null, 2),
        scoring_rules: await getScoringRules()
    };

    // 3. Replace Variables
    const { result: preparedPrompt, replacements } = replaceVariables(promptContent, variables);

    // 4. Ping Mode Check (Fast Exit)
    if (isPing) {
        try {
            const text = await callDeepSeek("", true);
            return {
                rawOutput: text, // 'Pong'
                parsedOutput: null,
                preparedPrompt, // Return preview
                replacements,
                isMock: false,
                networkError: null,
                executionTime: Date.now() - startTime
            };
        } catch (e: any) {
            throw new Error(`Ping Failed: ${e.message}`);
        }
    }

    // 5. Execute AI
    try {
        rawOutput = await callDeepSeek(preparedPrompt);
    } catch (apiError: any) {
        console.error('DeepSeek/AI Failed (falling back to mock):', apiError.message);
        networkError = apiError.message;
        isMock = true;
        rawOutput = generateMockResponse(transcript?.content || '');
    }

    // 6. Parse Output
    try {
        let cleanJson = rawOutput;
        if (cleanJson.includes('```json')) {
            cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        } else if (cleanJson.includes('```')) {
            cleanJson = cleanJson.replace(/```\n?/g, '').trim();
        }
        parsedOutput = JSON.parse(cleanJson);

        // Normalize Structure
        if (parsedOutput.signal_events && !parsedOutput.signals) {
            parsedOutput.signals = parsedOutput.signal_events;
            delete parsedOutput.signal_events;
        }

        // Normalize Signals
        if (Array.isArray(parsedOutput.signals)) {
            parsedOutput.signals = parsedOutput.signals.map((s: any) => ({
                ...s,
                name: s.name || s.signal_name,
                code: s.code || s.signal_code,
                score: typeof s.score === 'number' ? s.score : 0
            }));
        }
    } catch (e: any) {
        parseError = `JSON parse error: ${e.message}`;
    }

    return {
        rawOutput,
        parsedOutput,
        preparedPrompt,
        replacements,
        isMock,
        networkError,
        parseError,
        executionTime: Date.now() - startTime
    };
}
