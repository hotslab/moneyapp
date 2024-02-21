import Account from '#models/account'
import Currency from '#models/currency'
import User from '#models/user'
import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { faker } from '@faker-js/faker'
import { test } from '@japa/runner'

test.group('Api account', (group) => {
  let user: User
  let userData: {
    user_name: string
    email: string
    password: string
    currency_id: number
  }
  let currencyCodes: Array<string>
  let newAccount: Account
  group.setup(async () => {
    await testUtils.db().seed()
    currencyCodes = env
      .get('CURRENCIES', `EUR,GBP,USD,JPY,CHF,AUD,CAD,CNY,NZD,INR,SEK,ZAR,HKD`)
      .split(',')
    const currency = await Currency.findByOrFail(
      'code',
      currencyCodes[Math.floor(Math.random() * currencyCodes.length)]
    )
    userData = {
      user_name: faker.person.fullName(),
      email: faker.internet.email({ firstName: faker.person.firstName() }),
      password: faker.internet.password({ length: 20, memorable: true }),
      currency_id: currency.id,
    }
    return async () => {
      await Account.query().delete()
      await User.query().delete()
      await Currency.query().delete()
    }
  })

  test('list user accounts', async ({ client }) => {
    const userResponse = await client.post('api/register').json(userData)
    userResponse.assertStatus(200)
    user = await User.findByOrFail('email', userData.email)
    user.verified = true
    await user.save()
    const response = await client.get('api/accounts').json(userData).loginAs(user)
    response.assertStatus(200)
    response.assertBodyContains({
      accounts: [],
      user: { email: userData.email, userName: userData.user_name },
    })
  })

  test('create new account', async ({ client, assert }) => {
    const currency = await Currency.findByOrFail(
      'code',
      currencyCodes[Math.floor(Math.random() * currencyCodes.length)]
    )
    const response = await client
      .post(`api/accounts`)
      .json({
        currency_id: currency.id,
      })
      .loginAs(user)
    response.assertStatus(200)
    response.assertBodyContains({ message: 'New account created successfully' })
    const createdAccount = await Account.query()
      .where('userId', user.id)
      .where('currencyId', currency.id)
      .first()
    assert.isNotNull(createdAccount)
    if (createdAccount) newAccount = createdAccount
  })

  test('delete new account', async ({ client, assert }) => {
    assert.isNotNull(newAccount)
    const response = await client.delete(`api/accounts/${newAccount.id}`).loginAs(user)
    response.assertStatus(200)
    response.assertBodyContains({ message: `Account No. ${newAccount.id} deleted successfully` })
    const deletedAccount = await Account.find(newAccount.id)
    assert.isNull(deletedAccount)
  })
})
