import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Job, Worker } from 'bullmq'
import mail from '@adonisjs/mail/services/main'
import { inject } from '@adonisjs/core'
import EmailTypes from '../app/types/email_types.js'
import NotificationService from '#services/notification_service'
import NotificationTypes from '../app/types/notification_types.js'

export default class EmailQueue extends BaseCommand {
  static commandName = 'email:queue'
  static description = 'Command to start the email queue for processing email messages to clients'

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  @inject()
  async run(notificationService: NotificationService) {
    const emailWorker: Worker = new Worker(
      'emails',
      async (job) => {
        this.logger.info(
          '========================================================================='
        )
        this.logger.info(
          `EMAIL: New job ${job.id}-${job.name} started => ${JSON.stringify(job.data)}`
        )

        // sending email
        const { mailMessage, config, mailerName } = job.data
        await mail.use(mailerName).sendCompiled(mailMessage, config)

        // creating notification records
        if (EmailTypes.VERIFY_EMAIL === job.name || EmailTypes.PASSWORD_RESET_EMAIL === job.name) {
          let message = ''
          if (EmailTypes.VERIFY_EMAIL === job.name)
            message = `A new email verification link was send to your email address at ${mailMessage.message.to}`
          if (EmailTypes.PASSWORD_RESET_EMAIL === job.name)
            message = `A new password reset link was sent to your email address at ${mailMessage.message.to}`
          notificationService.queue({
            type: NotificationTypes.INSUFFICENT_BALANCE,
            user_id: job.data.usr_id,
            message: message,
          })
        }
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
