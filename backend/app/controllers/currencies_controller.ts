import Currency from '#models/currency'
import CurrencyExchangeService from '#services/currency_exchange_service'
import env from '#start/env'
import { currencyConversionValidator } from '#validators/currency'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class CurrenciesController {
  async index({ response }: HttpContext) {
    const approvedCurrencies = env
      .get('CURRENCIES', `EUR,GBP,USD,JPY,CHF,AUD,CAD,CNY,NZD,INR,BZR,SEK,ZAR,HKD`)
      .split(',')
    response.status(200).send({
      currencies: await Currency.query().whereIn('code', approvedCurrencies),
    })
  }

  @inject()
  async currencyConversion(
    { request, response }: HttpContext,
    currencyExchangeService: CurrencyExchangeService
  ) {
    const payload = await request.validateUsing(currencyConversionValidator)

    let rate: number | null = null
    let convertedAmont: number | null = null
    let errorMessage: string = ''
    await currencyExchangeService
      .convert(payload.senderCurrencyCode, payload.receiverCurrencyCode)
      .then(
        (resp: any) => {
          rate = resp.data[payload.receiverCurrencyCode]
          convertedAmont = rate ? payload.amount * rate : null
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
