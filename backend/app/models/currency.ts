import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Transaction from './transaction.js'

export default class Currency extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare name: string

  @column()
  declare namePlural: string

  @column()
  declare symbol: string

  @column()
  declare symbolNative: string

  @column()
  declare decimalDigits: number

  @column()
  declare rounding: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Transaction, {
    foreignKey: 'senderCurrencyId',
  })
  declare senderTransactions: HasMany<typeof Transaction>
}
