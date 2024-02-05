import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Account from '#models/account'
import Currency from '#models/currency'

export default class UserSeeder extends BaseSeeder {
  async run() {
    const users = await User.fetchOrCreateMany('email', [
      {
        email: 'doe@test.com',
        userName: 'johnDoe',
        password: 'test',
      },
      {
        email: 'new@test.com',
        userName: 'janeNew',
        password: 'test',
      },
    ])
    for (const user of users) {
      const currency = await Currency.findBy('code', 'USD')
      if (currency)
        await Account.firstOrCreate({ userId: user.id, currencyId: currency.id }, { amount: 0 })
    }
  }
}