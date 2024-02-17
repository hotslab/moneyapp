import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import encryption from '@adonisjs/core/services/encryption'
import NotificationService from '#services/notification_service'
import EmailService from '#services/email_service'
import NotificattionTypes from '../types/notification_types.js'
import EmailTypes from '../types/email_types.js'

export default class AuthController {
  async login({ request, response }: HttpContext) {
    const user: User = await User.verifyCredentials(
      request.input('email'),
      request.input('password')
    )
    if (!user) response.status(400).send({ message: 'Invalid credentials' })
    const token = await User.accessTokens.create(user)
    response.status(200).send({
      user: user,
      accounts: await user.load('accounts'),
      token: token.value!.release(),
    })
  }

  async register({ request, response }: HttpContext) {
    const user: User = await User.create(request.only(['user_name', 'email', 'password']))
    await user.related('accounts').create({
      currencyId: request.input('currency_id'),
    })
    const emailVerifyToken = encryption.encrypt(
      {
        id: user.id,
        username: user.userName,
      },
      '1 day'
    )
    const emailService = new EmailService()
    emailService.queue({
      type: EmailTypes.VERIFY_EMAIL,
      emailData: { user: user, emailVerifyToken: emailVerifyToken },
    })
    response.status(200).send({ message: `${user.userName} created successfully` })
  }

  async verifyEmail({ params, response }: HttpContext) {
    const userData: { id: number; userName: string } | null = encryption.decrypt(params.token)
    if (userData) {
      const user: User = await User.findOrFail(userData.id)
      user.verified = true
      await user.save()
      const notificationService: NotificationService = new NotificationService()
      notificationService.queue({
        type: NotificattionTypes.EMAIL_VERIFIED,
        user_id: user.id,
        message: `Your email ${user.email} was verified successfully`,
      })
      response.status(200).send({ message: `Your email ${user.email} was verified successfully` })
    } else response.status(400).send({ message: `Failed to verify email. Please try again` })
  }

  async resendVerifyEmail({ auth, response }: HttpContext) {
    const authUser: User = auth.getUserOrFail()
    const emailVerifyToken = encryption.encrypt(
      {
        id: authUser.id,
        username: authUser.userName,
      },
      '1 day'
    )
    const emailService = new EmailService()
    emailService.queue({
      type: EmailTypes.VERIFY_EMAIL,
      emailData: { user: authUser, emailVerifyToken: emailVerifyToken },
    })
    response
      .status(200)
      .send({ message: `Verify email resent. Please chek your email at ${authUser.email}` })
  }

  async passwordResetLink({ request, response }: HttpContext) {
    const user: User | null = await User.query().where('email', request.input('email')).first()
    if (user) {
      const passwordResetToken = encryption.encrypt(
        {
          id: user.id,
          username: user.userName,
        },
        '1 day'
      )
      const emailService = new EmailService()
      emailService.queue({
        type: EmailTypes.PASSWORD_RESET_EMAIL,
        emailData: { user: user, passwordResetToken: passwordResetToken },
      })
      response.status(200).send({ message: `User was found with email ${user.email}` })
    } else
      response
        .status(404)
        .send({ message: `User was not found with email ${request.input('email')}` })
  }

  async resetPassword({ params, request, response }: HttpContext) {
    const userData: { id: number; userName: string } | null = encryption.decrypt(params.token)
    if (userData) {
      const user = await User.findOrFail(userData.id)
      user.userName = request.input('password')
      if (request.input('password')) user.password = request.input('password')
      await user.save()
      response
        .status(200)
        .send({ message: `Password for ${user.userName} updated successfully.`, user: user })
    } else
      response.status(400).send({
        message: `Password reset token failed or expired. Please send another verification email.`,
      })
  }
}
