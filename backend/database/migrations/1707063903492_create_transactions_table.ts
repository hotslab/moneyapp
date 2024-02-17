import { BaseSchema } from '@adonisjs/lucid/schema'
import env from '#start/env'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('idempotency_key').notNullable()
      table.enu('transaction_type', ['DEPOSIT', 'TRANSFER', 'WITHDRAW', 'PAYMENT'], {
        useNative: env.get('POSTGRE_ENUM_USE_NATIVE_TYPE'),
        enumName: 'transaction_types',
        existingType: env.get('POSTGRE_ENUM_EXISTING_TYPE'),
      })
      table.decimal('conversion_rate')

      // sender details
      table.integer('sender_amount').defaultTo(0)
      table
        .integer('sender_currency_id')
        .references('currencies.id')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
      table.string('sender_currency_symbol')
      table
        .integer('sender_account_id')
        .nullable()
        .references('accounts.id')
        .onUpdate('CASCADE')
        .onDelete('SET NULL')
      table.bigInteger('sender_account_number').nullable()
      table.string('sender_name')
      table.string('sender_email')

      // recipient details
      table.integer('recipient_amount').defaultTo(0)
      table
        .integer('recipient_currency_id')
        .references('currencies.id')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
      table.string('recipient_currency_symbol')
      table
        .integer('recipient_account_id')
        .nullable()
        .references('accounts.id')
        .onUpdate('CASCADE')
        .onDelete('SET NULL')
      table.bigInteger('recipient_account_number').nullable()
      table.string('recipient_name')
      table.string('recipient_email')

      // timestamps
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw(`drop type transaction_types`)
  }
}
