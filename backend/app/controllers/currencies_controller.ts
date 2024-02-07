import Currency from '#models/currency'
import type { HttpContext } from '@adonisjs/core/http'

export default class CurrenciesController {
  /**
   * Display a list of resource
   */
  async index({ response }: HttpContext) {
    response.status(200).send({
      currencies: await Currency.query().whereIn('code', [
        'EUR',
        'GBP',
        'USD',
        'JPY',
        'CHF',
        'AUD',
        'CAD',
        'CNY',
        'NZD',
        'INR',
        'BZR',
        'SEK',
        'ZAR',
        'HKD',
      ]),
    })
  }

  /**
   * Display form to create a new record
   */
  async create({}: HttpContext) {}

  /**
   * Handle form submission for the create action
   */
  async store({ request }: HttpContext) {}

  /**
   * Show individual record
   */
  async show({ params, response }: HttpContext) {
    const currency: Currency = await Currency.findOrFail(params.id)
    response.status(200).send({ currency: currency })
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
  async destroy({ params }: HttpContext) {}
}
