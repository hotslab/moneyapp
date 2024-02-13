import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('idempotency_key').notNullable()
      table.enu('transaction_type', ['DEPOSIT', 'TRANSFER', 'WITHDRAW'], {
        useNative: true,
        enumName: 'transaction_types',
        existingType: false,
      })
      table.decimal('conversion_rate')

      // sender details
      table.integer('sender_amount').defaultTo(0)
      table.integer('sender_currency_id').references('currencies.id')
      table.string('sender_currency_symbol')
      table
        .integer('sender_account_id')
        .nullable()
        .references('accounts.id')
        .onUpdate('CASCADE')
        .onDelete('SET NULL')
      table.integer('sender_account_number').nullable()
      table.string('sender_name')
      table.string('sender_email')

      // recipient details
      table.integer('recipient_amount').defaultTo(0)
      table.integer('recipient_currency_id').references('currencies.id')
      table.string('recipient_currency_symbol')
      table
        .integer('recipient_account_id')
        .nullable()
        .references('accounts.id')
        .onUpdate('CASCADE')
        .onDelete('SET NULL')
      table.integer('recipient_account_number').nullable()
      table.string('recipient_name')
      table.string('recipient_email')

      // timestamps
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
