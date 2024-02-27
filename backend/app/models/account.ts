import User from '#models/user'
import Currency from '#models/currency'
import Transaction from '#models/transaction'
import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  hasMany,
  beforeSave,
  afterFind,
  afterFetch,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Account extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare currencyId: number

  @column()
  declare amount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Currency)
  declare currency: BelongsTo<typeof Currency>

  @hasMany(() => Transaction, { localKey: 'id', foreignKey: 'senderAccountId' })
  declare sentTransactions: HasMany<typeof Transaction>

  @hasMany(() => Transaction, { foreignKey: 'recipientAccountId' })
  declare receivedTransactions: HasMany<typeof Transaction>

  @beforeSave()
  static async saveAmountAsInteger(account: Account) {
    if (account.$dirty.amount) {
      const currency = await Currency.find(account.currencyId)
      if (currency)
        account.amount = Math.round(
          account.amount * (currency.decimalDigits <= 0 ? 1 : Math.pow(10, currency.decimalDigits))
        )
    }
  }

  @afterFind()
  static async getSingleAccount(account: Account) {
    const currency = await account
      .related('currency')
      .query()
      .where('id', account.currencyId)
      .first()
    if (currency) {
      const balance =
        account.amount / (currency.decimalDigits <= 0 ? 1 : Math.pow(10, currency.decimalDigits))
      account.amount = Number.parseFloat(`${balance}`)
    }
  }

  @afterFetch()
  static async getMultipleAccounts(accounts: Account[]) {
    for (const account of accounts) {
      const currency = await account
        .related('currency')
        .query()
        .where('id', account.currencyId)
        .first()
      if (currency) {
        const balance =
          account.amount / (currency.decimalDigits <= 0 ? 1 : Math.pow(10, currency.decimalDigits))
        account.amount = Number.parseFloat(`${balance}`)
      }
    }
  }
}
