import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Job, Worker } from 'bullmq'
import NotificationTypes from '../app/types/notification_types.js'
import { inject } from '@adonisjs/core'
import NotificationService from '#services/notification_service'

export default class NotificationQueue extends BaseCommand {
  static commandName = 'notification:queue'
  static description =
    'Command to start the notification queue for sending notifications from the server'

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  @inject()
  async run(notificationService: NotificationService) {
    const notificationWorker: Worker = new Worker(
      'notifications',
      async (job: Job) => {
        this.logger.info(
          '========================================================================='
        )
        this.logger.info(
          `NOTIFICATION: New ${job.id}-${job.name} started => ${JSON.stringify(job.data)}`
        )
        this.logger.info(
          `Notification: Savid Notification for job ${job.id}-${job.name} => ${JSON.stringify(job.data)}`
        )
        notificationService.createNotification(job.name as keyof typeof NotificationTypes, job.data)
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
