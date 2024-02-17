import { BaseMail } from '@adonisjs/mail'
import User from '#models/user'

export default class PasswordResetNotification extends BaseMail {
  user: User
  passwordResetToken: string
  from = 'no-reply@hotslab.com'
  subject = 'MoneyApp - Password Reset'
  constructor({ user, passwordResetToken }: { user: User; passwordResetToken: string }) {
    super()
    this.user = user
    this.passwordResetToken = passwordResetToken
  }

  /**
   * The "prepare" method is called automatically when
   * the email is sent or queued.
   */
  prepare() {
    this.message.to(this.user.email).html(`
      <h1> Hello ${this.user.userName} </h1>
      <p> Please reset your password by clicking the following link below: </p>
      <p> <a href="http://localhost:3000/reset-password/${this.passwordResetToken}">Reset password</a></p>
    `)
  }
}
