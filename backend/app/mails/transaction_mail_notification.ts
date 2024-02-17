import Transaction from '#models/transaction'
import { BaseMail } from '@adonisjs/mail'

export default class TransactionEmailNotification extends BaseMail {
  isSender: boolean
  transaction: Transaction | null
  isError: boolean
  errorMessage: { message: string; email: string; userName: string } | null
  from = 'no-reply@hotslab.com'
  subject = `MoneyApp - Transaction Notice`
  constructor({
    transaction,
    isSender,
    isError = false,
    errorMessage = null,
  }: {
    transaction: Transaction | null
    isSender: boolean
    isError?: boolean
    errorMessage?: { message: string; email: string; userName: string } | null
  }) {
    super()
    this.transaction = transaction
    this.isSender = isSender
    this.isError = isError
    this.errorMessage = errorMessage
  }

  /**
   * The "prepare" method is called automatically when
   * the email is sent or queued.
   */
  prepare() {
    if (this.isError && this.errorMessage)
      this.message.to(this.errorMessage.email).html(
        `<h1> Hello ${this.errorMessage.userName} </h1>
        <p>${this.errorMessage.message}</p>`
      )
    if (!this.isError && this.transaction)
      this.message
        .to(this.isSender ? this.transaction.senderEmail : this.transaction.recipientEmail)
        .html(
          this.isSender
            ? `
            <h1> Hello ${this.transaction.senderName} </h1>
            <p> 
                You have succesfully sent an amount of ${this.transaction.senderCurrencySymbol} ${Number.parseFloat(`${this.transaction.senderAmount}`).toFixed(2)} to 
                ${this.transaction.recipientName} ( email: ${this.transaction.recipientEmail}, Account No: ${this.transaction.recipientAccountNumber}) 
                on ${this.transaction.createdAt} from your Account No. ${this.transaction.senderAccountNumber}.
            </p>
            `
            : `
            <h1> Hello ${this.transaction.recipientName} </h1>
            <p> 
                You have succesfully received an amount of ${this.transaction.recipientCurrencySymbol} ${Number.parseFloat(`${this.transaction.recipientAmount}`)} from
                ${this.transaction.senderName} - ( email: ${this.transaction.senderEmail}, Account No: ${this.transaction.senderAccountNumber}) 
                on ${this.transaction.createdAt} into your Account No. ${this.transaction.recipientAccountNumber}.
            </p>
            `
        )
  }
}
