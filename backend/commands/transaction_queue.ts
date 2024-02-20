import { BaseCommand } from '@adonisjs/core/ace'
import { inject } from '@adonisjs/core'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Job, Worker } from 'bullmq'
import Transaction from '#models/transaction'
import Account from '#models/account'
import EmailService from '#services/email_service'
import NotificationService from '#services/notification_service'
import TransactionTypes from '../app/types/transaction_types.js'
import NotificationTypes from '../app/types/notification_types.js'
import EmailTypes from '../app/types/email_types.js'

export default class TransactionQueue extends BaseCommand {
  static commandName = 'transaction:queue'
  static description = 'Command to start the transaction queue for processing payments'

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  @inject()
  async run(emailService: EmailService, notificationService: NotificationService) {
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

          const exists: Transaction | null = await Transaction.query()
            .where((query) => {
              query
                .where('idempotency_key', job.data.idempotency_key)
                .where('transaction_type', job.data.transaction_type)
              if (!isWithDrawal) query.where('recipient_account_id', job.data.recipient_account_id)
              if (!isDeposit) query.where('sender_account_id', job.data.sender_account_id)
            })
            .first()
          if (!exists) {
            const { senderAccount, receiverAccount } = await this.getAccounts(
              isDeposit,
              isWithDrawal,
              job.data
            )

            // check if balance is still sufficient
            if (
              this.balanceIsSufficient(
                isDeposit,
                Number.parseFloat(job.data.sender_amount),
                senderAccount
              )
            ) {
              // create the transaction
              const transaction: Transaction = await this.createTransaction(job.data)
              if (transaction) {
                this.updateAccountBalances(
                  isDeposit,
                  isWithDrawal,
                  receiverAccount,
                  senderAccount,
                  Number.parseFloat(job.data.recipient_amount),
                  Number.parseFloat(job.data.sender_amount)
                )
                await this.sendNotifications(
                  job.id,
                  job.name,
                  transaction.id,
                  receiverAccount ? receiverAccount.userId : null,
                  senderAccount ? senderAccount.userId : null,
                  emailService,
                  notificationService
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
              const message: string = `Your transaction to send ${exists.senderCurrencySymbol} ${exists.senderAmount}
                to ${exists.recipientName} (email: ${exists.recipientEmail}, Account No: ${exists.recipientAccountNumber})
                has been already completed, so this new request for the same transaction has been cancelled. 
                Please check your account balances are in order to prevent fraud nad protect yourself from harm.
                `
              notificationService.queue({
                type: NotificationTypes.TRANSACTION_ALREADY_COMPLETED,
                user_id: job.data.auth_user_id,
                message: message,
                sendSocketNotification: true,
              })
              emailService.queue({
                type: EmailTypes.TRANSACTION_EMAIL,
                emailData: {
                  transaction: null,
                  isSender: true,
                  isError: true,
                  errorMessage: {
                    message: message,
                    email: exists.senderEmail,
                    userName: exists.senderName,
                  },
                },
              })
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

    transactionWorker.on('failed', async (job: Job) => {
      if (job.name === 'create_transaction') {
        const message: string = `
              Your transaction for the amount of 
              ${job.data.sender_currency_symbol} ${Number.parseFloat(job.data.sender_amount).toFixed(2)} 
              to ${job.data.recipient_name} (${job.data.recipient_email}) has failed. Please try again.
            `
        emailService.queue({
          type: EmailTypes.TRANSACTION_EMAIL,
          emailData: {
            transaction: null,
            isSender: true,
            isError: true,
            errorMessage: {
              message: message,
              email: job.data.sender_email,
              userName: job.data.sender_name,
            },
          },
        })
        notificationService.queue({
          type: NotificationTypes.TRANSACTION_FAILED,
          user_id: job.data.auth_user_id,
          message: message,
          sendSocketNotification: true,
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
    isWithDrawal: boolean,
    jobData: any
  ): Promise<{
    senderAccount: Account | null
    receiverAccount: Account | null
  }> {
    let senderAccount: Account | null = null
    let receiverAccount: Account | null = null
    console.log('CHECK DATA', isDeposit, !isDeposit, isWithDrawal, !isWithDrawal, jobData)
    if (!isDeposit) {
      senderAccount = await Account.findOrFail(jobData.sender_account_id)
      await senderAccount.load('user')
    }
    console.log('berore invoking', isWithDrawal)
    if (!isWithDrawal) {
      console.log('THIS IS INVOKED', jobData.recipient_account_id)
      receiverAccount = await Account.findOrFail(jobData.recipient_account_id)
      await receiverAccount.load('user')
    }
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

  private async createTransaction(jobData: any): Promise<Transaction> {
    const transaction: Transaction = await Transaction.create({
      idempotencyKey: jobData.idempotency_key,
      transactionType: jobData.transaction_type,
      conversionRate: jobData.conversion_rate,
      senderAmount: jobData.sender_amount,
      senderCurrencyId: jobData.sender_currency_id,
      senderCurrencySymbol: jobData.sender_currency_symbol,
      senderAccountId: jobData.sender_account_id,
      senderAccountNumber: jobData.sender_account_number,
      senderName: jobData.sender_name,
      senderEmail: jobData.sender_email,
      recipientAmount: jobData.recipient_amount,
      recipientCurrencyId: jobData.recipient_currency_id,
      recipientCurrencySymbol: jobData.recipient_currency_symbol,
      recipientAccountId: jobData.recipient_account_id,
      recipientAccountNumber: jobData.recipient_account_number,
      recipientName: jobData.recipient_name,
      recipientEmail: jobData.recipient_email,
    })
    return transaction
  }

  private updateAccountBalances(
    isDeposit: boolean,
    isWithDrawal: boolean,
    receiverAccount: Account | null,
    senderAccount: Account | null,
    recipientAmount: number,
    senderAmount: number
  ) {
    if (!isWithDrawal && receiverAccount) {
      receiverAccount.amount = receiverAccount.amount + recipientAmount
      receiverAccount.save()
    }
    if (!isDeposit && senderAccount) {
      senderAccount.amount = senderAccount.amount - senderAmount
      senderAccount.save()
    }
  }

  private async sendNotifications(
    jobId: string | undefined,
    jobName: string,
    newTransactionId: number,
    receiverUserId: number | null,
    senderUserId: number | null,
    emailService: EmailService,
    notificationService: NotificationService
  ) {
    this.logger.info('=========================================================================')
    this.logger.info(
      `TRANSACTION: PARAMS ${jobId || '#'}-${jobName} => ${JSON.stringify({
        jobId: jobId,
        jobName: jobName,
        newTransactionId: newTransactionId,
        receiverUserId: receiverUserId,
        senderUserId: senderUserId,
        receiverUserIdS: receiverUserId ? 'Yes' : 'No',
        senderUserIdS: senderUserId ? 'Yes' : 'No',
        emailService: emailService,
        notificationService: notificationService,
      })}`
    )
    const savedTransaction: Transaction = await Transaction.findOrFail(newTransactionId)
    emailService.queue({
      type: EmailTypes.TRANSACTION_EMAIL,
      emailData: {
        transaction: savedTransaction,
        isSender: true,
      },
    })
    emailService.queue({
      type: EmailTypes.TRANSACTION_EMAIL,
      emailData: {
        transaction: savedTransaction,
        isSender: false,
      },
    })
    if (receiverUserId) {
      notificationService.queue({
        type: NotificationTypes.NEW_TRANSACTION,
        user_id: receiverUserId,
        message: `
            You have succesfully received an amount of 
            ${savedTransaction.recipientCurrencySymbol} ${Number.parseFloat(`${savedTransaction.recipientAmount}`)} 
            from ${savedTransaction.senderName} - ( email: ${savedTransaction.senderEmail}, Account No: ${savedTransaction.senderAccountNumber}) 
            on ${savedTransaction.createdAt} into your Account No. ${savedTransaction.recipientAccountNumber}.
          `,
        sendSocketNotification: true,
      })
    }
    if (senderUserId) {
      notificationService.queue({
        type: NotificationTypes.NEW_TRANSACTION,
        user_id: senderUserId,
        message: `
          You have succesfully sent an amount of 
          ${savedTransaction.senderCurrencySymbol} ${Number.parseFloat(`${savedTransaction.senderAmount}`).toFixed(2)} 
          to ${savedTransaction.recipientName} ( email: ${savedTransaction.recipientEmail}, Account No: ${savedTransaction.recipientAccountNumber}) 
          on ${savedTransaction.createdAt} from your Account No. ${savedTransaction.senderAccountNumber}.
          `,
        sendSocketNotification: true,
      })
    }
    this.logger.info('=========================================================================')
    this.logger.info(
      `TRANSACTION: Email notification jobs created for job ${jobId || '#'}-${jobName} => ${JSON.stringify(savedTransaction)}`
    )
  }
}
