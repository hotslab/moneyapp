import Account from '#models/account'
import Reversal from '#models/account'
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Transaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare idempotencyKey: string

  @column()
  declare accountId: number

  @column()
  declare amount: number

  @column()
  declare senderId: number

  @column()
  declare receiverId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Account)
  declare account: BelongsTo<typeof Account>

  @hasMany(() => Reversal)
  declare reversals: HasMany<typeof Reversal>
}
