import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Account from '#models/account'
import mail from '@adonisjs/mail/services/main'
import VerifyEmailNotification from '#mails/verify_email_notification'
import encryption from '@adonisjs/core/services/encryption'

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
      accounts: await user.preload('accounts'),
      token: token.value!.release(),
    })
  }

  async register({ request, response }: HttpContext) {
    const user: User = await User.create(request.only(['user_name', 'email', 'password']))
    await Account.create({
      userId: user.id,
      currencyId: request.input('currency_id'),
    })
    const emailVerifyToken = encryption.encrypt(
      {
        id: user.id,
        username: user.userName,
      },
      '1 day'
    )
    await mail.sendLater(new VerifyEmailNotification(user, emailVerifyToken))
    response.status(200).send({ message: `${user.userName} created successfully` })
  }

  async verifyEmail({ params, response }: HttpContext) {
    const userData: { id: number; userName: string } | null = encryption.decrypt(params.token)
    if (userData) {
      const user: User = await User.findOrFail(userData.id)
      user.verified = true
      await user.save()
      response.status(200).send({ message: `${user.email} verified successfully` })
    }
  }
}
