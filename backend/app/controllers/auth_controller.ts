import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import encryption from '@adonisjs/core/services/encryption'
import NotificationService from '#services/notification_service'
import EmailService from '#services/email_service'
import NotificattionTypes from '../types/notification_types.js'
import EmailTypes from '../types/email_types.js'
import {
  loginValidator,
  passwordResetLinkValidator,
  registerValidator,
  resetPasswordValidator,
  verifyEmailValidator,
} from '#validators/auth'
import { inject } from '@adonisjs/core'

export default class AuthController {
  async login({ request, response }: HttpContext) {
    const payload = await request.validateUsing(loginValidator)
    const user: User = await User.verifyCredentials(payload.email, payload.password)
    const token = await User.accessTokens.create(user)
    response.status(200).send({
      user: user,
      accounts: await user.load('accounts'),
      token: token.value!.release(),
    })
  }

  @inject()
  async register({ request, response }: HttpContext, emailService: EmailService) {
    const payload = await request.validateUsing(registerValidator)
    const user: User = await User.create({
      userName: payload.user_name,
      email: payload.email,
      password: payload.password,
    })
    await user.related('accounts').create({
      currencyId: payload.currency_id,
    })
    const emailVerifyToken = encryption.encrypt(
      {
        id: user.id,
        username: user.userName,
      },
      '1 day'
    )
    emailService.queue({
      type: EmailTypes.VERIFY_EMAIL,
      emailData: { user: user, emailVerifyToken: emailVerifyToken },
    })
    response.status(200).send({ message: `${user.userName} created successfully` })
  }

  @inject()
  async verifyEmail({ params, response }: HttpContext, notificationService: NotificationService) {
    const data = { token: params.token }
    const payload = await verifyEmailValidator.validate(data)
    const userData: { id: number; userName: string } | null = encryption.decrypt(payload.token)
    if (userData) {
      const user: User = await User.findOrFail(userData.id)
      user.verified = true
      await user.save()
      notificationService.queue({
        type: NotificattionTypes.EMAIL_VERIFIED,
        user_id: user.id,
        message: `Your email ${user.email} was verified successfully`,
      })
      response.status(200).send({ message: `Your email ${user.email} was verified successfully` })
    } else response.status(400).send({ message: `Failed to verify email. Please try again` })
  }

  @inject()
  async resendVerifyEmail({ auth, response }: HttpContext, emailService: EmailService) {
    const authUser: User = auth.getUserOrFail()
    const emailVerifyToken = encryption.encrypt(
      {
        id: authUser.id,
        username: authUser.userName,
      },
      '1 day'
    )
    emailService.queue({
      type: EmailTypes.VERIFY_EMAIL,
      emailData: { user: authUser, emailVerifyToken: emailVerifyToken },
    })
    response
      .status(200)
      .send({ message: `Verify email resent. Please chek your email at ${authUser.email}` })
  }

  @inject()
  async passwordResetLink({ request, response }: HttpContext, emailService: EmailService) {
    const payload = await request.validateUsing(passwordResetLinkValidator)
    const user: User | null = await User.query().where('email', payload.email).first()
    if (user) {
      const passwordResetToken = encryption.encrypt(
        {
          id: user.id,
          username: user.userName,
        },
        '1 day'
      )
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
    const data = { token: params.token, password: request.input('password') }
    const payload = await resetPasswordValidator.validate(data)
    const userData: { id: number; userName: string } | null = encryption.decrypt(payload.token)
    if (userData) {
      const user = await User.findOrFail(userData.id)
      user.password = payload.password
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
