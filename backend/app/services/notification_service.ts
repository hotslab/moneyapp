import { Queue } from 'bullmq'
enum NotificationTypes {
  email_verified = 'email_verified',
  new_transaction = 'new_transaction',
}

export default class NotificationService {
  async queue(
    notification: string,
    notificationData: {
      user_id: number
      message: string
    }
  ) {
    const notificationQueue = new Queue('transactions', {
      connection: {
        host: 'moneyapp_redis',
        port: 6379,
      },
    })
    switch (notification) {
      case NotificationTypes.new_transaction:
      case NotificationTypes.email_verified:
        await notificationQueue.add(notification, notificationData)
        break
      default:
        break
    }
  }
}
