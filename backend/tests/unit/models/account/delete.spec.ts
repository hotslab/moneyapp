import currencies from '#database/data/currency'
import Account from '#models/account'
import Currency from '#models/currency'
import User from '#models/user'
import { faker } from '@faker-js/faker'
import { test } from '@japa/runner'

test.group('Account delete', (group) => {
  let currencyData: (typeof currencies)[0]
  let currency: Currency
  let user: User
  let account: Account
  group.setup(async () => {
    currencyData = currencies[Math.floor(Math.random() * currencies.length)]
    currency = await Currency.firstOrCreate(currencyData)
    user = await User.create({
      userName: faker.person.fullName(),
      email: faker.internet.email({ firstName: faker.person.firstName() }),
      password: faker.internet.password({ length: 20, memorable: true }),
    })
    await currency.save()
    return async () => {
      await Account.query().delete()
      await User.query().delete()
      await Currency.query().delete()
    }
  })
  test('account is deleted successfully', async ({ assert }) => {
    const savedAccount = await Account.create({
      userId: user.id,
      currencyId: currency.id,
    })
    account = await Account.findOrFail(savedAccount.id)
    assert.exists(account)
    await account.delete()
    const exists: Account | null = await Account.find(account.id)
    assert.notExists(exists)
  })
})
