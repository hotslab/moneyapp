import Notification from '#models/notification'
import User from '#models/user'
import NotificationService from '#services/notification_service'
import QueueService from '#services/queue_service'
import NodeRedis from '#services/redis_service'
import app from '@adonisjs/core/services/app'
import { faker } from '@faker-js/faker'
import { test } from '@japa/runner'
import sinon from 'sinon'
import EmailTypes from '../../../app/types/email_types.js'

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

class FakeNotificationService extends NotificationService {}

let fakedQueue: FakeQueueService
let fakedRedis: FakeNodeRedis

let fakedNotificationClass: FakeNotificationService

let queueStartSpy: any
let redisIOSpy: any

let user: User

test.group('Services notification', (group) => {
  group.setup(async () => {
    fakedQueue = new FakeQueueService()
    fakedRedis = new FakeNodeRedis()
    fakedNotificationClass = new FakeNotificationService(fakedQueue, fakedRedis)
    app.container.swap(QueueService, () => new FakeQueueService())
    app.container.swap(NodeRedis, () => new FakeNodeRedis())
    queueStartSpy = sinon.spy(fakedQueue, 'start')
    redisIOSpy = sinon.spy(fakedRedis, 'io')
    const userData = {
      user_name: faker.person.fullName(),
      email: faker.internet.email({ firstName: faker.person.firstName() }),
      password: faker.internet.password({ length: 20, memorable: true }),
    }
    user = await User.create(userData)

    return async () => {
      await Notification.query().delete()
      await User.query().delete()
      app.container.restore(QueueService)
      app.container.restore(NodeRedis)
      app.container.restore(NotificationService)
    }
  })

  group.each.teardown(async () => {
    queueStartSpy.resetHistory()
    redisIOSpy.resetHistory()
  })

  test('queue notification', async ({ assert }) => {
    await fakedNotificationClass.queue({
      type: EmailTypes.VERIFY_EMAIL,
      user_id: user.id,
      message: faker.lorem.paragraphs(5),
      sendSocketNotification: true,
    })
    assert.isTrue(queueStartSpy.called)
  })

  test('create notification and send to socket via redis', async ({ assert }) => {
    const userData = {
      user_id: user.id,
      message: faker.lorem.sentence(10),
      sendSocketNotification: true,
    }
    await fakedNotificationClass.createNotification(EmailTypes.VERIFY_EMAIL, userData)
    assert.isTrue(redisIOSpy.called)
    const notification = await Notification.query()
      .where('userId', user.id)
      .where('message', userData.message)
      .first()
    assert.exists(notification)
    if (notification) assert.equal(userData.message, notification.message)
  })
})
