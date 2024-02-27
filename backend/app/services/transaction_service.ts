import Transaction from '#models/transaction'
import NotificationService from './notification_service.js'
import EmailService from './email_service.js'
import NotificationTypes from '../types/notification_types.js'
import EmailTypes from '../types/email_types.js'
import logger from '@adonisjs/core/services/logger'
import Account from '#models/account'
import { inject } from '@adonisjs/core'
import QueueService from './queue_service.js'
import QueueTypes from '../types/queue_types.js'

@inject()
export default class TransactionService {
  constructor(
    protected queueService: QueueService,
    protected emailService: EmailService,
    protected notificationService: NotificationService
  ) {}

  async queue(transactionData: {
    idempotency_key: string
    transaction_type: string
    conversion_rate: number
    sender_amount: number
    sender_currency_id: number
    sender_currency_symbol: string
    sender_account_id: number | null
    sender_account_number: number
    sender_name: string
    sender_email: string
    recipient_amount: number
    recipient_currency_id: number
    recipient_currency_symbol: string
    recipient_account_id: number | null
    recipient_account_number: number
    recipient_name: string
    recipient_email: string
    auth_user_id: number
    receiver_user_id: number | null
  }) {
    const transactionQueue = this.queueService.start(QueueTypes.transactions)
    await transactionQueue.add('create_transaction', transactionData)
  }

  async getAccounts(
    isDeposit: boolean,
    isWithDrawal: boolean,
    jobData: any
  ): Promise<{
    senderAccount: Account | null
    receiverAccount: Account | null
  }> {
    let senderAccount: Account | null = null
    let receiverAccount: Account | null = null
    if (!isWithDrawal) {
      receiverAccount = await Account.findOrFail(jobData.recipient_account_id)
      await receiverAccount.load('user')
    }
    if (!isDeposit) {
      senderAccount = await Account.findOrFail(jobData.sender_account_id)
      await senderAccount.load('user')
    }
    logger.info('=========================================================================')
    logger.info(
      `TRANSACTION: Accounts => ${JSON.stringify({ data: jobData, sender: senderAccount, receiver: receiverAccount })}`
    )
    return { senderAccount, receiverAccount }
  }

  balanceIsSufficient(
    isDeposit: boolean,
    sentAmount: number,
    senderAccount: Account | null
  ): boolean {
    if (isDeposit) return true
    if (!isDeposit && senderAccount) {
      return senderAccount.amount >= sentAmount
    } else return false
  }

  async createTransaction(jobData: any): Promise<Transaction> {
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

  async updateAccountBalances(
    isDeposit: boolean,
    isWithDrawal: boolean,
    receiverAccount: Account | null,
    senderAccount: Account | null,
    recipientAmount: number,
    senderAmount: number
  ) {
    if (!isWithDrawal && receiverAccount) {
      receiverAccount.amount = receiverAccount.amount + recipientAmount
      await receiverAccount.save()
    }
    if (!isDeposit && senderAccount) {
      senderAccount.amount = senderAccount.amount - senderAmount
      await senderAccount.save()
    }
  }

  async sendSuccessNotifications(
    newTransactionId: number,
    receiverUserId: number | null,
    senderUserId: number | null,
    jobName?: string | null | undefined,
    jobId?: string | null | undefined
  ) {
    logger.info('=========================================================================')
    logger.info(
      `TRANSACTION: PARAMS ${jobId || '#'}-${jobName || 'transaction'} => ${JSON.stringify({
        jobId: jobId,
        jobName: jobName,
        newTransactionId: newTransactionId,
        receiverUserId: receiverUserId,
        senderUserId: senderUserId,
        receiverUserIdS: receiverUserId ? 'Yes' : 'No',
        senderUserIdS: senderUserId ? 'Yes' : 'No',
      })}`
    )
    const savedTransaction: Transaction = await Transaction.findOrFail(newTransactionId)
    await this.emailService.queue({
      type: EmailTypes.TRANSACTION_EMAIL,
      emailData: {
        transaction: savedTransaction,
        isSender: true,
      },
    })
    await this.emailService.queue({
      type: EmailTypes.TRANSACTION_EMAIL,
      emailData: {
        transaction: savedTransaction,
        isSender: false,
      },
    })
    if (receiverUserId) {
      await this.notificationService.queue({
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
      await this.notificationService.queue({
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
    logger.info('=========================================================================')
    logger.info(
      `TRANSACTION: Email notification jobs created for job ${jobId || '#'}-${jobName || 'transaction'} => ${JSON.stringify(savedTransaction)}`
    )
  }

  async duplicateTransactionNotification(exists: Transaction, jobDataAuthUserId: number) {
    const message: string = `Your transaction to send ${exists.senderCurrencySymbol} ${exists.senderAmount}
    to ${exists.recipientName} (email: ${exists.recipientEmail}, Account No: ${exists.recipientAccountNumber})
    has been already completed, so this new request for the same transaction has been cancelled. 
    Please check your account balances are in order to prevent fraud nad protect yourself from harm.
    `
    await this.notificationService.queue({
      type: NotificationTypes.TRANSACTION_ALREADY_COMPLETED,
      user_id: jobDataAuthUserId,
      message: message,
      sendSocketNotification: true,
    })
    await this.emailService.queue({
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

  async jobFailed(jobData: any) {
    const message: string = `
      Your transaction for the amount of 
      ${jobData.sender_currency_symbol} ${Number.parseFloat(jobData.sender_amount).toFixed(2)} 
      to ${jobData.recipient_name} (${jobData.recipient_email}) has failed. Please try again.
    `
    await this.emailService.queue({
      type: EmailTypes.TRANSACTION_EMAIL,
      emailData: {
        transaction: null,
        isSender: true,
        isError: true,
        errorMessage: {
          message: message,
          email: jobData.sender_email,
          userName: jobData.sender_name,
        },
      },
    })
    await this.notificationService.queue({
      type: NotificationTypes.TRANSACTION_FAILED,
      user_id: jobData.auth_user_id,
      message: message,
      sendSocketNotification: true,
    })
  }
}
