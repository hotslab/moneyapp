import { BaseCommand } from '@adonisjs/core/ace'
import { inject } from '@adonisjs/core'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Job, Worker } from 'bullmq'
import Transaction from '#models/transaction'
import { DateTime } from 'luxon'
import Account from '#models/account'
import EmailService from '#services/email_service'
import TransactionTypes from '../app/types/transaction_types.js'

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
          const isDeposit: boolean = job.data.transaction_type === TransactionTypes.DEPOSIT

          const exists: Transaction | null = await Transaction.query()
            .where((query) => {
              query
                .where('idempotency_key', job.data.idempotency_key)
                .where('recipient_account_id', job.data.recipient_account_id)
                .where('transaction_type', job.data.transaction_type)
                .where('created_at', '>', DateTime.now().minus({ hours: 24 }).toSQLDate())
              if (!isDeposit) query.where('sender_account_id', job.data.sender_account_id)
            })
            .first()
          if (!exists) {
            const { senderAccount, receiverAccount } = await this.getAccounts(isDeposit, job.data)

            // check if balance is still sufficient
            if (
              this.balanceIsSufficient(
                isDeposit,
                Number.parseFloat(job.data.sender_amount),
                senderAccount
              )
            ) {
              const transaction: Transaction = await Transaction.create(job.data)
              if (transaction) {
                this.updateAccountBalances(
                  isDeposit,
                  receiverAccount,
                  senderAccount,
                  Number.parseFloat(job.data.recipient_amount),
                  Number.parseFloat(job.data.sender_amount)
                )
                this.sendEmailNotifications(job.id, job.name, transaction.id, emailService)
              } else {
                this.logger.info(
                  '========================================================================='
                )
                this.logger.error(
                  `TRANSACTION: Transaction job ${job.id}-${job.name} failed in wrttig to database with data => ${JSON.stringify(job.data)}`
                )
              }
            } else {
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
        `TRANSACTION: Job ${job.id}-${job.name} completed => ${JSON.stringify(job.data)}`
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
              Your transaction for the amount of 
              ${job.data.sender_currency_symbol} ${Number.parseFloat(job.data.sender_amount).toFixed(2)} 
              to ${job.data.recipient_name} (${job.data.recipient_email}) has failed. Please try again.
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

  private async getAccounts(
    isDeposit: boolean,
    jobData: any
  ): Promise<{
    senderAccount: Account | null
    receiverAccount: Account
  }> {
    let senderAccount: Account | null = null
    console.log('CHECK DATA', isDeposit, !isDeposit, jobData)
    if (!isDeposit) senderAccount = await Account.findOrFail(jobData.sender_account_id)
    console.log('THIS PASSED 1', senderAccount)
    const receiverAccount: Account = await Account.findOrFail(jobData.recipient_account_id)
    console.log('THIS PASSED 2', receiverAccount)
    this.logger.info('=========================================================================')
    this.logger.info(
      `TRANSACTION: Accounts => ${JSON.stringify({ data: jobData, sender: senderAccount, receiver: receiverAccount })}`
    )
    return { senderAccount, receiverAccount }
  }

  private balanceIsSufficient(
    isDeposit: boolean,
    sentAmount: number,
    senderAccount: Account | null
  ): boolean {
    if (isDeposit) return true
    if (!isDeposit && senderAccount) {
      return senderAccount.amount >= sentAmount
    } else return false
  }

  private updateAccountBalances(
    isDeposit: boolean,
    receiverAccount: Account,
    senderAccount: Account | null,
    recipientAmount: number,
    senderAmount: number
  ) {
    receiverAccount.amount = receiverAccount.amount + recipientAmount
    receiverAccount.save()
    if (!isDeposit && senderAccount) {
      senderAccount.amount = senderAccount.amount - senderAmount
      senderAccount.save()
    }
  }

  private async sendEmailNotifications(
    jobId: string | undefined,
    jobName: string,
    newTransactionId: number,
    emailService: EmailService
  ) {
    const savedTransaction: Transaction = await Transaction.findOrFail(newTransactionId)
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
    this.logger.info('=========================================================================')
    this.logger.info(
      `TRANSACTION: Email notification jobs created for job ${jobId || '#'}-${jobName} => ${JSON.stringify(savedTransaction)}`
    )
  }
}
