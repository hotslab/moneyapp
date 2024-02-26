import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema
      .createTable(this.tableName, (table) => {
        table.increments('id')
        table.string('idempotency_key').notNullable().unique()
        table.decimal('conversion_rate', 12, 6)

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
      .raw(
        `
        DO $$
          BEGIN
            IF NOT EXISTS (SELECT * FROM pg_type WHERE typname = 'transaction_types') THEN
              create type transaction_types AS ENUM ('DEPOSIT', 'WITHDRAW', 'TRANSFER', 'PAYMENT');
            END IF;
          END
        $$
        `
      )
      .raw('ALTER TABLE transactions ADD transaction_type transaction_types NOT NULL')
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw(`DROP TYPE IF EXISTS transaction_types`)
  }
}
