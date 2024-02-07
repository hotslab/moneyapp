import User from '#models/user'
import Currency from '#models/currency'
import Transaction from '#models/transaction'
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
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

  @hasMany(() => Transaction, { foreignKey: 'senderAccountId' })
  declare sentTransactions: HasMany<typeof Transaction>

  @hasMany(() => Transaction, { foreignKey: 'recipientAccountId' })
  declare receivedTransactions: HasMany<typeof Transaction>
}
