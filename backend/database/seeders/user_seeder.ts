import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Account from '#models/account'
import Currency from '#models/currency'

export default class UserSeeder extends BaseSeeder {
  async run() {
    const users = await User.updateOrCreateMany('email', [
      {
        email: 'doe@test.com',
        userName: 'johnDoe',
        password: 'test',
        verified: true,
      },
      {
        email: 'new@test.com',
        userName: 'janeNew',
        password: 'test',
        verified: true,
      },
      {
        email: 'hotslices7@gmail.com',
        userName: 'hotslices',
        password: 'test',
        verified: true,
      },
      {
        email: 'gomantrix@gmail.com',
        userName: 'gomantrix',
        password: 'test',
        verified: true,
      },
    ])
    for (const user of users) {
      const currency = await Currency.findBy('code', 'USD')
      if (currency)
        await Account.firstOrCreate({ userId: user.id, currencyId: currency.id }, { amount: 0 })
    }
  }
}
