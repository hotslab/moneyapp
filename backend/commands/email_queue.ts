import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Job, Worker } from 'bullmq'
import { Queue } from 'bullmq'
import mail from '@adonisjs/mail/services/main'
import { inject } from '@adonisjs/core'

export default class EmailQueue extends BaseCommand {
  static commandName = 'email:queue'
  static description = 'Command to start the email queue for processing email messages to clients'

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  @inject()
  async run() {
    // Set default connection for email queue
    const emailsQueue = new Queue('emails', {
      connection: {
        host: 'moneyapp_redis',
        port: 6379,
      },
    })
    mail.setMessenger((mailer) => {
      return {
        async queue(mailMessage, config) {
          await emailsQueue.add('verify_email', {
            mailMessage,
            config,
            mailerName: mailer.name,
          })
          await emailsQueue.add('transaction_email', {
            mailMessage,
            config,
            mailerName: mailer.name,
          })
        },
      }
    })

    // Run the email queue worker
    const emailWorker: Worker = new Worker(
      'emails',
      async (job) => {
        this.logger.info(
          `EMAIL: New job ${job.id}-${job.name} started => ${JSON.stringify(job.data)}`
        )
        if (job.name === 'verify_email') {
          const { mailMessage, config, mailerName } = job.data
          console.log(mailMessage, config, mailerName)

          await mail.use(mailerName).sendCompiled(mailMessage, config)
        }
        if (job.name === 'transaction_email') {
          const { mailMessage, config, mailerName } = job.data
          console.log(mailMessage, config, mailerName)

          await mail.use(mailerName).sendCompiled(mailMessage, config)
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
      this.logger.info(
        `Email: Job ${job.id}-${job.name} completed with data => ${JSON.stringify(job.data)}`
      )
    })

    emailWorker.on('failed', async (job: Job) => {
      this.logger.error(
        `EMAIL: Job ${job.id}-${job.name} failed with data => ${JSON.stringify(job.data)}`
      )
    })

    emailWorker.on('error', (error) => {
      this.logger.error(`EMAIL: Email worker failed message => ${error.message}`)
    })

    this.logger.info('Started email queue worker...')
  }
}
