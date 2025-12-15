
import prisma from '../src/lib/prisma'

/**
 * Sync Audio URLs Script
 * 
 * 仅从 Transcripts 表同步 audioUrl 到 Calls 表。
 * 不会删除或重建任何数据。
 * 
 * Usage: npx tsx scripts/sync-audio-urls.ts
 */
async function syncAudioUrls() {
    console.log('='.repeat(50))
    console.log('Starting Audio URL Sync...')
    console.log('='.repeat(50))

    try {
        // 1. 获取所有带有 audioUrl 的 transcripts
        // 我们只需要 dealId (对应 callId) 和 audioUrl
        const transcripts = await prisma.transcript.findMany({
            where: {
                audioUrl: {
                    not: null
                }
            },
            select: {
                dealId: true,
                audioUrl: true
            }
        })

        console.log(`Found ${transcripts.length} transcripts with audio data.`)
        console.log('-'.repeat(50))

        let updatedCount = 0
        let skippedCount = 0

        // 2. 遍历并更新对应的 Call
        for (const t of transcripts) {
            if (!t.audioUrl || !t.dealId) continue

            try {
                // 使用 updateMany 以避免"记录不存在"时抛出错误
                // Call.id 对应 Transcript.dealId
                const result = await prisma.call.updateMany({
                    where: {
                        id: t.dealId
                    },
                    data: {
                        audioUrl: t.audioUrl
                    }
                })

                if (result.count > 0) {
                    updatedCount++
                    process.stdout.write('.') // Progress indicator
                } else {
                    skippedCount++
                }
            } catch (e) {
                console.error(`\nError updating call ${t.dealId}:`, e)
            }
        }

        console.log('\n' + '='.repeat(50))
        console.log('Sync Completed!')
        console.log(`  - Transcripts Checked: ${transcripts.length}`)
        console.log(`  - Calls Updated:       ${updatedCount}`)
        console.log(`  - Calls Not Found:     ${skippedCount}`)
        console.log('='.repeat(50))

    } catch (error) {
        console.error('Fatal Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// Run the script
syncAudioUrls()
