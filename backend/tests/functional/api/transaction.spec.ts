import Account from '#models/account'
import Currency from '#models/currency'
import User from '#models/user'
import TransactionService from '#services/transaction_service'
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { faker } from '@faker-js/faker'
import { test } from '@japa/runner'
import { v4 as uuidv4 } from 'uuid'
import TransactionTypes from '../../../app/types/transaction_types.js'
import QueueService from '#services/queue_service'
import NodeRedis from '#services/redis_service'
import NotificationService from '#services/notification_service'
import EmailService from '#services/email_service'

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
class FakeTransactionService extends TransactionService {
  async queue() {
    return
  }
}

test.group('Api transaction', (group) => {
  let receiverUser: User
  let senderUser: User
  let receiverAccount: Account
  let senderAccount: Account
  let senderCurrency: Currency
  let receiverCurrency: Currency
  let currencyCodes: Array<string>
  let senderData: any
  let receiverData: any
  group.setup(async () => {
    await testUtils.db().seed()

    const fakedQueue = new FakeQueueService()
    const fakedRedis = new FakeNodeRedis()
    const fakedNotification = new FakeNotificationService(fakedQueue, fakedRedis)
    const fakedEmail = new FakeEmailService(fakedQueue, fakedNotification)

    app.container.swap(
      TransactionService,
      () => new FakeTransactionService(fakedQueue, fakedEmail, fakedNotification)
    )

    currencyCodes = env
      .get('CURRENCIES', `EUR,GBP,USD,JPY,CHF,AUD,CAD,CNY,NZD,INR,SEK,ZAR,HKD`)
      .split(',')
    senderCurrency = await Currency.findByOrFail(
      'code',
      currencyCodes[Math.floor(Math.random() * currencyCodes.length)]
    )
    receiverCurrency = await Currency.findByOrFail(
      'code',
      currencyCodes[Math.floor(Math.random() * currencyCodes.length)]
    )
    senderData = {
      user_name: faker.person.fullName(),
      email: faker.internet.email({ firstName: faker.person.firstName() }),
      password: faker.internet.password({ length: 20, memorable: true }),
      currency_id: senderCurrency.id,
    }
    receiverData = {
      user_name: faker.person.fullName(),
      email: faker.internet.email({ firstName: faker.person.firstName() }),
      password: faker.internet.password({ length: 20, memorable: true }),
      currency_id: receiverCurrency.id,
    }

    return async () => {
      await Account.query().delete()
      await User.query().delete()
      await Currency.query().delete()
      app.container.restore(TransactionService)
    }
  })

  test('test setup', async ({ client }) => {
    const senderResponse = await client.post('api/register').json(senderData)
    senderResponse.assertStatus(200)
    senderUser = await User.findByOrFail('email', senderData.email)
    senderUser.verified = true
    await senderUser.save()
    senderAccount = await Account.findByOrFail('userId', senderUser.id)
    senderAccount.amount = faker.number.float({ min: 5000, max: 10000, fractionDigits: 2 })
    await senderAccount.save()

    const receiverResponse = await client.post('api/register').json(receiverData)
    receiverResponse.assertStatus(200)
    receiverUser = await User.findByOrFail('email', receiverData.email)
    receiverUser.verified = true
    await receiverUser.save()
    receiverAccount = await Account.findByOrFail('userId', receiverUser.id)
  })

  test('list user account transaction records', async ({ client }) => {
    const response = await client
      .get(`api/transactions?account_id=${senderAccount.id}`)
      .loginAs(senderUser)
    response.assertStatus(200)
    response.assertBodyContains({ transactions: [] })
  })

  test('get unique transaction idempotency key', async ({ client, assert, expectTypeOf }) => {
    const response = await client.get(`api/transaction-key`).loginAs(senderUser)
    response.assertStatus(200)
    response.assertBodyContains({ message: 'Transaction initialization started successfully' })
    const body: any = response.body()
    assert.isNotNull(body.idempotency_key)
    expectTypeOf(body.idempotency_key).toBeString
  })

  test('submit transaction and send to transaction queue', async ({ client }) => {
    const uuid = uuidv4()
    const currencyRate =
      senderCurrency.id !== receiverCurrency.id
        ? faker.number.float({ min: 0, max: 2, fractionDigits: 6 })
        : 1
    const senderAmount = faker.number.float({ min: 1000, max: 4500, fractionDigits: 2 })
    const response = await client
      .post(`api/transactions`)
      .header('idempotency_key', uuid)
      .json({
        transaction_type: TransactionTypes.PAYMENT,
        conversion_rate: currencyRate,
        // sender details
        sender_amount: senderAmount,
        sender_currency_id: senderCurrency.id,
        sender_currency_symbol: senderCurrency.symbol,
        sender_account_id: senderAccount.id,
        sender_account_number: senderAccount.id,
        sender_name: senderUser.userName,
        sender_email: senderUser.email,
        // recipient details
        recipient_amount:
          senderCurrency.id !== receiverCurrency.id
            ? Number.parseFloat(`${senderAmount * currencyRate}`).toFixed(2)
            : 1,
        recipient_currency_id: receiverCurrency.id,
        recipient_currency_symbol: receiverCurrency.symbol,
        recipient_account_id: receiverAccount.id,
        recipient_account_number: receiverAccount.id,
        recipient_name: receiverUser.userName,
        recipient_email: receiverUser.email,
      })
      .loginAs(senderUser)
    response.assertStatus(200)
    response.assertBodyContains({ message: 'Transaction sent for processing.' })
  })
})
