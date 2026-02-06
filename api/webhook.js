import { Redis } from '@upstash/redis'

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
    // 1. YouTube Verification (GET request)
    if (req.method === 'GET') {
        const hubChallenge = req.query['hub.challenge']
        if (hubChallenge) {
            console.log('[Webhook] Verifying subscription...')
            return res.status(200).send(hubChallenge)
        }
        return res.status(400).send('No challenge provided')
    }

    // 2. YouTube Notification (POST request)
    if (req.method === 'POST') {
        console.log('[Webhook] Received new notification from YouTube!')

        try {
            // Xóa cache để ép Proxy fetch lại dữ liệu mới nhất (có Livestream)
            await redis.del('yt_data_all')
            await redis.del('yt_data_featured')
            await redis.del('yt_data_latest')

            console.log('[Webhook] Cache busted! New stream will be prioritized.')
            return res.status(200).send('OK')
        } catch (error) {
            console.error('[Webhook Error]:', error.message)
            return res.status(500).send('Internal Server Error')
        }
    }

    res.status(405).send('Method Not Allowed')
}
