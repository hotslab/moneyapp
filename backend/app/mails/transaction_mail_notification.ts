import Transaction from '#models/transaction'
import { BaseMail } from '@adonisjs/mail'

export default class TransactionEmailNotification extends BaseMail {
  isSender: boolean
  transaction: Transaction | null
  error: boolean
  errorMessage: { message: string; email: string; userName: string } | null
  from = 'no-reply@hotslab.com'
  subject = `MoneyApp transaction succcess notice`
  constructor(
    transaction: Transaction | null,
    isSender: boolean,
    error: boolean = false,
    errorMessage: { message: string; email: string; userName: string } | null = null
  ) {
    super()
    this.transaction = transaction
    this.isSender = isSender
    this.error = error
    this.errorMessage = errorMessage
  }

  /**
   * The "prepare" method is called automatically when
   * the email is sent or queued.
   */
  prepare() {
    if (this.error && this.errorMessage)
      this.message.to(this.errorMessage.email).html(
        `<h1> Hello ${this.errorMessage.userName} </h1>
        <p>${this.errorMessage.message}</p>`
      )
    if (!this.error && this.transaction)
      this.message
        .to(this.isSender ? this.transaction.senderEmail : this.transaction.recipientEmail)
        .html(
          this.isSender
            ? `
            <h1> Hello ${this.transaction.senderName} </h1>
            <p> 
                You have succesfully sent an amount of ${this.transaction.senderAmount} to 
                ${this.transaction.recipientName} ( ${this.transaction.recipientEmail} ) 
                on ${this.transaction.createdAt} from your Account No. ${this.transaction.senderAccountNumber}.
            </p>
            `
            : `
            <h1> Hello ${this.transaction.recipientName} </h1>
            <p> 
                You have succesfully received an amount of ${this.transaction.recipientAmount} from
                ${this.transaction.senderName} ( ${this.transaction.senderEmail} ) 
                on ${this.transaction.createdAt} into your Account No. ${this.transaction.recipientAccountNumber}.
            </p>
            `
        )
  }
}
