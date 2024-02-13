import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Job, Worker } from 'bullmq'
import Notification from '#models/notification'

export default class NotificationQueue extends BaseCommand {
  static commandName = 'notification:queue'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  async run() {
    const notificationWorker: Worker = new Worker(
      'notifications',
      async (job: Job) => {
        this.logger.info(
          `NOTIFICATION: New ${job.id}-${job.name} started => ${JSON.stringify(job.data)}`
        )
        if (job.name === 'new_transaction') {
          const notification: Notification = await Notification.create(job.data)
        }
        this.logger.info(
          `Notification: Socket notification sent for job ${job.id}-${job.name} => ${JSON.stringify(job.data)}`
        )
      },
      {
        connection: {
          host: 'moneyapp_redis',
          port: 6379,
        },
      }
    )

    notificationWorker.on('completed', async (job: Job) => {
      this.logger.info(
        `NOTIFICATION: Job ${job.id}-${job.name} completed successfully => ${JSON.stringify(job.data)}`
      )
    })

    notificationWorker.on('failed', async (job: Job) => {
      this.logger.error(
        `NOTIFICATION: Job ${job.id}-${job.name} failed with data => ${JSON.stringify(job.data)}`
      )
    })

    notificationWorker.on('error', (error) => {
      this.logger.error(`NOTIFICATION: Transaction worker failed message => ${error.message}`)
    })

    this.logger.info('Started notification queue...')
  }
}
