import env from '#start/env'
import Freecurrencyapi from '@everapi/freecurrencyapi-js'

export default class CurrencyConversionService {
  async convert(senderCurencyCode: string, receiverCurrencyCode: string): Promise<any> {
    console.log('testing 2', env.get('EVERAPI_KEY'))
    const freecurrencyapi = new Freecurrencyapi(env.get('EVERAPI_KEY'))
    return await freecurrencyapi.latest({
      base_currency: senderCurencyCode,
      currencies: receiverCurrencyCode,
    })
  }
}
