import Account from '#models/account'
import Transaction from '#models/transaction'
import User from '#models/user'
import TransactionService from '#services/transaction_service'
import {
  indexTransactionValidator,
  storeTransactionExtraFieldsValidator,
  storeTransactionValidator,
} from '#validators/transaction'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { v4 as uuidv4 } from 'uuid'

export default class TransactionsController {
  async index({ request, response }: HttpContext) {
    const payload = await request.validateUsing(indexTransactionValidator)
    const transactions: Array<Transaction> = await Transaction.query()
      .where('sender_account_id', payload.account_id)
      .orWhere('recipient_account_id', payload.account_id)
    response.status(200).send({ transactions: transactions })
  }

  @inject()
  async store({ auth, request, response }: HttpContext, transactionService: TransactionService) {
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
    })
    response.status(200).send({ message: 'Transaction sent for processing.' })
  }

  async getUniqueIdempotencyKey({ response }: HttpContext) {
    let newUuid = null
    for (let index = 0; index < 5; index++) {
      const uuid = uuidv4()
      const exists = await Transaction.findBy('idempotency_key', newUuid)
      if (!exists) {
        newUuid = uuid
        break
      }
    }
    if (newUuid)
      response.status(200).send({
        message: 'Transaction initialization started successfully',
        idempotency_key: newUuid,
      })
    else
      response
        .status(400)
        .send({ message: 'Failed to start transaction process. Please try again' })
  }
}
