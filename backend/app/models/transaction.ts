import Account from '#models/account'
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeSave } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Currency from './currency.js'
import { LucidRow } from '@adonisjs/lucid/types/model'

export default class Transaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare idempotencyKey: string

  @column()
  declare transactionType: string

  @column()
  declare conversionRate: number

  // sender details
  @column({
    serialize: (value: number, attribute: string, model: LucidRow) => {
      if (value) {
        let relations = model.serializeRelations()
        console.log('SENDER', relations)
        const balance = value / Math.pow(10, relations.senderCurrency.decimalDigits)
        return Number.parseFloat(`${balance}`).toFixed(2)
      } else return value
    },
  })
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
  @column({
    serialize: (value: number, attribute: string, model: LucidRow) => {
      if (value) {
        let relations = model.serializeRelations()
        console.log('RECEIVER', relations)
        const balance = value / Math.pow(10, relations.recipientCurrency.decimalDigits)
        return Number.parseFloat(`${balance}`).toFixed(2)
      } else return value
    },
  })
  declare recipientAmount: number

  @column()
  declare recipientCurrencyId: number

  @column()
  declare recipienCurrencySymbol: string

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

  @belongsTo(() => Currency, { localKey: 'senderCurrencyId' })
  declare senderCurrency: BelongsTo<typeof Currency>

  @belongsTo(() => Currency, { localKey: 'recipientCurrencyId' })
  declare recipientCurrency: BelongsTo<typeof Currency>

  @belongsTo(() => Account, { localKey: 'senderAccountId' })
  declare senderAccount: BelongsTo<typeof Account>

  @belongsTo(() => Account, { localKey: 'recipientAccountId' })
  declare recipientAccount: BelongsTo<typeof Account>

  @beforeSave()
  static async saveAmountAsInteger(transaction: Transaction) {
    if (transaction.$dirty.senderAmount) {
      await transaction.load('senderCurrency')
      transaction.senderAmount =
        transaction.senderAmount * Math.pow(10, transaction.senderCurrency.decimalDigits)
    }
    if (transaction.$dirty.recipientAmount) {
      await transaction.load('recipientCurrency')
      transaction.recipientAmount =
        transaction.recipientAmount * Math.pow(10, transaction.recipientCurrency.decimalDigits)
    }
  }
}
