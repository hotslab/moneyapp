import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('idempotency_key').notNullable()
      table.bigInteger('amount').defaultTo(0)
      table.bigInteger('account_id').references('accounts.id')
      table.bigInteger('sender_id').references('users.id')
      table.bigInteger('receiver_id').references('users.id')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
