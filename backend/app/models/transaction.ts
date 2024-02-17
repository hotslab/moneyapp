import Account from '#models/account'
import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  beforeSave,
  computed,
  afterFetch,
  hasOne,
  afterFind,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import Currency from './currency.js'
import { LucidRow } from '@adonisjs/lucid/types/model'
import { hasOnlyExpressionInitializer } from 'typescript'
import TransactionTypes from '../types/transaction_types.js'

export default class Transaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare idempotencyKey: string

  @column()
  declare transactionType: keyof typeof TransactionTypes

  @column()
  declare conversionRate: number

  // sender details
  @column()
  declare senderAmount: number

  @column()
  declare senderCurrencyId: number

  @column()
  declare senderCurrencySymbol: string

  @column()
  declare senderAccountId: number

  @column()
  declare senderAccountNumber: number

  @column()
  declare senderName: string

  @column()
  declare senderEmail: string

  // recipient details
  @column()
  declare recipientAmount: number

  @column()
  declare recipientCurrencyId: number

  @column()
  declare recipientCurrencySymbol: string

  @column()
  declare recipientAccountId: number

  @column()
  declare recipientAccountNumber: number

  @column()
  declare recipientName: string

  @column()
  declare recipientEmail: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasOne(() => Currency, { localKey: 'senderCurrencyId', foreignKey: 'id' })
  declare senderCurrency: HasOne<typeof Currency>

  @hasOne(() => Currency, { localKey: 'recipientCurrencyId', foreignKey: 'id' })
  declare recipientCurrency: HasOne<typeof Currency>

  @belongsTo(() => Account, { localKey: 'senderAccountId' })
  declare senderAccount: BelongsTo<typeof Account>

  @belongsTo(() => Account, { localKey: 'recipientAccountId' })
  declare recipientAccount: BelongsTo<typeof Account>

  @beforeSave()
  static async saveAmountsAsInteger(transaction: Transaction) {
    try {
      if (transaction.$dirty.senderAmount) {
        const senderCurrency = await Currency.find(transaction.senderCurrencyId)
        if (senderCurrency)
          transaction.senderAmount = Math.round(
            transaction.senderAmount *
              (senderCurrency.decimalDigits <= 0 ? 1 : Math.pow(10, senderCurrency.decimalDigits))
          )
      }
      if (transaction.$dirty.recipientAmount) {
        const recipientCurrency = await Currency.find(transaction.recipientCurrencyId)
        if (recipientCurrency)
          transaction.recipientAmount = Math.round(
            transaction.recipientAmount *
              (recipientCurrency.decimalDigits <= 0
                ? 1
                : Math.pow(10, recipientCurrency.decimalDigits))
          )
      }
    } catch (error) {
      console.log('SAVE TRANSACTION AMOUNT ERROR', error)
    }
  }

  @afterFind()
  static async getSingleTransaction(transaction: Transaction) {
    const senderCurrency = await Currency.find(transaction.senderCurrencyId)
    const receiverCurrency = await Currency.find(transaction.recipientCurrencyId)
    if (senderCurrency) {
      const balance = transaction.senderAmount / Math.pow(10, senderCurrency.decimalDigits)
      transaction.senderAmount = Number.parseFloat(`${balance}`)
    }
    if (receiverCurrency) {
      const balance = transaction.recipientAmount / Math.pow(10, receiverCurrency.decimalDigits)
      transaction.recipientAmount = Number.parseFloat(`${balance}`)
    }
  }

  @afterFetch()
  static async getMultipleTransactions(transactions: Transaction[]) {
    for (const transaction of transactions) {
      const senderCurrency = await Currency.find(transaction.senderCurrencyId)
      const receiverCurrency = await Currency.find(transaction.recipientCurrencyId)
      if (senderCurrency) {
        const balance = transaction.senderAmount / Math.pow(10, senderCurrency.decimalDigits)
        transaction.senderAmount = Number.parseFloat(`${balance}`)
      }
      if (receiverCurrency) {
        const balance = transaction.recipientAmount / Math.pow(10, receiverCurrency.decimalDigits)
        transaction.recipientAmount = Number.parseFloat(`${balance}`)
      }
    }
  }
}
