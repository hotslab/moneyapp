import Transaction from '#models/transaction'
import TransactionService from '#services/transaction_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class TransactionsController {
  /**
   * Display a list of resource
   */
  async index({ request, response }: HttpContext) {
    const transactions: Array<Transaction> = await Transaction.query()
      .where('sender_account_id', request.input('account_id'))
      .orWhere('recipient_account_id', request.input('account_id'))
    response.status(200).send({ transactions: transactions })
  }

  /**
   * Display form to create a new record
   */
  async create({}: HttpContext) {}

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const transactionService = new TransactionService()
    await transactionService.queue({
      idempotency_key: request.header('idempotency_key') as string,
      transaction_type: request.input('transaction_type') as string,
      conversion_rate: Number.parseFloat(request.input('conversion_rate') as string),
      // sender details
      sender_amount: Number.parseFloat(request.input('sender_amount') as string),
      sender_currency_id: Number.parseInt(request.input('sender_currency_id') as string),
      sender_currency_symbol: request.input('sender_currency_symbol') as string,
      sender_account_id: Number.parseInt(request.input('sender_account_id') as string),
      sender_account_number: Number.parseInt(request.input('sender_account_number') as string),
      sender_name: request.input('sender_name') as string,
      sender_email: request.input('sender_email') as string,
      // recipient details
      recipient_amount: Number.parseFloat(request.input('recipient_amount') as string),
      recipient_currency_id: Number.parseInt(request.input('recipient_currency_id') as string),
      recipient_currency_symbol: request.input('recipient_currency_symbol') as string,
      recipient_account_id: Number.parseInt(request.input('recipient_account_id') as string),
      recipient_account_number: Number.parseInt(
        request.input('recipient_account_number') as string
      ),
      recipient_name: request.input('recipient_name') as string,
      recipient_email: request.input('recipient_email') as string,
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
}
