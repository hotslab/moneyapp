import Account from '#models/account'
import type { HttpContext } from '@adonisjs/core/http'

export default class AccountsController {
  /**
   * Display a list of resource
   */
  async index({ request, response }: HttpContext) {
    console.log(request.all())
    const accounts: Array<Account> = await Account.query()
      .preload('currency')
      .where('user_id', request.input('user_id'))
      .paginate(request.input('page'), 15)
    response.status(200).send({ accounts: accounts })
  }

  /**
   * Display form to create a new record
   */
  async create({}: HttpContext) {}

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const account: Account = await Account.create(request.all())
    response.status(200).send({ message: 'New account created successfully', account: account })
  }

  /**
   * Show individual record
   */
  async show({ params, response }: HttpContext) {
    const account: Account = await Account.findOrFail(params.id)
    response.status(200).send({
      account: account,
      currency: await account.load('currency'),
      // receivedTransactions: await account.load('receivedTransactions', (query) => {
      //   query.whereNotNull('sender_account_id').orWhereNull('sender_account_id')
      // }),
      // sentTransactions: await account.load('sentTransactions', (query) => {
      //   query.whereNotNull('recipient_account_id').orWhereNull('recipient_account_id')
      // }),
    })
  }

  /**
   * Edit individual record
   */
  async edit({ params }: HttpContext) {}

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request }: HttpContext) {}

  /**
   * Delete record
   */
  async destroy({ auth, params, response }: HttpContext) {
    const authUser = auth.getUserOrFail()
    await authUser.load('accounts')
    if (authUser.accounts.length > 1) {
      await authUser.related('accounts').query().where('id', params.id).delete()
      response.status(200).send({ message: `Account No. ${params.id} deleted successfully` })
    } else
      response.status(500).send({
        message: `Account No. ${params.id} is your only account, so you cannot delete it from your profile.`,
      })
  }
}
