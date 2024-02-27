import { createClient } from 'redis'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

export default class NodeRedis {
  async io(urlString?: string) {
    const redis = createClient({
      url:
        urlString ||
        `redis://${env.get('REDIS_HOST', 'moneyapp_redis')}:${env.get('REDIS_PORT', '6379')}`,
    })
    redis.on('error', (err) => logger.error({ error: err }, 'Redis Client Error'))
    redis.connect()
    return redis
  }
}
