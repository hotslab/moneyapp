import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'currencies'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('code').notNullable().unique()
      table.string('name').notNullable()
      table.string('name_plural').notNullable()
      table.text('symbol').notNullable()
      table.text('symbol_native').notNullable()
      table.integer('decimal_digits').notNullable()
      table.integer('rounding').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}