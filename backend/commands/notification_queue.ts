import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Job, Worker } from 'bullmq'
import Notification from '#models/notification'
import redis from '#services/redis_service'
import NotificationTypes from '../app/types/notification_types.js'

export default class NotificationQueue extends BaseCommand {
  static commandName = 'notification:queue'
  static description =
    'Command to start the notification queue for sending notifications from the server'

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  async run() {
    const notificationWorker: Worker = new Worker(
      'notifications',
      async (job: Job) => {
        this.logger.info(
          '========================================================================='
        )
        this.logger.info(
          `NOTIFICATION: New ${job.id}-${job.name} started => ${JSON.stringify(job.data)}`
        )

        if (
          NotificationTypes.EMAIL_VERIFIED === job.name ||
          NotificationTypes.NEW_TRANSACTION === job.name ||
          NotificationTypes.INSUFFICENT_BALANCE === job.name ||
          NotificationTypes.TRANSACTION_ALREADY_COMPLETED === job.name ||
          NotificationTypes.TRANSACTION_FAILED === job.name
        ) {
          this.logger.info(
            `Notification: Saving Notification for job ${job.id}-${job.name} => ${JSON.stringify(job.data)}`
          )
          const notification: Notification = await Notification.create({
            userId: job.data.user_id,
            message: job.data.message,
            type: job.name,
            read: false,
          })
          if (notification && job.data.sendSocketNotification)
            await redis.publish('notification', JSON.stringify(job.data))
          this.logger.info(
            `Notification: Socket notification sent for job ${job.id}-${job.name} => ${JSON.stringify(job.data)}`
          )
        }
      },
      {
        connection: {
          host: 'moneyapp_redis',
          port: 6379,
        },
      }
    )

    notificationWorker.on('completed', async (job: Job) => {
      this.logger.info('=========================================================================')
      this.logger.info(
        `NOTIFICATION: Job ${job.id}-${job.name} completed successfully => ${JSON.stringify(job.data)}`
      )
    })

    notificationWorker.on('failed', async (job: Job) => {
      this.logger.info('=========================================================================')
      this.logger.error(
        `NOTIFICATION: Job ${job.id}-${job.name} failed due to ${job.failedReason} with data => ${JSON.stringify(job.data)}`
      )
    })

    notificationWorker.on('error', (error) => {
      this.logger.info('=========================================================================')
      this.logger.error(`NOTIFICATION: Transaction worker failed message => ${error.message}`)
    })

    this.logger.info('=========================================================================')
    this.logger.info('Started notification queue...')
    this.logger.info('=========================================================================')
  }
}
