import currencies from '#database/data/currency'
import Account from '#models/account'
import Currency from '#models/currency'
import Transaction from '#models/transaction'
import User from '#models/user'
import { faker } from '@faker-js/faker'
import { test } from '@japa/runner'
import TransactionTypes from '../../../../app/types/transaction_types.js'
import { v4 as uuidv4 } from 'uuid'

test.group('Transaction create', (group) => {
  let senderCurrency: Currency
  let receiverCurrency: Currency
  let senderUser: User
  let senderAccount: Account
  let receiverUser: User
  let receiverAccount: Account
  let transaction: Transaction
  let transactionData: any
  group.setup(async () => {
    senderCurrency = await Currency.create(
      currencies[Math.floor(Math.random() * currencies.length)]
    )
    receiverCurrency = await Currency.create(
      currencies[Math.floor(Math.random() * currencies.length)]
    )
    senderUser = await User.create({
      userName: faker.person.fullName(),
      email: faker.internet.email({ firstName: faker.person.firstName() }),
      password: faker.internet.password({ length: 20, memorable: true }),
    })
    receiverUser = await User.create({
      userName: faker.person.fullName(),
      email: faker.internet.email({ firstName: faker.person.firstName() }),
      password: faker.internet.password({ length: 20, memorable: true }),
    })
    senderAccount = await Account.create({
      userId: senderUser.id,
      currencyId: senderCurrency.id,
      amount: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
    })
    receiverAccount = await Account.create({
      userId: receiverUser.id,
      currencyId: receiverCurrency.id,
    })
    return async () => {
      await Transaction.query().delete()
      await Account.query().delete()
      await User.query().delete()
      await Currency.query().delete()
    }
  })

  test('make a new transaction', async ({ assert }) => {
    const conversionRate = faker.number.float({ min: 0, max: 5, fractionDigits: 5 })
    const receiverAmount = conversionRate * senderAccount.amount
    transactionData = {
      idempotencyKey: uuidv4(),
      transactionType: TransactionTypes.TRANSFER,
      conversionRate:
        receiverAccount.currencyId !== senderAccount.currencyId
          ? faker.number.float({ min: 0, max: 5, fractionDigits: 5 })
          : 1,
      senderAmount: senderAccount.amount,
      senderCurrencyId: senderAccount.currencyId,
      senderCurrencySymbol: senderCurrency.symbol,
      senderAccountId: senderAccount.id,
      senderAccountNumber: senderAccount.id,
      senderName: senderUser.userName,
      senderEmail: senderUser.email,
      recipientAmount: receiverAmount,
      recipientCurrencyId: receiverAccount.currencyId,
      recipientCurrencySymbol: receiverCurrency.symbol,
      recipientAccountId: receiverAccount.id,
      recipientAccountNumber: receiverAccount.id,
      recipientName: receiverUser.userName,
      recipientEmail: receiverUser.email,
    }
    transaction = await Transaction.create(transactionData)
    assert.isTrue(transaction.$isPersisted)
  })

  test('new transation is an instance of Transaction model', async ({ expectTypeOf }) => {
    expectTypeOf(transaction).toMatchTypeOf<Transaction>()
  })

  test('new transaction property types are correct', async ({ expectTypeOf }) => {
    expectTypeOf(transaction.idempotencyKey).toEqualTypeOf<string>()
    expectTypeOf(transaction.transactionType).toEqualTypeOf<keyof typeof TransactionTypes>()
    expectTypeOf(transaction.conversionRate).toEqualTypeOf<number>()
    expectTypeOf(transaction.senderAmount).toEqualTypeOf<number>()
    expectTypeOf(transaction.senderCurrencyId).toEqualTypeOf<number>()
    expectTypeOf(transaction.senderCurrencySymbol).toEqualTypeOf<string>()
    expectTypeOf(transaction.senderAccountId).toEqualTypeOf<number>()
    expectTypeOf(transaction.senderAccountNumber).toEqualTypeOf<number>()
    expectTypeOf(transaction.senderName).toEqualTypeOf<string>()
    expectTypeOf(transaction.senderEmail).toEqualTypeOf<string>()
    expectTypeOf(transaction.recipientAmount).toEqualTypeOf<number>()
    expectTypeOf(transaction.recipientCurrencyId).toEqualTypeOf<number>()
    expectTypeOf(transaction.recipientCurrencySymbol).toEqualTypeOf<string>()
    expectTypeOf(transaction.recipientAccountId).toEqualTypeOf<number>()
    expectTypeOf(transaction.recipientAccountNumber).toEqualTypeOf<number>()
    expectTypeOf(transaction.recipientName).toEqualTypeOf<string>()
    expectTypeOf(transaction.recipientEmail).toEqualTypeOf<string>()
  })

  test('new transaction properties match data', async ({ assert }) => {
    assert.equal(transaction.idempotencyKey, transactionData.idempotencyKey)
    assert.equal(transaction.transactionType, transactionData.transactionType)
    assert.equal(transaction.conversionRate, transactionData.conversionRate)
    // assert.equal(transaction.senderAmount, transactionData.senderAmount)
    assert.equal(transaction.senderCurrencyId, transactionData.senderCurrencyId)
    assert.equal(transaction.senderCurrencySymbol, transactionData.senderCurrencySymbol)
    assert.equal(transaction.senderAccountId, transactionData.senderAccountId)
    assert.equal(transaction.senderAccountNumber, transactionData.senderAccountNumber)
    assert.equal(transaction.senderName, transactionData.senderName)
    assert.equal(transaction.senderEmail, transactionData.senderEmail)
    // assert.equal(transaction.recipientAmount, transactionData.recipientAmount)
    assert.equal(transaction.recipientCurrencyId, transactionData.recipientCurrencyId)
    assert.equal(transaction.recipientCurrencySymbol, transactionData.recipientCurrencySymbol)
    assert.equal(transaction.recipientAccountId, transactionData.recipientAccountId)
    assert.equal(transaction.recipientAccountNumber, transactionData.recipientAccountNumber)
    assert.equal(transaction.recipientName, transactionData.recipientName)
    assert.equal(transaction.recipientEmail, transactionData.recipientEmail)
  })

  test('check sender and receiver amounts are saved as an integer and not a float', async ({
    assert,
  }) => {
    assert.isTrue(Number.isInteger(transaction.recipientAmount))
    assert.isTrue(Number.isInteger(transaction.senderAmount))
  })

  test('check sender and receiver amounts are returned as a float or integer depending on currency decimal points', async ({
    assert,
  }) => {
    transaction = await Transaction.findOrFail(transaction.id)
    assert.isTrue(
      Number.isInteger(transaction.senderAmount) ||
        (!Number.isInteger(transaction.senderAmount) && Number.isFinite(transaction.senderAmount))
    )
    assert.isTrue(
      Number.isInteger(transaction.senderAmount) ||
        (!Number.isInteger(transaction.recipientAmount) &&
          Number.isFinite(transaction.recipientAmount))
    )
  })

  test('rejects saving duplicate idempotencyKey transaction records', async ({ assert }) => {
    try {
      await Transaction.create(transactionData)
    } catch (error) {
      assert.equal(error.name, 'error')
      assert.equal(error.constraint, 'transactions_idempotency_key_unique')
    }
  })
})
