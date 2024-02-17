import Account from '#models/account'
import Currency from '#models/currency'
import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class AccountsController {
  /**
   * Display a list of resource
   */
  async index({ request, response }: HttpContext) {
    const accounts: Array<Account> = await Account.query()
      .preload('currency')
      .preload('user')
      .where('user_id', request.input('user_id'))
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
    const authUser: User = auth.getUserOrFail()
    const accountExists: Account | null = await Account.query()
      .where('currencyId', request.input('currency_id'))
      .where('userId', authUser.id)
      .first()
    if (!accountExists) {
      const account: Account = await Account.create({
        userId: authUser.id,
        currencyId: request.input('currency_id'),
      })
      response.status(200).send({ message: 'New account created successfully', account: account })
    } else response.status(400).send({ message: 'Account already exists' })
  }

  /**
   * Show individual record
   */
  async show({ params, response }: HttpContext) {
    const account: Account = await Account.findOrFail(params.id)
    response.status(200).send({
      account: account,
      currency: await account.load('currency'),
      user: await account.load('user'),
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
  async update({ params, request, response }: HttpContext) {
    // enum Action {
    //   ADD = 'add',
    //   WITHDRAW = 'withdraw',
    // }
    // const account: Account = await Account.findOrFail(params.id)
    // await account.load('currency')
    // let newAmount = request.input('amount')
    // console.log('VVALUES', { new: newAmount, og: account.amount })
    // if (request.input('action') === Action.WITHDRAW) {
    //   if (Number.parseFloat(newAmount) > account.amount)
    //     response.status(400).send({ message: 'Amount withdrawn is greater than balance' })
    //   else account.amount = account.amount - Number.parseFloat(newAmount)
    // } else if (request.input('action') === Action.ADD) {
    //   console.log(
    //     'ADDING',
    //     account.amount + Number.parseFloat(newAmount),
    //     account.amount,
    //     Number.parseFloat(newAmount)
    //   )
    //   account.amount = account.amount + Number.parseFloat(newAmount)
    // }
    // await account.save()
    // response
    //   .status(200)
    //   .send({ message: `Account No. ${account.id} updated successfully`, account: account })
  }

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
      response.status(400).send({
        message: `Account No. ${params.id} is your only account, so you cannot delete it from your profile.`,
      })
  }
}
