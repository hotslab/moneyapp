import User from '#models/user'
import Currency from '#models/currency'
import Transaction from '#models/transaction'
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, beforeSave } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { LucidRow } from '@adonisjs/lucid/types/model'

export default class Account extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare currencyId: number

  @column({
    serialize: (value: number, attribute: string, model: LucidRow) => {
      if (value) {
        let relations = model.serializeRelations()
        console.log('ACCOUNT SERIAL', relations)
        const balance = value / Math.pow(10, relations.currency.decimalDigits)
        return Number.parseFloat(`${balance}`).toFixed(2)
      } else return value
    },
  })
  declare amount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Currency)
  declare currency: BelongsTo<typeof Currency>

  @hasMany(() => Transaction, { foreignKey: 'senderAccountId' })
  declare sentTransactions: HasMany<typeof Transaction>

  @hasMany(() => Transaction, { foreignKey: 'recipientAccountId' })
  declare receivedTransactions: HasMany<typeof Transaction>

  @beforeSave()
  static async saveAmountAsInteger(account: Account) {
    if (account.$dirty.amount) {
      console.log('beforeSave INVOKED', account.amount)
      await account.load('currency')
      const a = Number.parseFloat(`${account.amount}`)
      account.amount = a * Math.pow(10, account.currency.decimalDigits)
    }
  }
}
