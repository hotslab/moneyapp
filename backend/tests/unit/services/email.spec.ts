import EmailService from '#services/email_service'
import NotificationService from '#services/notification_service'
import QueueService from '#services/queue_service'
import NodeRedis from '#services/redis_service'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import EmailTypes from '../../../app/types/email_types.js'
import { faker } from '@faker-js/faker'
import User from '#models/user'
import Currency from '#models/currency'
import env from '#start/env'
import mail from '@adonisjs/mail/services/main'
import VerifyEmailNotification from '#mails/verify_email_notification'
import encryption from '@adonisjs/core/services/encryption'
import Notification from '#models/notification'
import Transaction from '#models/transaction'
import Account from '#models/account'
import sinon from 'sinon'

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
  queue: any = async () => {
    return {
      add() {},
    }
  }
}

class FakeEmailService extends EmailService {}

let fakedQueue: FakeQueueService
let fakedRedis: FakeNodeRedis
let fakedNotification: FakeNotificationService
let fakedEmailServiceClass: FakeEmailService

let queueStartSpy: any
let notificationQueueSpy: any
let mailObject: any

let user: User
let emailVerifyToken: string

test.group('Services email', (group) => {
  group.setup(async () => {
    await testUtils.db().seed()
    mailObject = mail.fake()
    fakedQueue = new FakeQueueService()
    fakedRedis = new FakeNodeRedis()
    fakedNotification = new FakeNotificationService(fakedQueue, fakedRedis)
    app.container.swap(QueueService, () => new FakeQueueService())
    app.container.swap(
      NotificationService,
      () => new FakeNotificationService(fakedQueue, fakedRedis)
    )
    fakedEmailServiceClass = new FakeEmailService(fakedQueue, fakedNotification)
    queueStartSpy = sinon.spy(fakedQueue, 'start')
    notificationQueueSpy = sinon.spy(fakedNotification, 'queue')

    const currencyCodes = env
      .get('CURRENCIES', `EUR,GBP,USD,JPY,CHF,AUD,CAD,CNY,NZD,INR,SEK,ZAR,HKD`)
      .split(',')
    const currency = await Currency.findByOrFail(
      'code',
      currencyCodes[Math.floor(Math.random() * currencyCodes.length)]
    )
    const userData = {
      user_name: faker.person.fullName(),
      email: faker.internet.email({ firstName: faker.person.firstName() }),
      password: faker.internet.password({ length: 20, memorable: true }),
    }
    user = await User.create(userData)
    await user.related('accounts').create({
      currencyId: currency.id,
    })
    emailVerifyToken = encryption.encrypt(
      {
        id: user.id,
        username: user.userName,
      },
      '1 day'
    )

    return async () => {
      await Notification.query().delete()
      await Transaction.query().delete()
      await Account.query().delete()
      await User.query().delete()
      await Currency.query().delete()
      app.container.restore(QueueService)
      app.container.restore(NodeRedis)
      app.container.restore(EmailService)
      app.container.restore(NotificationService)
    }
  })

  group.each.teardown(async () => {
    queueStartSpy.resetHistory()
    notificationQueueSpy.resetHistory()
  })

  test('queue an email', async ({ assert }) => {
    await fakedEmailServiceClass.queue({
      type: EmailTypes.VERIFY_EMAIL,
      emailData: { user: user, emailVerifyToken: emailVerifyToken },
    })

    assert.isTrue(queueStartSpy.called)
    mailObject.mails.assertQueued(VerifyEmailNotification)
  })

  test('email in queue has been sent', async () => {
    const sentEmails = mailObject.mails.sent()

    const email = sentEmails.find((emailData: any) => {
      return emailData instanceof VerifyEmailNotification
    })

    if (email) {
      email.message.assertTo(user.email)
      email.message.assertFrom('no-reply@hotslab.com')
      email.message.assertHtmlIncludes(
        `Please verify your email address ${user.email} by clicking the following link below`
      )
    }
  })

  test('send email notification', async ({ assert }) => {
    fakedEmailServiceClass.createNotifications(EmailTypes.VERIFY_EMAIL, user.id, {
      message: {
        subject: 'MoneyApp - Verify Email',
        from: 'no-reply@hotslab.com',
        to: [`${user.userName}`],
        html: '\n      <h1> Hello Dr. Bennie Langosh </h1>\n      <p> Please verify your email address Judge82@yahoo.com by clicking the following link below: </p>\n      <p> <a href="http://localhost:3000/verify-email/CwwjtDaLl-Q-jz4Uz0vvYasOXJK8qOxnKpJ_dfHvWfAR9VrlAWdK_Vo10QnmTjs1aSRykxcJU1y4IkUP8E-mN_XRXAOKdriHh1xglGnRllydiw_tX6guSP0wLqCgpvlp.NV9OMUpfTVJJZEFNOXVUNQ.L72L7C86Fp5r6knEQOBLV6PZeFWEfx8ifoKJcwb6tY4">Verify email</a></p>\n    ',
      },
      views: {},
    })
    assert.isTrue(notificationQueueSpy.called)
  })
})
