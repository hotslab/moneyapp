import Account from '#models/account'
import User from '#models/user'
import {
  deleteAccountValidator,
  indexAccountValidator,
  showAccountValidator,
  storeAccountValidator,
} from '#validators/account'
import type { HttpContext } from '@adonisjs/core/http'

export default class AccountsController {
  /**
   * Display a list of resource
   */
  async index({ request, response }: HttpContext) {
    const data = { id: request.input('user_id') }
    const payload = await indexAccountValidator.validate(data)
    const accounts: Array<Account> = await Account.query()
      .preload('currency')
      .preload('user')
      .where('user_id', payload.id)
      .orderBy('createdAt', 'desc')
    response.status(200).send({
      accounts: accounts,
      user: accounts.length > 0 ? accounts[0].user : null,
    })
  }

  /**
   * Display form to create a new record
   */
  async create({}: HttpContext) {}

  /**
   * Handle form submission for the create action
   */
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

  /**
   * Show individual record
   */
  async show({ params, response }: HttpContext) {
    const data = { id: params.id }
    const payload = await showAccountValidator.validate(data)
    const account: Account = await Account.findOrFail(payload.id)
    response.status(200).send({
      account: account,
      currency: await account.load('currency'),
      user: await account.load('user'),
    })
  }

  /**
   * Edit individual record
   */
  async edit({ params }: HttpContext) {}

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, response }: HttpContext) {}

  /**
   * Delete record
   */
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
