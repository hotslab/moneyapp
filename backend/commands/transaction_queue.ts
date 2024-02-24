import { BaseCommand } from '@adonisjs/core/ace'
import { inject } from '@adonisjs/core'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Job, Worker } from 'bullmq'
import Transaction from '#models/transaction'
import NotificationService from '#services/notification_service'
import TransactionTypes from '../app/types/transaction_types.js'
import NotificationTypes from '../app/types/notification_types.js'
import TransactionService from '#services/transaction_service'

export default class TransactionQueue extends BaseCommand {
  static commandName = 'transaction:queue'
  static description = 'Command to start the transaction queue for processing payments'

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  @inject()
  async run(transactionService: TransactionService, notificationService: NotificationService) {
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
          const isWithDrawal: boolean = job.data.transaction_type === TransactionTypes.WITHDRAW

          const exists: Transaction | null = await Transaction.findBy(
            'idempotency_key',
            job.data.idempotency_key
          )
          if (!exists) {
            const { senderAccount, receiverAccount } = await transactionService.getAccounts(
              isDeposit,
              isWithDrawal,
              job.data
            )

            // check if balance is still sufficient
            if (
              transactionService.balanceIsSufficient(
                isDeposit,
                Number.parseFloat(job.data.sender_amount),
                senderAccount
              )
            ) {
              // create the transaction
              const transaction: Transaction = await transactionService.createTransaction(job.data)
              if (transaction) {
                await transactionService.updateAccountBalances(
                  isDeposit,
                  isWithDrawal,
                  receiverAccount,
                  senderAccount,
                  Number.parseFloat(job.data.recipient_amount),
                  Number.parseFloat(job.data.sender_amount)
                )
                await transactionService.sendSuccessNotifications(
                  transaction.id,
                  receiverAccount ? receiverAccount.userId : null,
                  senderAccount ? senderAccount.userId : null,
                  job.name,
                  job.id
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
              this.logger.error(
                `TRANSACTION: Transaction job ${job.id}-${job.name} failed in wrttig as the sender account had an insufficient balance => ${JSON.stringify({ sender: senderAccount, jodata: job.data })}`
              )
              if (senderAccount) {
                notificationService.queue({
                  type: NotificationTypes.INSUFFICENT_BALANCE,
                  user_id: senderAccount.userId,
                  message: `Your Account No ${senderAccount.id} has an inssuficent balance 
                    of ${job.data.sender_currency_symbol} ${Number.parseFloat(`${senderAccount.amount}`).toFixed(2)} 
                    to ${job.data.sender_currency_symbol} ${job.data.sender_amount}`,
                  sendSocketNotification: true,
                })
              }
            }
          } else {
            this.logger.info(
              '========================================================================='
            )
            this.logger.info(
              `TRANSACTION: This job ${job.id}-${job.name} was already completed. Transaction ID ${exists.id} - ${exists.idempotencyKey} not done with data => ${JSON.stringify(job.data)}`
            )
            if (exists.senderEmail) {
              transactionService.duplicateTransactionNotification(exists, job.data.auth_user_id)
            }
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

    transactionWorker.on('failed', async (job: Job<any, any, string> | undefined) => {
      this.logger.info('=========================================================================')
      if (job) {
        if (job.name === 'create_transaction') {
          await transactionService.jobFailed(job.data)
        }
        this.logger.error(
          `TRANSACTION: Job ${job.id}-${job.name} failed => Reason ${job.failedReason} => ${JSON.stringify(job.data)}`
        )
      } else
        this.logger.error(
          `TRANSACTION: Unknown transaction job failure reported by transaction queue`
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
