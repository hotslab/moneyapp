import Account from '#models/account'
import Currency from '#models/currency'
import Notification from '#models/notification'
import Transaction from '#models/transaction'
import User from '#models/user'
import EmailService from '#services/email_service'
import NotificationService from '#services/notification_service'
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { faker } from '@faker-js/faker'
import { test } from '@japa/runner'
import { v4 as uuidv4 } from 'uuid'
import TransactionTypes from '../../../app/types/transaction_types.js'
import QueueService from '#services/queue_service'
import NodeRedis from '#services/redis_service'
import TransactionService from '#services/transaction_service'
import sinon from 'sinon'
import QueueTypes from '../../../app/types/queue_types.js'

test.group('Services transaction', (group) => {
  let receiverUser: User
  let senderUser: User
  let receiverAccount: Account
  let senderAccount: Account
  let senderCurrency: Currency
  let receiverCurrency: Currency
  let currencyCodes: Array<string>
  let senderData: any
  let receiverData: any
  let senderAccountAmount: number
  let uuid: string
  let transactionData: {
    idempotency_key: string
    transaction_type: string
    conversion_rate: number
    sender_amount: number
    sender_currency_id: number
    sender_currency_symbol: string
    sender_account_id: number | null
    sender_account_number: number
    sender_name: string
    sender_email: string
    recipient_amount: number
    recipient_currency_id: number
    recipient_currency_symbol: string
    recipient_account_id: number | null
    recipient_account_number: number
    recipient_name: string
    recipient_email: string
    auth_user_id: number
    receiver_user_id: number | null
  }
  let transaction: Transaction
  let transactionTypes: Array<keyof typeof TransactionTypes>
  let selectedTransactionType: keyof typeof TransactionTypes
  let currencyRate: number

  let queueStartSpy: any
  let notificationQueueSpy: any
  let emailQueueSpy: any

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
  class FakeEmailService extends EmailService {
    queue: any = async () => {
      return {
        add() {},
      }
    }
  }

  class FakedTransactionService extends TransactionService {}

  let fakedQueue: FakeQueueService
  let fakedRedis: FakeNodeRedis
  let fakedNotification: FakeNotificationService
  let fakedEmail: FakeEmailService
  let transactionServiceClass: FakedTransactionService

  group.setup(async () => {
    await testUtils.db().seed()
    fakedQueue = new FakeQueueService()
    fakedRedis = new FakeNodeRedis()
    fakedNotification = new FakeNotificationService(fakedQueue, fakedRedis)
    fakedEmail = new FakeEmailService(fakedQueue, fakedNotification)
    app.container.swap(QueueService, () => new FakeQueueService())
    app.container.swap(
      NotificationService,
      () => new FakeNotificationService(fakedQueue, fakedRedis)
    )
    app.container.swap(EmailService, () => fakedEmail)

    transactionServiceClass = new FakedTransactionService(fakedQueue, fakedEmail, fakedNotification)

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
    }
    receiverData = {
      user_name: faker.person.fullName(),
      email: faker.internet.email({ firstName: faker.person.firstName() }),
      password: faker.internet.password({ length: 20, memorable: true }),
    }

    senderUser = await User.create(senderData)
    receiverUser = await User.create(receiverData)

    senderAccountAmount = faker.number.float({ min: 5000, max: 10000, fractionDigits: 2 })
    senderAccount = await Account.create({
      userId: senderUser.id,
      currencyId: senderCurrency.id,
      amount: senderAccountAmount,
    })
    receiverAccount = await Account.create({
      userId: receiverUser.id,
      currencyId: receiverCurrency.id,
      amount: 0,
    })
    senderAccount = await Account.findOrFail(senderAccount.id)
    receiverAccount = await Account.findOrFail(receiverAccount.id)

    uuid = uuidv4()
    transactionTypes = Object.values(TransactionTypes)
    selectedTransactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)]

    currencyRate =
      (TransactionTypes.PAYMENT === selectedTransactionType ||
        TransactionTypes.TRANSFER === selectedTransactionType) &&
      senderCurrency.id !== receiverCurrency.id
        ? faker.number.float({ min: 0, max: 2, fractionDigits: 6 })
        : 1
    const senderAmount =
      senderCurrency.decimalDigits > 0
        ? faker.number.float({ min: 1000, max: 4500, fractionDigits: 2 })
        : faker.number.float({ min: 1000, max: 4500, fractionDigits: 0 })
    const receiverAmount =
      (TransactionTypes.PAYMENT === selectedTransactionType ||
        TransactionTypes.TRANSFER === selectedTransactionType) &&
      senderCurrency.id !== receiverCurrency.id
        ? senderCurrency.decimalDigits > 0
          ? Number.parseFloat(Number.parseFloat(`${senderAmount * currencyRate}`).toFixed(2))
          : Number.parseFloat(Number.parseFloat(`${senderAmount * currencyRate}`).toFixed(0))
        : senderAmount
    transactionData = {
      idempotency_key: uuid,
      transaction_type: selectedTransactionType,
      conversion_rate: currencyRate,
      // sender details
      sender_amount: senderAmount,
      sender_currency_id:
        TransactionTypes.DEPOSIT !== selectedTransactionType
          ? senderCurrency.id
          : receiverCurrency.id,
      sender_currency_symbol:
        TransactionTypes.DEPOSIT !== selectedTransactionType
          ? senderCurrency.symbol
          : receiverCurrency.symbol,
      sender_account_id:
        TransactionTypes.DEPOSIT !== selectedTransactionType ? senderAccount.id : null,
      sender_account_number:
        TransactionTypes.DEPOSIT !== selectedTransactionType
          ? senderAccount.id
          : Number.parseInt(faker.finance.accountNumber(10)),
      sender_name:
        TransactionTypes.DEPOSIT !== selectedTransactionType
          ? senderUser.userName
          : faker.person.fullName(),
      sender_email:
        TransactionTypes.DEPOSIT !== selectedTransactionType
          ? senderUser.email
          : faker.internet.email({ firstName: faker.person.firstName() }),
      // recipient details
      recipient_amount: receiverAmount,
      recipient_currency_id:
        TransactionTypes.WITHDRAW !== selectedTransactionType
          ? receiverCurrency.id
          : senderCurrency.id,
      recipient_currency_symbol:
        TransactionTypes.WITHDRAW !== selectedTransactionType
          ? receiverCurrency.symbol
          : senderCurrency.symbol,
      recipient_account_id:
        TransactionTypes.WITHDRAW !== selectedTransactionType ? receiverAccount.id : null,
      recipient_account_number:
        TransactionTypes.WITHDRAW !== selectedTransactionType
          ? receiverAccount.id
          : Number.parseInt(faker.finance.accountNumber(10)),
      recipient_name:
        TransactionTypes.WITHDRAW !== selectedTransactionType
          ? receiverUser.userName
          : faker.person.fullName(),
      recipient_email:
        TransactionTypes.WITHDRAW !== selectedTransactionType
          ? receiverUser.email
          : faker.internet.email({ firstName: faker.person.firstName() }),
      auth_user_id:
        TransactionTypes.DEPOSIT !== selectedTransactionType ? receiverUser.id : senderUser.id,
      receiver_user_id:
        TransactionTypes.DEPOSIT !== selectedTransactionType ? receiverUser.id : null,
    }

    queueStartSpy = sinon.spy(fakedQueue, 'start')
    emailQueueSpy = sinon.spy(fakedEmail, 'queue')
    notificationQueueSpy = sinon.spy(fakedNotification, 'queue')

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
    emailQueueSpy.resetHistory()
    notificationQueueSpy.resetHistory()
  })

  test('queue the transaction', async ({ assert }) => {
    await transactionServiceClass.queue(transactionData)
    assert.isTrue(queueStartSpy.called)
    assert.equal(QueueTypes.transactions, queueStartSpy.args[0])
  })

  test('get accounts', async ({ assert }) => {
    const accounts = await transactionServiceClass.getAccounts(
      transactionData.transaction_type === TransactionTypes.DEPOSIT,
      transactionData.transaction_type === TransactionTypes.WITHDRAW,
      transactionData
    )
    if (TransactionTypes.WITHDRAW !== transactionData.transaction_type) {
      assert.equal(accounts.senderAccount?.id, transactionData.sender_account_id)
    }
    if (TransactionTypes.DEPOSIT !== transactionData.transaction_type) {
      assert.equal(accounts.receiverAccount?.id, transactionData.recipient_account_id)
    }
  })

  test('balance is sufficient', async ({ assert }) => {
    const approved = transactionServiceClass.balanceIsSufficient(
      transactionData.transaction_type === TransactionTypes.DEPOSIT,
      transactionData.sender_amount,
      senderAccount
    )
    assert.isTrue(approved)
  })

  test('create new transaction', async ({ assert }) => {
    const newTransaction = await transactionServiceClass.createTransaction(transactionData)
    transaction = await Transaction.findOrFail(newTransaction.id)
    assert.exists(transaction)
    assert.equal(transaction.idempotencyKey, transactionData.idempotency_key)
    assert.equal(transaction.transactionType, transactionData.transaction_type)
    assert.equal(transaction.conversionRate, transactionData.conversion_rate)
    assert.equal(transaction.senderAmount, transactionData.sender_amount)
    assert.equal(transaction.senderCurrencyId, transactionData.sender_currency_id)
    assert.equal(transaction.senderCurrencySymbol, transactionData.sender_currency_symbol)
    assert.equal(transaction.senderAccountId, transactionData.sender_account_id)
    assert.equal(transaction.senderAccountNumber, transactionData.sender_account_number)
    assert.equal(transaction.senderName, transactionData.sender_name)
    assert.equal(transaction.senderEmail, transactionData.sender_email)
    assert.equal(transaction.recipientAmount, transactionData.recipient_amount)
    assert.equal(transaction.recipientCurrencyId, transactionData.recipient_currency_id)
    assert.equal(transaction.recipientCurrencySymbol, transactionData.recipient_currency_symbol)
    assert.equal(transaction.recipientAccountId, transactionData.recipient_account_id)
    assert.equal(transaction.recipientAccountNumber, transactionData.recipient_account_number)
    assert.equal(transaction.recipientName, transactionData.recipient_name)
    assert.equal(transaction.recipientEmail, transactionData.recipient_email)
  })

  test('update account balances after creating transaction', async ({ assert }) => {
    const senderBefore = senderAccount.amount
    const receiverBefore = receiverAccount.amount
    await transactionServiceClass.updateAccountBalances(
      transactionData.transaction_type === TransactionTypes.DEPOSIT,
      transactionData.transaction_type === TransactionTypes.WITHDRAW,
      receiverAccount,
      senderAccount,
      transactionData.recipient_amount,
      transactionData.sender_amount
    )
    if (transactionData.transaction_type !== TransactionTypes.WITHDRAW) {
      receiverAccount = await Account.findOrFail(receiverAccount.id)
      assert.equal(
        receiverAccount.amount,
        Number.parseFloat(
          receiverCurrency.decimalDigits > 0
            ? Number.parseFloat(`${receiverBefore + transactionData.recipient_amount}`).toFixed(2)
            : Number.parseFloat(`${receiverBefore + transactionData.recipient_amount}`).toFixed(0)
        )
      )
    }
    if (transactionData.transaction_type !== TransactionTypes.DEPOSIT) {
      senderAccount = await Account.findOrFail(senderAccount.id)
      assert.equal(
        senderAccount.amount,
        Number.parseFloat(
          senderCurrency.decimalDigits > 0
            ? Number.parseFloat(`${senderBefore - transactionData.sender_amount}`).toFixed(2)
            : Number.parseFloat(`${senderBefore - transactionData.sender_amount}`).toFixed(0)
        )
      )
    }
  })

  test('send success notifications', async ({ assert }) => {
    await transactionServiceClass.sendSuccessNotifications(
      transaction.id,
      transactionData.transaction_type !== TransactionTypes.WITHDRAW ? receiverUser.id : null,
      transactionData.transaction_type !== TransactionTypes.DEPOSIT ? senderUser.id : null,
      'create-transaction',
      null
    )
    assert.isTrue(emailQueueSpy.called)
    assert.isTrue(notificationQueueSpy.called)
    if (
      transactionData.transaction_type !== TransactionTypes.WITHDRAW &&
      transactionData.transaction_type !== TransactionTypes.DEPOSIT
    )
      assert.isTrue(notificationQueueSpy.calledAfter(emailQueueSpy))
  })

  test('send success notifications', async ({ assert }) => {
    await transactionServiceClass.duplicateTransactionNotification(
      transaction,
      transactionData.auth_user_id
    )
    assert.isTrue(notificationQueueSpy.called)
    assert.isTrue(emailQueueSpy.called)
  })

  test('send job failed notifications', async ({ assert }) => {
    await transactionServiceClass.jobFailed(transactionData)
    assert.isTrue(notificationQueueSpy.called)
    assert.isTrue(emailQueueSpy.called)
  })
})
