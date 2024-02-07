import { BaseCommand } from '@adonisjs/core/ace'
import { inject } from '@adonisjs/core'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Job, Worker } from 'bullmq'
import Transaction from '#models/transaction'
import mail from '@adonisjs/mail/services/main'
import TransactionEmailNotification from '#mails/transaction_mail_notification'
import { DateTime } from 'luxon'

export default class TransactionQueue extends BaseCommand {
  static commandName = 'transaction:queue'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  @inject()
  async run() {
    const transactionWorker: Worker = new Worker(
      'transactions',
      async (job: Job) => {
        this.logger.info(
          `TRANSACTION: New ${job.id}-${job.name} started => ${JSON.stringify(job.data)}`
        )
        if (job.name === 'create_transaction') {
          const exists: Transaction | null = await Transaction.query()
            .where('idempotency_key', job.data.idempotency_key)
            .where('sender_account_id', job.data.sender_account_id)
            .where('recipient_account_id', job.data.recipient_account_id)
            .where('created_at', '>', DateTime.now().minus({ hours: 24 }).toSQLDate())
            .first()
          if (!exists) {
            const transaction: Transaction = await Transaction.create(job.data)
            await mail.sendLater(new TransactionEmailNotification(transaction, true))
            await mail.sendLater(new TransactionEmailNotification(transaction, false))
            this.logger.info(
              `TRANSACTION: Email notification jobs created for job ${job.id}-${job.name} => ${JSON.stringify(transaction)}`
            )
          }
        }
      },
      {
        connection: {
          host: 'moneyapp_redis',
          port: 6379,
        },
      }
    )

    transactionWorker.on('completed', async (job: Job) => {
      this.logger.info(
        `TRANSACTION: Job ${job.id}-${job.name} completed successfully => ${JSON.stringify(job.data)}`
      )
    })

    transactionWorker.on('failed', async (job: Job) => {
      this.logger.error(
        `TRANSACTION: Job ${job.id}-${job.name} failed with data => ${JSON.stringify(job.data)}`
      )
    })

    transactionWorker.on('error', (error) => {
      this.logger.error(`TRANSACTION: Transaction worker failed message => ${error.message}`)
    })

    this.logger.info('Started transaction queue...')
  }
}
