import Account from '#models/account'
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Currency from './currency.js'

export default class Transaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare idempotencyKey: string

  @column()
  declare currencyId: number

  @column()
  declare amount: number

  @column()
  declare senderAccountId: number

  @column()
  declare senderAccountNumber: number

  @column()
  declare senderName: string

  @column()
  declare senderEmail: string

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

  @belongsTo(() => Currency)
  declare currency: BelongsTo<typeof Currency>

  @belongsTo(() => Account, { localKey: 'senderAccountId' })
  declare senderAccount: BelongsTo<typeof Account>

  @belongsTo(() => Account, { localKey: 'recipientAccountId' })
  declare recipientAccount: BelongsTo<typeof Account>
}
