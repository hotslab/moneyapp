import { Queue } from 'bullmq'
import QueueTypes from '../types/queue_types.js'

export default class QueueService {
  start(queueName: keyof typeof QueueTypes) {
    const queue = new Queue(queueName, {
      connection: {
        host: 'moneyapp_redis',
        port: 6379,
      },
    })
    return queue
  }
}
