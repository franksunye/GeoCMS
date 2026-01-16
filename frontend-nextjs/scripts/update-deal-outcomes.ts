/**
 * 临时脚本：根据合同表更新工单的 outcome
 * 逻辑：如果 deal 在 sync_contracts 中有对应记录 (deal_id 匹配)，则 outcome = 'won'
 *       否则 outcome = 'lost'
 * 
 * 使用方法：npx tsx scripts/update-deal-outcomes.ts
 */

import Database from 'better-sqlite3';
import path from 'path';

// Database Setup
const dbPath = path.join(process.cwd(), 'team-calls.db');
const db = new Database(dbPath);

console.log('='.repeat(60));
console.log('更新工单 Outcome 脚本');
console.log('逻辑: 有合同 = won, 无合同 = lost');
console.log('='.repeat(60));

// 1. 先统计当前状态
const beforeStats = db.prepare(`
  SELECT outcome, COUNT(*) as count 
  FROM sync_deals 
  GROUP BY outcome
`).all() as { outcome: string; count: number }[];

console.log('\n📊 更新前状态:');
beforeStats.forEach(row => {
  console.log(`  - ${row.outcome || '(空)'}: ${row.count} 条`);
});

// 2. 获取所有有合同的 deal_id
const contractDealIds = db.prepare(`
  SELECT DISTINCT deal_id FROM sync_contracts WHERE deal_id IS NOT NULL
`).all() as { deal_id: string }[];

const contractDealIdSet = new Set(contractDealIds.map(r => r.deal_id));
console.log(`\n📋 合同表中有 ${contractDealIdSet.size} 个不同的 deal_id`);

// 3. 获取所有 deals
const allDeals = db.prepare(`SELECT id, outcome FROM sync_deals`).all() as { id: string; outcome: string }[];
console.log(`📋 工单表中共有 ${allDeals.length} 条记录`);

// 4. 分类统计
let toWon = 0;
let toLost = 0;
let alreadyCorrect = 0;

for (const deal of allDeals) {
  const hasContract = contractDealIdSet.has(deal.id);
  const expectedOutcome = hasContract ? 'won' : 'lost';

  if (deal.outcome === expectedOutcome) {
    alreadyCorrect++;
  } else if (expectedOutcome === 'won') {
    toWon++;
  } else {
    toLost++;
  }
}

console.log(`\n📈 预计变更:`);
console.log(`  - 需更新为 won: ${toWon} 条`);
console.log(`  - 需更新为 lost: ${toLost} 条`);
console.log(`  - 已正确无需更新: ${alreadyCorrect} 条`);

// 5. 执行更新
console.log('\n🔄 开始更新...');

// sync_deals 更新
const updateDealsToWon = db.prepare(`
  UPDATE sync_deals SET outcome = 'won' 
  WHERE id IN (SELECT deal_id FROM sync_contracts WHERE deal_id IS NOT NULL)
`);

const updateDealsToLost = db.prepare(`
  UPDATE sync_deals SET outcome = 'lost' 
  WHERE id NOT IN (SELECT deal_id FROM sync_contracts WHERE deal_id IS NOT NULL)
`);

// biz_calls 同步更新 (保持数据一致性)
const updateCallsToWon = db.prepare(`
  UPDATE biz_calls SET outcome = 'won' 
  WHERE id IN (SELECT deal_id FROM sync_contracts WHERE deal_id IS NOT NULL)
`);

const updateCallsToLost = db.prepare(`
  UPDATE biz_calls SET outcome = 'lost' 
  WHERE id NOT IN (SELECT deal_id FROM sync_contracts WHERE deal_id IS NOT NULL)
`);

const transaction = db.transaction(() => {
  // Update sync_deals
  const dealsWonResult = updateDealsToWon.run();
  const dealsLostResult = updateDealsToLost.run();

  // Update biz_calls (for Scorecard/Analysis consistency)
  const callsWonResult = updateCallsToWon.run();
  const callsLostResult = updateCallsToLost.run();

  return {
    dealsWonChanges: dealsWonResult.changes,
    dealsLostChanges: dealsLostResult.changes,
    callsWonChanges: callsWonResult.changes,
    callsLostChanges: callsLostResult.changes
  };
});

const result = transaction();

console.log(`✅ 更新完成:`);
console.log(`  sync_deals:`);
console.log(`    - 更新为 won: ${result.dealsWonChanges} 条`);
console.log(`    - 更新为 lost: ${result.dealsLostChanges} 条`);
console.log(`  biz_calls (Scorecard/Analysis):`);
console.log(`    - 更新为 won: ${result.callsWonChanges} 条`);
console.log(`    - 更新为 lost: ${result.callsLostChanges} 条`);

// 6. 验证更新后状态
const afterStats = db.prepare(`
  SELECT outcome, COUNT(*) as count 
  FROM sync_deals 
  GROUP BY outcome
`).all() as { outcome: string; count: number }[];

console.log('\n📊 更新后状态:');
afterStats.forEach(row => {
  console.log(`  - ${row.outcome}: ${row.count} 条`);
});

// 7. 计算转化率
const totalDeals = allDeals.length;
const wonDeals = afterStats.find(r => r.outcome === 'won')?.count || 0;
const conversionRate = totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(2) : '0';

console.log(`\n📈 总体转化率: ${wonDeals}/${totalDeals} = ${conversionRate}%`);
console.log('\n✅ 脚本执行完成');
