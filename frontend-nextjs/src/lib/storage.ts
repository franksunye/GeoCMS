import qiniu from 'qiniu'

// Lazy load config to ensure environment variables are loaded
function getConfig() {
  return {
    accessKey: process.env.QINIU_ACCESS_KEY || process.env['qiniu.accessKey'] || '',
    secretKey: process.env.QINIU_SECRET_KEY || process.env['qiniu.secretKey'] || '',
    bucket: process.env.QINIU_BUCKET_NAME_PRIV || process.env['qiniu.bucketNamePriv'] || 'fs-go-priv',
    domain: process.env.QINIU_DOWNLOAD_HOST_PRIV || process.env['qiniu.downloadHostPriv'] || 'https://priv.fsgo365.cn',
    expires: 3600
  }
}

/**
 * Generate a download URL for a file.
 * Automatically handles public vs private bucket signing logic based on configuration.
 * 
 * @param key The filename (key) in the bucket, or a full URL.
 * @returns The fully qualified, potentially signed download URL.
 */
export function getStorageUrl(key: string | null | undefined): string {
  if (!key) return ''

  // If it's already a full URL, return it as is
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key
  }

  const conf = getConfig()
  if (!conf.accessKey || !conf.secretKey) {
    console.warn('Qiniu Access/Secret Key not configured, returning raw key')
    return key
  }

  // Initialize Mac (Auth)
  const mac = new qiniu.auth.digest.Mac(conf.accessKey, conf.secretKey)
  const qiniuConfig = new qiniu.conf.Config()

  // Ensure domain doesn't end with slash if we append key directly, 
  // but qiniu SDK handles this usually. Let's clean it just in case.
  const domain = conf.domain.replace(/\/$/, '')

  // Construct the private download URL
  // The SDK's privateDownloadUrl method requires the domain and key
  const manager = new qiniu.rs.BucketManager(mac, qiniuConfig)
  // Deadline MUST be an integer (seconds), or 401 will occur
  const deadline = Math.floor(Date.now() / 1000) + conf.expires
  const privateDownloadUrl = manager.privateDownloadUrl(domain, key, deadline)

  return privateDownloadUrl
}

/**
 * Helper specifically for audio URLs, handling potential empty/nulls gracefully
 */
export function getAudioOptions(audioKey: string | null) {
  if (!audioKey) return { audioUrl: null }
  return { audioUrl: getStorageUrl(audioKey) }
}
