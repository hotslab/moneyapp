import Transaction from '#models/transaction'
import { BaseMail } from '@adonisjs/mail'

export default class TransactionEmailNotification extends BaseMail {
  isSender: boolean
  transaction: Transaction
  from = 'no-reply@hotslab.com'
  subject = `MoneyApp transaction succcess notice`
  constructor(transaction: Transaction, isSender: boolean) {
    super()
    this.transaction = transaction
    this.isSender = isSender
  }

  /**
   * The "prepare" method is called automatically when
   * the email is sent or queued.
   */
  prepare() {
    this.message
      .to(this.isSender ? this.transaction.senderEmail : this.transaction.recipientEmail)
      .html(
        this.isSender
          ? `
            <h1> Hello ${this.transaction.senderName} </h1>
            <p> 
                You have succesfully sent an amount of ${this.transaction.amount} to 
                ${this.transaction.recipientName} ( ${this.transaction.recipientEmail} ) 
                on ${this.transaction.createdAt} from your Account No. ${this.transaction.senderAccountNumber}.
            </p>
            `
          : `
            <h1> Hello ${this.transaction.recipientName} </h1>
            <p> 
                You have succesfully received an amount of ${this.transaction.amount} from
                ${this.transaction.senderName} ( ${this.transaction.senderEmail} ) 
                on ${this.transaction.createdAt} into your Account No. ${this.transaction.recipientAccountNumber}.
            </p>
            `
      )
  }
}
