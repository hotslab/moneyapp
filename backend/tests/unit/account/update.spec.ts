import currencies from '#database/data/currency'
import Account from '#models/account'
import Currency from '#models/currency'
import User from '#models/user'
import { test } from '@japa/runner'
import { faker } from '@faker-js/faker'

test.group('Account update', (group) => {
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
    const savedAccount = await Account.create({
      userId: user.id,
      currencyId: currency.id,
    })
    account = await Account.findOrFail(savedAccount.id)
    return async () => {
      await Account.query().delete()
      await User.query().delete()
      await Currency.query().delete()
    }
  })

  test('update account amount with a float number and check if balance is saved as an integer', async ({
    assert,
  }) => {
    account.amount = Math.random() * 100000
    await account.save()
    assert.isTrue(account.$isPersisted)
    assert.isTrue(Number.isInteger(account.amount))
  })

  test('check amount returned is float or integer depending on currency decimal points', async ({
    assert,
  }) => {
    account = await Account.findOrFail(account.id)
    if (currency.decimalDigits > 0) {
      assert.isTrue(currency.decimalDigits > 0)
      assert.isTrue(!Number.isInteger(account.amount) && Number.isFinite(account.amount))
    } else {
      assert.isTrue(currency.decimalDigits === 0)
      assert.isTrue(Number.isInteger(account.amount))
    }
  })
})
