import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  private async runSeeder(Seeder: { default: typeof BaseSeeder }) {
    /**
     * Do not run when not in a environment specified in Seeder
     */
    if (
      (!Seeder.default.environment.includes('development') && app.inDev) ||
      (!Seeder.default.environment.includes('testing') && app.inTest) ||
      (!Seeder.default.environment.includes('production') && app.inProduction)
    ) {
      return
    }

    await new Seeder.default(this.client).run()
  }

  async run() {
    await this.runSeeder(await import('../currency_seeder.js'))
    await this.runSeeder(await import('../user_seeder.js'))
  }
}
