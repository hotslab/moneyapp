import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Account from '#models/account'
import Currency from '#models/currency'

export default class UserSeeder extends BaseSeeder {
  async run() {
    const currencies = [
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
    ]
    const users = await User.updateOrCreateMany('email', [
      {
        email: 'doe@test.com',
        userName: 'johnDoe',
        password: 'tested',
        verified: true,
      },
      {
        email: 'new@test.com',
        userName: 'janeNew',
        password: 'tested',
        verified: true,
      },
    ])
    for (const user of users) {
      const currency = await Currency.findBy(
        'code',
        currencies[Math.floor(Math.random() * currencies.length)]
      )
      if (currency)
        await Account.firstOrCreate({ userId: user.id, currencyId: currency.id }, { amount: 0 })
    }
  }
}
