/**
 * Causal Analysis for "Zero-Cost Commitment" (方案免费)
 * 
 * This script analyzes the causal impact of mentioning "free" or "no charge" 
 * on the conversion rates (onsite and win).
 */
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
    mentionsFreeRate: number // Percentage of calls where agent mentioned "free"
    avgDuration: number
    winRate: number
    onsiteRate: number
    treatment: boolean // High frequency user of "free" strategy
    propensity: number
}

const analysisConfigs = [
    {
        name: 'Zero-Cost Commitment (方案免费)',
        keywords: ['免费', '不收费', '不收钱', '不花钱', '零费用', '免收'],
        threshold: 0.15
    },
    {
        name: 'Professional Tool Signals (专业工具)',
        keywords: ['热成像', '红外', '检测仪', '探测仪', '仪器'],
        threshold: 0.05 // Professional tools are mentioned less frequently
    }
];

function runAnalysis() {
    console.log('🔬 Causal Analysis: Keyword-Based Virtual Tags')
    console.log('═'.repeat(60))

    for (const config of analysisConfigs) {
        console.log(`\n\n📊 Analyzing: ${config.name}`)
        console.log('─'.repeat(60))

        // 1. Identify keywords
        const keywordPattern = config.keywords.map(k => `content LIKE '%${k}%'`).join(' OR ');

        // 2. Get call-level treatment
        const callTreatments = db.prepare(`
            SELECT 
                st.deal_id,
                st.agent_id,
                CASE WHEN (${keywordPattern}) THEN 1 ELSE 0 END as treated
            FROM sync_transcripts st
        `).all() as { deal_id: string; agent_id: string; treated: number }[]

        const agentTreatmentStats = new Map<string, { total: number, treated: number }>();
        callTreatments.forEach(c => {
            const stats = agentTreatmentStats.get(c.agent_id) || { total: 0, treated: 0 };
            stats.total++;
            if (c.treated) stats.treated++;
            agentTreatmentStats.set(c.agent_id, stats);
        });

        // 3. Get agent outcome stats
        const agentOutcomes = db.prepare(`
            SELECT 
                sd.agent_id,
                COUNT(*) as total_deals,
                SUM(CASE WHEN sd.outcome = 'won' THEN 1 ELSE 0 END) as won_deals,
                SUM(CASE WHEN sd.is_onsite_completed = 1 THEN 1 ELSE 0 END) as onsite_deals
            FROM sync_deals sd
            WHERE sd.agent_id IN (SELECT DISTINCT agent_id FROM biz_calls)
            GROUP BY sd.agent_id
        `).all() as { agent_id: string; total_deals: number; won_deals: number; onsite_deals: number }[]

        const agentDurations = db.prepare(`
            SELECT agent_id, AVG(duration) as avg_duration
            FROM biz_calls
            GROUP BY agent_id
        `).all() as { agent_id: string; avg_duration: number }[]
        const durationMap = new Map(agentDurations.map(a => [a.agent_id, a.avg_duration || 0]));

        // 4. Build Agent Dataset
        const agents: AgentData[] = agentOutcomes
            .filter(a => a.total_deals >= 5)
            .map(a => {
                const tStats = agentTreatmentStats.get(a.agent_id) || { total: 0, treated: 0 };
                const treatmentRate = tStats.total > 0 ? tStats.treated / tStats.total : 0;
                return {
                    id: a.agent_id,
                    totalDeals: a.total_deals,
                    wonDeals: a.won_deals,
                    onsiteDeals: a.onsite_deals,
                    mentionsFreeRate: treatmentRate,
                    avgDuration: durationMap.get(a.agent_id) || 0,
                    winRate: a.won_deals / a.total_deals,
                    onsiteRate: a.onsite_deals / a.total_deals,
                    treatment: treatmentRate > config.threshold,
                    propensity: 0
                };
            });

        const maxDeals = Math.max(...agents.map(a => a.totalDeals));
        const maxDuration = Math.max(...agents.map(a => a.avgDuration));

        agents.forEach(a => {
            a.propensity = 0.5 * (a.totalDeals / maxDeals) + 0.5 * (a.avgDuration / maxDuration);
        });

        const treated = agents.filter(a => a.treatment);
        const control = agents.filter(a => !a.treatment);

        console.log(`Summary:`)
        console.log(`- Total agents analyzed: ${agents.length}`)
        console.log(`- Treated (Use strategy > ${config.threshold * 100}%): ${treated.length}`)
        console.log(`- Control (Rarely use strategy): ${control.length}`)
        console.log('─'.repeat(60))

        // Method 1: Naive ATE
        const naiveWin = treated.reduce((s, a) => s + a.winRate, 0) / treated.length -
            control.reduce((s, a) => s + a.winRate, 0) / control.length;
        const naiveOnsite = treated.reduce((s, a) => s + a.onsiteRate, 0) / treated.length -
            control.reduce((s, a) => s + a.onsiteRate, 0) / control.length;

        // Method 2: PSM Matching
        const matchedPairs: { treated: AgentData; control: AgentData }[] = [];
        const usedControl = new Set<string>();

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
            if (bestMatch && bestDist < 0.2) {
                matchedPairs.push({ treated: t, control: (bestMatch as AgentData) });
                usedControl.add((bestMatch as AgentData).id);
            }
        });

        const psmWin = matchedPairs.length > 0 ?
            matchedPairs.reduce((s, p) => s + (p.treated.winRate - p.control.winRate), 0) / matchedPairs.length : 0;
        const psmOnsite = matchedPairs.length > 0 ?
            matchedPairs.reduce((s, p) => s + (p.treated.onsiteRate - p.control.onsiteRate), 0) / matchedPairs.length : 0;

        // Output Results
        console.log('\nMethod       | Win Rate Effect | Onsite Rate Effect | Matches')
        console.log('─────────────┼─────────────────┼────────────────────┼────────')
        console.log(`Naive ATE    | ${(naiveWin * 100).toFixed(2).padStart(13)}% | ${(naiveOnsite * 100).toFixed(2).padStart(16)}% | N/A`)
        console.log(`PSM ATT      | ${(psmWin * 100).toFixed(2).padStart(13)}% | ${(psmOnsite * 100).toFixed(2).padStart(16)}% | ${matchedPairs.length}`)

        console.log('\n📋 Interpretation:')
        if (psmWin > 0.02 && psmOnsite > 0.02) {
            console.log(`✅ "${config.name}" strategy has a positive causal effect on both win and onsite rates.`);
        } else if (psmWin < -0.02) {
            console.log(`❌ "${config.name}" strategy appears to negatively impact conversion (counter-intuitive).`);
        } else {
            console.log(`⚠️ The effect for "${config.name}" is negligible or inconsistent. It might be a weak signal or noisy.`);
        }
    }
    db.close();
}

runAnalysis();
