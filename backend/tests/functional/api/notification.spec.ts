import Currency from '#models/currency'
import Notification from '#models/notification'
import User from '#models/user'
import { faker } from '@faker-js/faker'
import { test } from '@japa/runner'
import NotificationTypes from '../../../app/types/notification_types.js'

test.group('Api notification', (group) => {
  let user: User
  let userData: {
    user_name: string
    email: string
    password: string
    verified: true
  }
  group.setup(async () => {
    userData = {
      user_name: faker.person.fullName(),
      email: faker.internet.email({ firstName: faker.person.firstName() }),
      password: faker.internet.password({ length: 20, memorable: true }),
      verified: true,
    }
    user = await User.create(userData)
    return async () => {
      await Notification.query().delete()
      await User.query().delete()
      await Currency.query().delete()
    }
  })

  test('list notification records', async ({ client }) => {
    const response = await client.get(`api/notifications`).loginAs(user)
    response.assertStatus(200)
    response.assertBodyContains({ notifications: [] })
  })

  test('update notification as read', async ({ client, assert }) => {
    const notification = await Notification.create({
      message: 'Your email has been verified',
      userId: user.id,
      type: NotificationTypes.EMAIL_VERIFIED,
    })
    const response = await client.put(`api/notifications/${notification.id}`).loginAs(user)
    response.assertStatus(200)
    response.assertBodyContains({
      message: `Notification marked as read`,
    })
    const updatedNotification = await Notification.findOrFail(notification.id)
    assert.isTrue(updatedNotification.read)
  })
})
