import { BaseCommand } from '@adonisjs/core/ace'
import { inject } from '@adonisjs/core'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Job, Worker } from 'bullmq'
import Transaction from '#models/transaction'
import { DateTime } from 'luxon'
import Account from '#models/account'
import EmailService from '#services/email_service'

export default class TransactionQueue extends BaseCommand {
  static commandName = 'transaction:queue'
  static description = 'Command to start the transaction queue for processing payments'

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  @inject()
  async run(emailService: EmailService) {
    const transactionWorker: Worker = new Worker(
      'transactions',
      async (job: Job) => {
        this.logger.info(
          '========================================================================='
        )
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
              '========================================================================='
            )
            this.logger.info(
              `TRANSACTION: Accounts => ${JSON.stringify({ data: job.data, sender: senderAccount, receiver: receiverAccount })}`
            )
            const transaction: Transaction = await Transaction.create(job.data)
            if (transaction) {
              senderAccount.amount =
                senderAccount.amount - Number.parseFloat(job.data.sender_amount)
              receiverAccount.amount =
                receiverAccount.amount + Number.parseFloat(job.data.recipient_amount)
              senderAccount.save()
              receiverAccount.save()
              const savedTransaction: Transaction = await Transaction.findOrFail(transaction.id)
              emailService.queue({
                type: 'TRANSACTION_EMAIL',
                emailData: {
                  transaction: savedTransaction,
                  isSender: true,
                },
              })
              emailService.queue({
                type: 'TRANSACTION_EMAIL',
                emailData: {
                  transaction: savedTransaction,
                  isSender: false,
                },
              })
              this.logger.info(
                '========================================================================='
              )
              this.logger.info(
                `TRANSACTION: Email notification jobs created for job ${job.id}-${job.name} => ${JSON.stringify(savedTransaction)}`
              )
            } else {
              this.logger.info(
                '========================================================================='
              )
              this.logger.error(
                `TRANSACTION: Transaction job ${job.id}-${job.name} failed in wrttig to database with data => ${JSON.stringify(job.data)}`
              )
            }
          } else {
            this.logger.info(
              '========================================================================='
            )
            this.logger.info(
              `TRANSACTION: This job ${job.id}-${job.name} was already completed. Transaction ID ${exists.id} - ${exists.idempotencyKey} not done with data => ${JSON.stringify(job.data)}`
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
      this.logger.info('=========================================================================')
      this.logger.info(
        `TRANSACTION: Job ${job.id}-${job.name} completed successfully => ${JSON.stringify(job.data)}`
      )
    })

    transactionWorker.on('failed', async (job: Job) => {
      if (job.name === 'create_transaction') {
        emailService.queue({
          type: 'TRANSACTION_EMAIL',
          emailData: {
            transaction: null,
            isSender: true,
            isError: true,
            errorMessage: {
              message: `
              Your transaction for the amount of ${job.data.sender_currency_symbol} ${job.data.sender_amount} to 
              ${job.data.recipient_name} (${job.data.recipient_email}) has failed. Please try again.
            `,
              email: job.data.sender_email,
              userName: job.data.sender_name,
            },
          },
        })
      }
      this.logger.info('=========================================================================')
      this.logger.error(
        `TRANSACTION: Job ${job.id}-${job.name} failed => Reason ${job.failedReason} => ${JSON.stringify(job.data)}`
      )
    })

    transactionWorker.on('error', (error) => {
      this.logger.info('=========================================================================')
      this.logger.error(`TRANSACTION: Transaction worker failed message => ${error.message}`)
    })

    this.logger.info('=========================================================================')
    this.logger.info('Started transaction queue...')
    this.logger.info('=========================================================================')
  }
}
