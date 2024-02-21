import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Job, Worker } from 'bullmq'
import { inject } from '@adonisjs/core'
import EmailTypes from '../app/types/email_types.js'
import NotificationService from '#services/notification_service'
import EmailService from '#services/email_service'

export default class EmailQueue extends BaseCommand {
  static commandName = 'email:queue'
  static description = 'Command to start the email queue for processing email messages to clients'

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  @inject()
  async run(emailService: EmailService, notificationService: NotificationService) {
    const emailWorker: Worker = new Worker(
      'emails',
      async (job) => {
        this.logger.info(
          '========================================================================='
        )
        this.logger.info(
          `EMAIL: New job ${job.id}-${job.name} started => ${JSON.stringify(job.data)}`
        )

        await emailService.sendMail(job.data)

        await emailService.createNotifications(
          job.name as keyof typeof EmailTypes,
          job.data.user_id,
          job.data.mailMessage,
          notificationService
        )
      },
      {
        connection: {
          host: 'moneyapp_redis',
          port: 6379,
        },
      }
    )

    emailWorker.on('completed', async (job: Job) => {
      this.logger.info('=========================================================================')
      this.logger.info(
        `Email: Job ${job.id}-${job.name} completed with data => ${JSON.stringify(job.data)}`
      )
    })

    emailWorker.on('failed', async (job: Job) => {
      this.logger.info('=========================================================================')
      this.logger.error(
        `EMAIL: Job ${job.id}-${job.name} failed with data => ${JSON.stringify(job.data)}`
      )
    })

    emailWorker.on('error', (error) => {
      this.logger.info('=========================================================================')
      this.logger.error(`EMAIL: Email worker failed message => ${error.message}`)
    })

    this.logger.info('=========================================================================')
    this.logger.info('Started email queue worker...')
    this.logger.info('=========================================================================')
  }
}
