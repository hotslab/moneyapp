import currencies from '#database/data/currency'
import Account from '#models/account'
import Currency from '#models/currency'
import User from '#models/user'
import { faker } from '@faker-js/faker'
import { test } from '@japa/runner'

test.group('Account create', (group) => {
  let currencyData: (typeof currencies)[0]
  let currency: Currency
  let user: User
  let account: Account
  group.setup(async () => {
    currencyData = currencies[Math.floor(Math.random() * currencies.length)]
    currency = await Currency.create(currencyData)
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

  test('new account is created and persited to database', async ({ assert }) => {
    const savedAccount = await Account.create({
      userId: user.id,
      currencyId: currency.id,
    })
    assert.isTrue(savedAccount.$isPersisted)
    account = await Account.findOrFail(savedAccount.id)
  })

  test('new account is an instance of Account model', async ({ expectTypeOf }) => {
    expectTypeOf(account).toMatchTypeOf<Account>()
  })

  test('new account property types are correct', async ({ expectTypeOf }) => {
    expectTypeOf(account.userId).toEqualTypeOf<number>()
    expectTypeOf(account.currencyId).toEqualTypeOf<number>()
    expectTypeOf(account.amount).toEqualTypeOf<number>()
  })

  test('new account properties match data', async ({ assert }) => {
    assert.equal(account.userId, user.id)
    assert.equal(account.currencyId, currency.id)
  })

  test('new account amount defaults to zero', async ({ assert }) => {
    assert.equal(account.amount, 0)
  })

  test('account returns related models', async ({ assert }) => {
    const relatedUser = await account.related('user').query().first()
    const relatedCurrency = await account.related('currency').query().first()
    assert.equal(relatedUser?.id, account.userId)
    assert.equal(relatedCurrency?.id, account.currencyId)
  })
})
