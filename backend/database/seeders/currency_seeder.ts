import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Currency from '#models/currency'
import currencies from '#database/data/currency'

export default class extends BaseSeeder {
  static environment = ['production', 'development', 'testing']
  async run() {
    await Currency.updateOrCreateMany('code', currencies)
  }
}
