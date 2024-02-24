import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { faker } from '@faker-js/faker'
import Currency from '#models/currency'

test.group('User create', (group) => {
  let userData = {
    userName: faker.person.fullName(),
    email: faker.internet.email({ firstName: faker.person.firstName() }),
    password: faker.internet.password({ length: 20, memorable: true }),
  }

  let user: User
  group.setup(async () => {
    const savedUser = await User.create(userData)
    user = await User.findOrFail(savedUser.id)

    return async () => {
      await Currency.query().delete()
      await User.query().delete()
    }
  })

  test('new user is an instance of User model', async ({ expectTypeOf }) => {
    expectTypeOf(user).toMatchTypeOf<User>()
  })

  test('new user properties types are correct', async ({ expectTypeOf }) => {
    expectTypeOf(user.userName).toEqualTypeOf<string>()
    expectTypeOf(user.email).toEqualTypeOf<string>()
    expectTypeOf(user.password).toEqualTypeOf<string>()
    expectTypeOf(user.verified).toEqualTypeOf<boolean>()
    expectTypeOf(user.createdAt).toEqualTypeOf<DateTime>()
    expectTypeOf(user.createdAt).toEqualTypeOf<DateTime>()
  })

  test('new user is unverified by default', async ({ assert }) => {
    assert.equal(user.verified, false)
  })

  test('new user properties match data', async ({ assert }) => {
    assert.equal(user.email, userData.email)
    assert.equal(user.userName, userData.userName)
  })

  test('new user password is hashed automatically', async ({ assert }) => {
    assert.isTrue(hash.isValidHash(user.password))
    assert.isTrue(await hash.verify(user.password, userData.password))
  })

  test('rejects duplicate user records', async ({ assert }) => {
    try {
      await User.create(userData)
    } catch (error) {
      assert.equal(error.name, 'error')
      assert.match(error.message, /duplicate key/g)
      assert.match(error.message, /unique/g)
    }
  })
})
