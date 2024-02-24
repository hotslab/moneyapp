import { createClient } from 'redis'
import env from '#start/env'

export default class NodeRedis {
  async io(urlString?: string) {
    const redis = createClient({
      url:
        urlString ||
        `redis://${env.get('REDIS_HOST', 'moneyapp_redis')}:${env.get('REDIS_PORT', '6379')}`,
    })
    redis.on('error', (err) => console.log('Redis Client Error', err))
    redis.connect()
    return redis
  }
}
