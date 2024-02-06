import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Worker } from 'bullmq'
import mail from '@adonisjs/mail/services/main'
import { Queue } from 'bullmq'

export default class EmailQueue extends BaseCommand {
  static commandName = 'email:queue'
  static description = 'Command to start email queue worker'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
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
        },
      }
    })
    new Worker(
      'emails',
      async (job) => {
        if (job.name === 'verify_email') {
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
    this.logger.info('Started email queue worker...')
  }
}
