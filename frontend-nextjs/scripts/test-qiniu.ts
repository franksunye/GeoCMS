
import dotenv from 'dotenv'
import { getStorageUrl } from '../src/lib/storage'
import path from 'path'

// 显式加载 .env 文件，因为在这个脚本环境下 Next.js 不会自动加载
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function testQiniu() {
    console.log('='.repeat(50))
    console.log('Testing Qiniu URL Generation')
    console.log('='.repeat(50))

    const testFile = '893302338155528192.mp3'

    // 打印配置状态（掩码处理，确保安全）
    const accessKey = process.env.QINIU_ACCESS_KEY || process.env['qiniu.accessKey'] || ''
    const secretKey = process.env.QINIU_SECRET_KEY || process.env['qiniu.secretKey'] || ''

    console.log(`Access Key Loaded: ${accessKey ? 'YES (' + accessKey.substring(0, 4) + '...)' : 'NO'}`)
    console.log(`Secret Key Loaded: ${secretKey ? 'YES' : 'NO'}`)
    console.log(`Bucket (Priv): ${process.env.QINIU_BUCKET_NAME_PRIV || process.env['qiniu.bucketNamePriv'] || 'default'}`)
    console.log('-'.repeat(50))

    // 生成链接
    try {
        const url = getStorageUrl(testFile)
        console.log(`Test File: ${testFile}`)
        console.log(`Generated URL:`)
        console.log(url)

        console.log('\nVerification Tips:')
        console.log('1. URL should start with https://priv.fsgo365.cn')
        console.log('2. URL should contain "e=" (expiration) and "token=" params')
        console.log('3. You can copy-paste this URL into a browser to test playback.')
    } catch (error) {
        console.error('Error generating URL:', error)
    }
}

testQiniu()
