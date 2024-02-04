import Transaction from '#models/transaction'
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Reversal extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare idempotencyKey: string

  @column()
  declare tranasctionId: number

  @column()
  declare amount: number

  @column()
  declare accountId: number

  @column()
  declare senderId: number

  @column()
  declare receiverId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Transaction)
  declare transaction: BelongsTo<typeof Transaction>
}
