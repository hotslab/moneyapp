import { Queue } from 'bullmq'
import NotificationTypes from '../types/notification_types.js'
import Notification from '#models/notification'
import redis from './redis_service.js'
import logger from '@adonisjs/core/services/logger'

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

  async createNotification(
    eventName: keyof typeof NotificationTypes,
    notificationData: {
      user_id: number
      message: string
      sendSocketNotification?: boolean
    }
  ) {
    if (
      NotificationTypes.EMAIL_VERIFIED === eventName ||
      NotificationTypes.NEW_TRANSACTION === eventName ||
      NotificationTypes.INSUFFICENT_BALANCE === eventName ||
      NotificationTypes.TRANSACTION_ALREADY_COMPLETED === eventName ||
      NotificationTypes.TRANSACTION_FAILED === eventName
    ) {
      const notification: Notification = await Notification.create({
        userId: notificationData.user_id,
        message: notificationData.message,
        type: eventName,
      })
      if (notification && notificationData.sendSocketNotification) {
        await redis.publish('notification', JSON.stringify(notificationData))
        logger.info(
          `Notification: Socket notification sent for job ${eventName} => ${JSON.stringify(notificationData)}`
        )
      }
    }
  }
}
