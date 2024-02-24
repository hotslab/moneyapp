import Account from '#models/account'
import Currency from '#models/currency'
import Notification from '#models/notification'
import Transaction from '#models/transaction'
import User from '#models/user'
import EmailService from '#services/email_service'
import NotificationService from '#services/notification_service'
import QueueService from '#services/queue_service'
import NodeRedis from '#services/redis_service'
import app from '@adonisjs/core/services/app'
import encryption from '@adonisjs/core/services/encryption'
import testUtils from '@adonisjs/core/services/test_utils'
import { faker } from '@faker-js/faker'
import { test } from '@japa/runner'

class FakeQueueService extends QueueService {
  start: any = () => {
    return {
      add() {},
    }
  }
}
class FakeNodeRedis extends NodeRedis {
  async io(): Promise<any> {
    return {
      subscribe: () => {},
      publish: () => {},
    }
  }
}
class FakeNotificationService extends NotificationService {
  async queue() {
    return
  }
}
class FakeEmailService extends EmailService {
  async queue() {
    return
  }
}

test.group('Auth login', (group) => {
  let userData: {
    user_name: string
    email: string
    password: string
    currency_id: number
  }
  let registeredUser: User
  group.setup(async () => {
    await testUtils.db().seed()
    const fakedNotification = new FakeNotificationService(
      new FakeQueueService(),
      new FakeNodeRedis()
    )
    app.container.swap(
      NotificationService,
      () => new FakeNotificationService(new FakeQueueService(), new FakeNodeRedis())
    )
    app.container.swap(
      EmailService,
      () => new FakeEmailService(new FakeQueueService(), fakedNotification)
    )
    return async () => {
      await Notification.query().delete()
      await Transaction.query().delete()
      await Account.query().delete()
      await User.query().delete()
      await Currency.query().delete()
      app.container.restore(NodeRedis)
      app.container.restore(QueueService)
      app.container.restore(EmailService)
      app.container.restore(NotificationService)
    }
  })

  test('register user', async ({ client }) => {
    const currency = await Currency.findByOrFail('code', 'USD')
    userData = {
      user_name: faker.person.fullName(),
      email: faker.internet.email({ firstName: faker.person.firstName() }),
      password: faker.internet.password({ length: 20, memorable: true }),
      currency_id: currency.id,
    }
    const response = await client.post('api/register').json(userData)
    response.assertStatus(200)
    response.assertBody({
      message: `${userData.user_name} created successfully`,
    })
  })

  test('registered user has default account created automatically', async ({ assert }) => {
    registeredUser = await User.findByOrFail('email', userData.email)
    await registeredUser.load('accounts')
    assert.isTrue(registeredUser.accounts.length > 0)
  })

  test('login user', async ({ client }) => {
    const response = await client.post('api/login').json({
      email: userData.email,
      password: userData.password,
    })

    response.assertStatus(200)
    response.assertBodyContains({
      user: {
        email: userData.email,
        userName: userData.user_name,
      },
    })
  })
  test('resend verify email', async ({ client }) => {
    const response = await client.get(`api/resend-verify-email`).loginAs(registeredUser)

    response.assertStatus(200)
    response.assertBodyContains({
      message: `Verify email resent. Please chek your email at ${registeredUser.email}`,
    })
  })
  test('verify email', async ({ assert, client }) => {
    const emailVerifyToken = encryption.encrypt(
      {
        id: registeredUser.id,
        username: registeredUser.userName,
      },
      '1 day'
    )
    const response = await client.get(`api/verify-email/${emailVerifyToken}`).json({
      email: userData.email,
      password: userData.password,
    })

    response.assertStatus(200)
    response.assertBodyContains({
      message: `Your email ${registeredUser.email} was verified successfully`,
    })
    registeredUser = await User.findOrFail(registeredUser.id)
    assert.equal(registeredUser.verified, true)
  })
  test('password reset link sent', async ({ client }) => {
    const response = await client.post(`api/password-reset-link`).json({
      email: userData.email,
    })

    response.assertStatus(200)
    response.assertBodyContains({
      message: `User was found with email ${registeredUser.email}`,
    })
  })
  test('password reset', async ({ client }) => {
    const passwordResetToken = encryption.encrypt(
      {
        id: registeredUser.id,
        username: registeredUser.userName,
      },
      '1 day'
    )
    const password = faker.internet.password({ length: 20, memorable: true })
    const response = await client.put(`api/reset-password/${passwordResetToken}`).json({
      password: password,
    })

    response.assertStatus(200)
    response.assertBodyContains({
      message: `Password for ${registeredUser.userName} updated successfully.`,
      user: {
        email: userData.email,
        userName: userData.user_name,
      },
    })

    const logInResponse = await client.post('api/login').json({
      email: userData.email,
      password: password,
    })

    logInResponse.assertStatus(200)
    logInResponse.assertBodyContains({
      user: {
        email: userData.email,
        userName: userData.user_name,
      },
    })
  })
})
