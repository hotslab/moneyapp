import { BaseCommand } from '@adonisjs/core/ace'
import { inject } from '@adonisjs/core'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Job, Worker } from 'bullmq'
import Transaction from '#models/transaction'
import mail from '@adonisjs/mail/services/main'
import TransactionEmailNotification from '#mails/transaction_mail_notification'
import { DateTime } from 'luxon'
import Account from '#models/account'

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
            .where('transaction_type', job.data.transaction_type)
            .where('created_at', '>', DateTime.now().minus({ hours: 24 }).toSQLDate())
            .first()
          if (!exists) {
            const senderAccount: Account = await Account.findOrFail(job.data.sender_account_id)
            const receiverAccount: Account = await Account.findOrFail(job.data.recipient_account_id)
            this.logger.info(
              `TRANSACTION: Accounts => ${JSON.stringify({ sender: senderAccount, receiver: receiverAccount })}`
            )
            const senderSerializedAccount = senderAccount.serialize()
            const receiverSerializedAccount = receiverAccount.serialize()
            this.logger.error(
              `TRANSACTION: Serialized Accounts => ${JSON.stringify({ sender: senderSerializedAccount, receiver: receiverSerializedAccount })}`
            )
            const transaction: Transaction = await Transaction.create(job.data)
            senderAccount.amount =
              Number.parseFloat(job.data.sender_amount) -
              Number.parseFloat(senderSerializedAccount.amount)
            receiverAccount.amount =
              Number.parseFloat(job.data.recipient_amount) +
              Number.parseFloat(receiverSerializedAccount.amount)
            senderAccount.save()
            receiverAccount.save()
            await mail.sendLater(new TransactionEmailNotification(transaction, true))
            await mail.sendLater(new TransactionEmailNotification(transaction, false))
            this.logger.info(
              `TRANSACTION: Email notification jobs created for job ${job.id}-${job.name} => ${JSON.stringify(transaction)}`
            )
          } else
            this.logger.info(
              `TRANSACTION: This job ${job.id}-${job.name} was already completed. Transaction ID ${exists.id} - ${exists.idempotencyKey} not done with data => ${JSON.stringify(job.data)}`
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

    transactionWorker.on('completed', async (job: Job) => {
      this.logger.info(
        `TRANSACTION: Job ${job.id}-${job.name} completed successfully => ${JSON.stringify(job.data)}`
      )
    })

    transactionWorker.on('failed', async (job: Job) => {
      if (job.name === 'create_transaction') {
        await mail.sendLater(
          new TransactionEmailNotification(null, true, true, {
            message: `
              Your transaction for the amount of ${job.data.sender_currency_symbol} ${job.data.sender_amount} to 
              ${job.data.recipient_name} (${job.data.recipient_email}) has failed. Please try again.
            `,
            email: job.data.sender_email,
            userName: job.data.sender_name,
          })
        )
      }
      this.logger.error(
        `TRANSACTION: Job ${job.id}-${job.name} failed => Reason ${job.failedReason} => ${JSON.stringify(job.data)}`
      )
    })

    transactionWorker.on('error', (error) => {
      this.logger.error(`TRANSACTION: Transaction worker failed message => ${error.message}`)
    })

    this.logger.info('Started transaction queue...')
  }
}
