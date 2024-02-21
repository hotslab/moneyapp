import Account from '#models/account'
import Currency from '#models/currency'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { faker } from '@faker-js/faker'
import { test } from '@japa/runner'

test.group('Api user', (group) => {
  let user: User
  let userData: {
    user_name: string
    email: string
    password: string
    currency_id: number
  }
  let userList: { users: Array<any> }
  group.setup(async () => {
    await testUtils.db().seed()
    const currency = await Currency.findByOrFail('code', 'USD')
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

  test('list users', async ({ client }) => {
    const userResponse = await client.post('api/register').json(userData)
    userResponse.assertStatus(200)
    user = await User.findByOrFail('email', userData.email)
    user.verified = true
    await user.save()
    const response = await client.get('api/users').json(userData).loginAs(user)
    response.assertStatus(200)
    response.assertBodyContains({ users: [] })
    userList = response.body()
  })

  test('auth user is not included in the users list', async ({ assert }) => {
    assert.isTrue(!userList.users.map((e) => e.id).includes(user.id))
  })

  test('update user', async ({ client, assert }) => {
    userData.user_name = faker.person.fullName()
    userData.email = faker.internet.email({ firstName: faker.person.firstName() })
    userData.password = faker.internet.password({ length: 20, memorable: true })
    const response = await client.put(`api/users/${user.id}`).json(userData).loginAs(user)
    response.assertStatus(200)
    response.assertBodyContains({
      message: `${userData.user_name} updated successfully`,
      user: {
        email: userData.email,
        userName: userData.user_name,
      },
    })
    user = await User.findOrFail(user.id)
    assert.equal(user.email, userData.email)
    assert.equal(user.userName, userData.user_name)
  })

  test('delete user', async ({ client, assert }) => {
    const response = await client.delete(`api/users/${user.id}`).loginAs(user)
    response.assertStatus(200)
    response.assertBodyContains({
      message: `${user.userName} deleted successfully`,
    })
    assert.isNull(await User.find(user.id))
  })
})
