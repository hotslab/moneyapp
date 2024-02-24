import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { faker } from '@faker-js/faker'
import { test } from '@japa/runner'

test.group('User update', (group) => {
  let userData = {
    userName: faker.person.fullName(),
    email: faker.internet.email({ firstName: faker.person.firstName() }),
    password: faker.internet.password({ length: 20, memorable: true }),
  }
  let updatedUserData = {
    userName: faker.person.fullName(),
    email: faker.internet.email({ firstName: faker.person.firstName() }),
    password: faker.internet.password({ length: 20, memorable: true }),
  }

  let user: User
  let updatedUser: User
  group.setup(async () => {
    const savedUser = await User.create(userData)
    user = await User.findOrFail(savedUser.id)

    return async () => {
      await User.query().where('id', user.id).delete()
    }
  })

  test('updated user details are saved', async ({ assert }) => {
    user.userName = updatedUserData.userName
    user.email = updatedUserData.email
    user.password = updatedUserData.password
    await user.save()
    assert.isTrue(user.$isPersisted)
  })

  test('updated user details match the update data', async ({ assert }) => {
    updatedUser = await User.findOrFail(user.id)
    assert.equal(updatedUser.userName, updatedUserData.userName)
    assert.equal(updatedUser.email, updatedUserData.email)
  })

  test('hashes updated user password', async ({ assert }) => {
    assert.isTrue(hash.isValidHash(updatedUser.password))
    assert.isTrue(await hash.verify(updatedUser.password, updatedUserData.password))
  })
})
