import { createClient } from 'redis'
import env from '#start/env'

const redis = createClient({
  url: `redis://${env.get('REDIS_HOST', 'moneyapp_redis')}:${env.get('REDIS_PORT', '6379')}`,
})
redis.on('error', (err) => console.log('Redis Client Error', err))
redis.connect()
export default redis

// import Redis from 'ioredis'
// import env from '#start/env'

// class IORedis {
//   async io() {
//     const port = env.get('REDIS_PORT')
//     const redis = new Redis.default({
//       port: port ? Number.parseInt(port) : 6379,
//       host: env.get('REDIS_HOST', 'moneyapp_redis'),
//     })
//     return redis
//   }
// }

// export default IORedis
