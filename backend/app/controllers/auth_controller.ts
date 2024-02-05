import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Account from '#models/account'
import mail from '@adonisjs/mail/services/main'


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
      token: token.value!.release(),
    })
  }

  async register({ request, response }: HttpContext) {
    const user: User = await User.create(request.only(['user_name', 'email', 'password']))
    const account: Account = await Account.create({
      userId: user.id,
      currencyId: request.input('currency_id'),
    })
    const token = await User.accessTokens.create(user)
    const url = `localhost:3000/verify/${user.id}`
    await mail.send((message) => {
      message
        .to(user.email)
        .from('no-reply@hotslab.com')
        .subject('Verify your email address')
        .htmlView('emails/verify_email', { user: user, url: url })
    })
    response.status(200).send({
      user: user,
      account: account,
      token: token.value!.release(),
    })
  }
}
