import Account from '#models/account'
import User from '#models/user'
import { deleteAccountValidator, storeAccountValidator } from '#validators/account'
import type { HttpContext } from '@adonisjs/core/http'

export default class AccountsController {
  async index({ request, response }: HttpContext) {
    const accounts: Array<Account> = await Account.query()
      .preload('currency')
      .preload('user')
      .where((query) => {
        if (request.input('user_id')) query.where('user_id', request.input('user_id'))
      })
      .orderBy('createdAt', 'desc')
    response.status(200).send({
      accounts: accounts,
      user: accounts.length > 0 ? accounts[0].user : null,
    })
  }

  async store({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(storeAccountValidator)
    const authUser: User = auth.getUserOrFail()
    const accountExists: Account | null = await Account.query()
      .where('currencyId', payload.currency_id)
      .where('userId', authUser.id)
      .first()
    if (!accountExists) {
      const account: Account = await Account.create({
        userId: authUser.id,
        currencyId: payload.currency_id,
      })
      response.status(200).send({ message: 'New account created successfully', account: account })
    } else response.status(400).send({ message: 'Account already exists' })
  }

  async destroy({ auth, params, response }: HttpContext) {
    const data = { id: params.id }
    const payload = await deleteAccountValidator.validate(data)
    const authUser = auth.getUserOrFail()
    await authUser.load('accounts')
    if (authUser.accounts.length > 1) {
      await authUser.related('accounts').query().where('id', payload.id).delete()
      response.status(200).send({ message: `Account No. ${payload.id} deleted successfully` })
    } else
      response.status(400).send({
        message: `Account No. ${payload.id} is your only account, so you cannot delete it from your profile.`,
      })
  }
}
