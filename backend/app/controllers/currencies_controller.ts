import Currency from '#models/currency'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import Freecurrencyapi from '@everapi/freecurrencyapi-js'

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

  /**
   * Get currency conversion
   */
  async currencyConversion({ request, response }: HttpContext) {
    const freecurrencyapi = new Freecurrencyapi(env.get('EVERAPI_KEY'))
    let rate: number | null = null
    let convertedAmont: number | null = null
    let errorMessage: string | null = ''
    await freecurrencyapi
      .latest({
        base_currency: request.input('senderCurrencyCode'),
        currencies: request.input('receiverCurrencyCode'),
      })
      .then(
        (resp: any) => {
          rate = resp.data[request.input('receiverCurrencyCode')]
          convertedAmont = rate ? Number.parseFloat(request.input('amount')) * rate : null
          response.status(200).send({
            rate: rate,
            convertedAmont: convertedAmont,
          })
        },
        (error: any) => {
          logger.error({ error: error }, 'Currency conversion error')
          errorMessage = error.response?.data ? (error.response.data as any).message : error.message
        }
      )
    response.status(200).send({ rate, convertedAmont, errorMessage })
  }
}
