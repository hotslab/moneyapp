import Account from '#models/account'
import Transaction from '#models/transaction'
import User from '#models/user'
import TransactionService from '#services/transaction_service'
import {
  indexTransactionValidator,
  storeTransactionExtraFieldsValidator,
  storeTransactionValidator,
} from '#validators/transaction'
import type { HttpContext } from '@adonisjs/core/http'
import { v4 as uuidv4 } from 'uuid'

export default class TransactionsController {
  /**
   * Display a list of resource
   */
  async index({ request, response }: HttpContext) {
    const payload = await request.validateUsing(indexTransactionValidator)
    const transactions: Array<Transaction> = await Transaction.query()
      .where('sender_account_id', payload.account_id)
      .orWhere('recipient_account_id', payload.account_id)
    response.status(200).send({ transactions: transactions })
  }

  /**
   * Display form to create a new record
   */
  async create({}: HttpContext) {}

  /**
   * Handle form submission for the create action
   */
  async store({ auth, request, response }: HttpContext) {
    // first validation
    const data = {
      idempotency_key: request.header('idempotency_key') as string,
      ...request.all(),
    }
    const payload = await storeTransactionValidator.validate(data)

    const authUser: User = auth.getUserOrFail()
    let receiverAccount: Account | null = null
    if (request.input('sender_account_id'))
      receiverAccount = await Account.find(request.input('sender_account_id'))

    // second validation
    const extraFieldsData = {
      auth_user_id: authUser.id,
      receiver_user_id: receiverAccount ? receiverAccount.userId : null,
    }
    const extraFieldsPayload = await storeTransactionExtraFieldsValidator.validate(extraFieldsData)

    // create transaction
    const transactionService = new TransactionService()
    await transactionService.queue({
      idempotency_key: payload.idempotency_key,
      transaction_type: payload.transaction_type,
      conversion_rate: payload.conversion_rate,
      // sender details
      sender_amount: payload.sender_amount,
      sender_currency_id: payload.sender_currency_id,
      sender_currency_symbol: payload.sender_currency_symbol,
      sender_account_id: payload.sender_account_id,
      sender_account_number: payload.sender_account_number,
      sender_name: payload.sender_name,
      sender_email: payload.sender_email,
      // recipient details
      recipient_amount: payload.recipient_amount,
      recipient_currency_id: payload.recipient_currency_id,
      recipient_currency_symbol: payload.recipient_currency_symbol,
      recipient_account_id: payload.recipient_account_id,
      recipient_account_number: payload.recipient_account_number,
      recipient_name: payload.recipient_name,
      recipient_email: payload.recipient_email,
      auth_user_id: extraFieldsPayload.auth_user_id,
      receiver_user_id: extraFieldsPayload.receiver_user_id,
      // idempotency_key: request.header('idempotency_key') as string,
      // transaction_type: request.input('transaction_type') as string,
      // conversion_rate: Number.parseFloat(request.input('conversion_rate') as string),
      // // sender details
      // sender_amount: Number.parseFloat(request.input('sender_amount') as string),
      // sender_currency_id: Number.parseInt(request.input('sender_currency_id') as string),
      // sender_currency_symbol: request.input('sender_currency_symbol') as string,
      // sender_account_id: Number.parseInt(request.input('sender_account_id') as string),
      // sender_account_number: Number.parseInt(request.input('sender_account_number') as string),
      // sender_name: request.input('sender_name') as string,
      // sender_email: request.input('sender_email') as string,
      // // recipient details
      // recipient_amount: Number.parseFloat(request.input('recipient_amount') as string),
      // recipient_currency_id: Number.parseInt(request.input('recipient_currency_id') as string),
      // recipient_currency_symbol: request.input('recipient_currency_symbol') as string,
      // recipient_account_id: Number.parseInt(request.input('recipient_account_id') as string),
      // recipient_account_number: Number.parseInt(
      //   request.input('recipient_account_number') as string
      // ),
      // recipient_name: request.input('recipient_name') as string,
      // recipient_email: request.input('recipient_email') as string,
      // auth_user_id: authUser.id,
      // receiver_user_id: receiverAccount ? receiverAccount.userId : null,
    })
    response.status(200).send({ message: 'Transaction sent for processing.' })
  }

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {}

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
  async destroy({ params }: HttpContext) {}

  async getIdempotencyKey({ response }: HttpContext) {
    let newUuid = null
    for (let index = 0; index < 5; index++) {
      const uuid = uuidv4()
      const exists = await Transaction.findBy('idempotency_key', newUuid)
      if (!exists) {
        newUuid = uuid
        break
      }
    }
    if (newUuid) response.status(200).send({ idempotency_key: newUuid })
    else
      response
        .status(400)
        .send({ message: 'Failed to start transaction process. Please try again' })
  }
}
