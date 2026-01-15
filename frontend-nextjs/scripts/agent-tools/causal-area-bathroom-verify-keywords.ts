
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(process.cwd(), 'team-calls.db')
const db = new Database(dbPath)

interface AgentData {
    id: string
    totalDeals: number
    wonDeals: number
    onsiteDeals: number
    // Rates
    winRate: number
    onsiteRate: number
    // Treatment
    mentionsKeywordRate: number
    treated: boolean
    // PSM
    propensity: number
}

const keywordConfigs = [
    {
        name: 'Zero-Cost (免费上门)',
        keywords: ['免费', '不收费', '不收钱', '不花钱', '零费用', '免收'],
        threshold: 0.15
    },
    {
        name: 'Pro Tools (热成像/仪器)',
        keywords: ['热成像', '红外', '检测仪', '探测仪', '仪器'],
        threshold: 0.05
    },
    {
        name: 'Destructive (砸/拆/破坏)',
        keywords: ['砸', '拆', '破坏', '扒开', '敲开'],
        threshold: 0.10
    }
];

function runBathroomKeywordAnalysis() {
    console.log('🔬 BATHROOM-SPECIFIC KEYWORD CAUSAL ANALYSIS (PSM)')
    console.log('Target Area: Bathroom (Leak Area Code: "2")')
    console.log('Goal: Determine if specific words drive Onsite/Win rates.\n')

    // 1. Base Agent Stats (Bathroom Only)
    // Only agents with at least 5 bathroom deals to ensure stability
    const agentStats = db.prepare(`
        SELECT 
            sd.agent_id,
            COUNT(*) as total_deals,
            SUM(CASE WHEN sd.outcome = 'won' THEN 1 ELSE 0 END) as won_deals,
            SUM(CASE WHEN sd.is_onsite_completed = 1 THEN 1 ELSE 0 END) as onsite_deals
        FROM sync_deals sd
        WHERE sd.leak_area LIKE '%2%'
        AND sd.agent_id IN (SELECT DISTINCT agent_id FROM biz_calls)
        GROUP BY sd.agent_id
        HAVING total_deals >= 3
    `).all() as { agent_id: string; total_deals: number; won_deals: number; onsite_deals: number }[]

    const agentDurations = db.prepare(`
        SELECT agent_id, AVG(duration) as avg_duration
        FROM biz_calls
        GROUP BY agent_id
    `).all() as { agent_id: string; avg_duration: number }[]
    const durationMap = new Map(agentDurations.map(a => [a.agent_id, a.avg_duration || 0]));

    console.log(`📊 Analyzable Agents (Bathroom >= 3 deals): ${agentStats.length}\n`)

    console.log('Keyword Strategy       | Onsite ATT (Causal) | Win ATT (Causal)   | Matches')
    console.log('-----------------------+---------------------+--------------------+--------')

    for (const config of keywordConfigs) {
        // 2. Identify keyword usage in bathroom deals
        // We need to join sync_transcripts with sync_deals to filter by leak_area
        const keywordPattern = config.keywords.map(k => `st.content LIKE '%${k}%'`).join(' OR ');

        const callTreatments = db.prepare(`
            SELECT 
                st.deal_id,
                st.agent_id,
                CASE WHEN (${keywordPattern}) THEN 1 ELSE 0 END as treated
            FROM sync_transcripts st
            JOIN sync_deals sd ON st.deal_id = sd.id
            WHERE sd.leak_area LIKE '%2%'
        `).all() as { deal_id: string; agent_id: string; treated: number }[]

        const agentTreatmentStats = new Map<string, { total: number, treated: number }>();
        callTreatments.forEach(c => {
            const stats = agentTreatmentStats.get(c.agent_id) || { total: 0, treated: 0 };
            stats.total++;
            if (c.treated) stats.treated++;
            agentTreatmentStats.set(c.agent_id, stats);
        });

        // 3. Build Agent Dataset
        const agents: AgentData[] = agentStats.map(a => {
            const tStats = agentTreatmentStats.get(a.agent_id) || { total: 0, treated: 0 };
            const treatmentRate = tStats.total > 0 ? tStats.treated / tStats.total : 0;
            const maxDeals = Math.max(...agentStats.map(stat => stat.total_deals));
            const maxDuration = Math.max(...Array.from(durationMap.values()));

            return {
                id: a.agent_id,
                totalDeals: a.total_deals,
                wonDeals: a.won_deals,
                onsiteDeals: a.onsite_deals,
                winRate: a.won_deals / a.total_deals,
                onsiteRate: a.onsite_deals / a.total_deals,
                mentionsKeywordRate: treatmentRate,
                treated: treatmentRate > config.threshold,
                propensity: 0.5 * (a.total_deals / maxDeals) + 0.5 * ((durationMap.get(a.agent_id) || 0) / maxDuration)
            };
        });

        // 4. PSM Matching
        const treated = agents.filter(a => a.treated);
        const control = agents.filter(a => !a.treated);
        const matchedPairs: { treated: AgentData; control: AgentData }[] = [];
        const usedControl = new Set<string>();

        if (treated.length > 0 && control.length > 0) {
            treated.sort((a, b) => b.propensity - a.propensity).forEach(t => {
                let bestMatch: AgentData | null = null;
                let bestDist = Infinity;
                control.forEach(c => {
                    if (usedControl.has(c.id)) return;
                    const dist = Math.abs(t.propensity - c.propensity);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestMatch = c;
                    }
                });
                if (bestMatch && bestDist < 0.25) { // Relaxed caliper for small sample
                    matchedPairs.push({ treated: t, control: (bestMatch as AgentData) });
                    usedControl.add((bestMatch as AgentData).id);
                }
            });
        }

        // 5. Calculate ATT
        let attOnsite = 0;
        let attWin = 0;

        if (matchedPairs.length > 0) {
            attOnsite = matchedPairs.reduce((s, p) => s + (p.treated.onsiteRate - p.control.onsiteRate), 0) / matchedPairs.length;
            attWin = matchedPairs.reduce((s, p) => s + (p.treated.winRate - p.control.winRate), 0) / matchedPairs.length;
        }

        const onsiteColor = attOnsite > 0 ? '\x1b[32m' : '\x1b[31m';
        const winColor = attWin > 0 ? '\x1b[32m' : '\x1b[31m';

        console.log(`${config.name.padEnd(22)} | ${onsiteColor}${(attOnsite * 100).toFixed(2).padStart(8)}%\x1b[0m            | ${winColor}${(attWin * 100).toFixed(2).padStart(8)}%\x1b[0m           | ${matchedPairs.length}`)
    }

    db.close()
}

runBathroomKeywordAnalysis()
