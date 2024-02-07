import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('idempotency_key').notNullable()
      table.integer('currency_id').references('currencies.id')
      table.integer('amount').defaultTo(0)
      table
        .integer('sender_account_id')
        .nullable()
        .references('accounts.id')
        .onUpdate('CASCADE')
        .onDelete('SET NULL')
      table.integer('sender_account_number')
      table.string('sender_name')
      table.string('sender_email')
      table
        .integer('recipient_account_id')
        .nullable()
        .references('accounts.id')
        .onUpdate('CASCADE')
        .onDelete('SET NULL')
      table.integer('recipient_account_number')
      table.string('recipient_name')
      table.string('recipient_email')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
