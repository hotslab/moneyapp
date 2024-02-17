import User from '#models/user'
import { BaseMail } from '@adonisjs/mail'

export default class VerifyEmailNotification extends BaseMail {
  user: User
  emailVerifyToken: string
  from = 'no-reply@hotslab.com'
  subject = 'MoneyApp - Verify Email'
  constructor({ user, emailVerifyToken }: { user: User; emailVerifyToken: string }) {
    super()
    this.user = user
    this.emailVerifyToken = emailVerifyToken
  }

  /**
   * The "prepare" method is called automatically when
   * the email is sent or queued.
   */
  prepare() {
    this.message.to(this.user.email).html(`
      <h1> Hello ${this.user.userName} </h1>
      <p> Please verify your email address ${this.user.email} by clicking the following link below: </p>
      <p> <a href="http://localhost:3000/verify-email/${this.emailVerifyToken}">Verify email</a></p>
    `)
  }
}
