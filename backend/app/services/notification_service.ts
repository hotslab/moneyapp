import { Queue } from 'bullmq'
import NotificationTypes from '../types/notification_types.js'

export default class NotificationService {
  async queue({
    type,
    user_id,
    message,
    sendSocketNotification = false,
  }: {
    type: keyof typeof NotificationTypes
    user_id: number
    message: string
    sendSocketNotification?: boolean
  }) {
    const notificationQueue = new Queue('notifications', {
      connection: {
        host: 'moneyapp_redis',
        port: 6379,
      },
    })
    await notificationQueue.add(type, {
      type,
      user_id,
      message,
      sendSocketNotification,
    })
  }
}
