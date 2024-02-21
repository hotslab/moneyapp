import Transaction from '#models/transaction'
import { Queue } from 'bullmq'
import NotificationService from './notification_service.js'
import EmailService from './email_service.js'
import NotificationTypes from '../types/notification_types.js'
import EmailTypes from '../types/email_types.js'
import logger from '@adonisjs/core/services/logger'
import Account from '#models/account'
import { inject } from '@adonisjs/core'

export default class TransactionService {
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
    const transactionQueue = new Queue('transactions', {
      connection: { host: 'moneyapp_redis', port: 6379 },
    })
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
    console.log('CHECK DATA', isDeposit, !isDeposit, isWithDrawal, !isWithDrawal, jobData)
    if (!isWithDrawal) {
      console.log('THIS DEPOSIT IS INVOKED', jobData.recipient_account_id)
      receiverAccount = await Account.findOrFail(jobData.recipient_account_id)
      await receiverAccount.load('user')
    }
    console.log('berore invoking', isWithDrawal)
    if (!isDeposit) {
      console.log('THIS WITHDRAWAL IS INVOKED', jobData.sender_account_id)
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

  @inject()
  async sendSuccessNotifications(
    jobId: string | undefined,
    jobName: string,
    newTransactionId: number,
    receiverUserId: number | null,
    senderUserId: number | null,
    emailService: EmailService,
    notificationService: NotificationService
  ) {
    logger.info('=========================================================================')
    logger.info(
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
    logger.info('=========================================================================')
    logger.info(
      `TRANSACTION: Email notification jobs created for job ${jobId || '#'}-${jobName} => ${JSON.stringify(savedTransaction)}`
    )
  }

  @inject()
  async duplicateTransactionNotification(
    exists: Transaction,
    jobDataAuthUserId: number,
    notificationService: NotificationService,
    emailService: EmailService
  ) {
    const message: string = `Your transaction to send ${exists.senderCurrencySymbol} ${exists.senderAmount}
    to ${exists.recipientName} (email: ${exists.recipientEmail}, Account No: ${exists.recipientAccountNumber})
    has been already completed, so this new request for the same transaction has been cancelled. 
    Please check your account balances are in order to prevent fraud nad protect yourself from harm.
    `
    await notificationService.queue({
      type: NotificationTypes.TRANSACTION_ALREADY_COMPLETED,
      user_id: jobDataAuthUserId,
      message: message,
      sendSocketNotification: true,
    })
    await emailService.queue({
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

  @inject()
  async jobFailed(job: any, emailService: EmailService, notificationService: NotificationService) {
    const message: string = `
      Your transaction for the amount of 
      ${job.data.sender_currency_symbol} ${Number.parseFloat(job.data.sender_amount).toFixed(2)} 
      to ${job.data.recipient_name} (${job.data.recipient_email}) has failed. Please try again.
    `
    await emailService.queue({
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
    await notificationService.queue({
      type: NotificationTypes.TRANSACTION_FAILED,
      user_id: job.data.auth_user_id,
      message: message,
      sendSocketNotification: true,
    })
  }
}
