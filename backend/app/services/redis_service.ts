import Redis from 'ioredis'
import env from '#start/env'

const port: string | undefined = env.get('REDIS_PORT')
const ioredis = new Redis.default({
  port: port ? Number.parseInt(port) : 6379,
  host: env.get('REDIS_HOST', 'moneyapp_redis'),
})

export default ioredis
