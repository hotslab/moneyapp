import NotificationTypes from '../types/notification_types.js'
import Notification from '#models/notification'
import logger from '@adonisjs/core/services/logger'
import { inject } from '@adonisjs/core'
import QueueService from './queue_service.js'
import QueueTypes from '../types/queue_types.js'
import NodeRedis from './redis_service.js'
import EmailTypes from '../types/email_types.js'

@inject()
export default class NotificationService {
  constructor(
    protected queueService: QueueService,
    protected nodeRedis: NodeRedis
  ) {}

  async queue({
    type,
    user_id,
    message,
    sendSocketNotification = false,
  }: {
    type: keyof typeof NotificationTypes | keyof typeof EmailTypes
    user_id: number
    message: string
    sendSocketNotification?: boolean
  }) {
    const notificationQueue = this.queueService.start(QueueTypes.notifications)
    await notificationQueue.add(type, {
      type,
      user_id,
      message,
      sendSocketNotification,
    })
  }

  async createNotification(
    eventName: keyof typeof NotificationTypes | keyof typeof EmailTypes,
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
      NotificationTypes.TRANSACTION_FAILED === eventName ||
      EmailTypes.VERIFY_EMAIL === eventName ||
      EmailTypes.PASSWORD_RESET_EMAIL === eventName
    ) {
      const notification: Notification = await Notification.create({
        userId: notificationData.user_id,
        message: notificationData.message,
        type: eventName,
      })
      if (notification && notificationData.sendSocketNotification) {
        const redis = await this.nodeRedis.io()
        await redis.publish('notification', JSON.stringify(notificationData))
        logger.info(
          `Notification: Socket notification sent for job ${eventName} => ${JSON.stringify(notificationData)}`
        )
      }
    }
  }
}
