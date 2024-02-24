import Account from '#models/account'
import Currency from '#models/currency'
import User from '#models/user'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import CurrencyExchangeService from '#services/currency_exchange_service'
import env from '#start/env'
import { faker } from '@faker-js/faker'

test.group('Api currency', (group) => {
  let currencyCodes: Array<string>
  let fakeRate: number
  group.setup(async () => {
    await testUtils.db().seed()
    currencyCodes = env
      .get('CURRENCIES', `EUR,GBP,USD,JPY,CHF,AUD,CAD,CNY,NZD,INR,SEK,ZAR,HKD`)
      .split(',')
    fakeRate = faker.number.float({ min: 0, max: 2, fractionDigits: 6 })
    class FakeCurrencyExchangeService extends CurrencyExchangeService {
      async convert(
        _senderCurrencyCode: string,
        receiverCurrencyCode: string
      ): Promise<{ data: { [x: string]: number } }> {
        return { data: { [receiverCurrencyCode]: fakeRate } }
      }
    }
    app.container.swap(CurrencyExchangeService, () => new FakeCurrencyExchangeService())
    return async () => {
      await Account.query().delete()
      await User.query().delete()
      await Currency.query().delete()
      app.container.restore(CurrencyExchangeService)
    }
  })
  test('list currencies', async ({ client }) => {
    const response = await client.get('api/currencies')
    response.assertStatus(200)
    response.assertBodyContains({
      currencies: currencyCodes.map((e: string) => {
        return { code: e }
      }),
    })
  })
  test('convert currency api', async ({ client }) => {
    const userData = {
      userName: faker.person.fullName(),
      email: faker.internet.email({ firstName: faker.person.firstName() }),
      password: faker.internet.password({ length: 20, memorable: true }),
      verified: true,
    }
    const user = await User.create(userData)
    const requestData = {
      amount: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
      senderCurrencyCode: currencyCodes[Math.floor(Math.random() * currencyCodes.length)],
      receiverCurrencyCode: currencyCodes[Math.floor(Math.random() * currencyCodes.length)],
    }
    const response = await client.post('api/currency-conversion').json(requestData).loginAs(user)
    response.assertStatus(200)
    response.assertBodyContains({
      rate: fakeRate,
      convertedAmont: fakeRate * requestData.amount,
      errorMessage: '',
    })
  })
})
