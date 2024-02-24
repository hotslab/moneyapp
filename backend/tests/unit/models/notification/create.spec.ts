import currencies from '#database/data/currency'
import Currency from '#models/currency'
import Notification from '#models/notification'
import User from '#models/user'
import { faker } from '@faker-js/faker'
import { test } from '@japa/runner'
import NotificationTypes from '../../../../app/types/notification_types.js'
import EmailTypes from '../../../../app/types/email_types.js'

test.group('Notification create', (group) => {
  let currencyData: (typeof currencies)[0]
  let currency: Currency
  let user: User
  let notification: Notification
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
      await Notification.query().delete()
      await User.query().delete()
      await Currency.query().delete()
    }
  })

  test('new notification is created and persited to database', async ({ assert }) => {
    const savedNotification = await Notification.create({
      userId: user.id,
      message: faker.lorem.paragraph(),
      type: NotificationTypes.NEW_TRANSACTION,
    })
    assert.isTrue(savedNotification.$isPersisted)
    notification = await Notification.findOrFail(savedNotification.id)
  })

  test('new notification is an instance of Notification model', async ({ expectTypeOf }) => {
    expectTypeOf(notification).toMatchTypeOf<Notification>()
  })

  test('new notification property types are correct', async ({ expectTypeOf }) => {
    expectTypeOf(notification.userId).toEqualTypeOf<number>()
    expectTypeOf(notification.message).toEqualTypeOf<string>()
    expectTypeOf(notification.type).toEqualTypeOf<
      keyof typeof NotificationTypes | keyof typeof EmailTypes
    >()
    expectTypeOf(notification.read).toEqualTypeOf<boolean>()
  })

  test('new notification amount defaults to false', async ({ assert }) => {
    assert.equal(notification.read, false)
  })

  test('notification returns related models', async ({ assert }) => {
    const relatedUser = await notification.related('user').query().first()
    assert.equal(relatedUser?.id, notification.userId)
  })
})
