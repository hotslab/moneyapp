import currencies from '#database/data/currency'
import Currency from '#models/currency'
import User from '#models/user'
import { faker } from '@faker-js/faker'
import { test } from '@japa/runner'

test.group('User delete', (group) => {
  let currencyData: (typeof currencies)[0]
  let currency: Currency
  group.setup(async () => {
    currencyData = currencies[Math.floor(Math.random() * currencies.length)]
    currency = await Currency.firstOrCreate(currencyData)
    await currency.save()
    return async () => {
      await User.query().delete()
      await Currency.query().delete()
    }
  })
  test('user is deleted successfully', async ({ assert }) => {
    let user: User = await User.create({
      userName: faker.person.fullName(),
      email: faker.internet.email({ firstName: faker.person.firstName() }),
      password: faker.internet.password({ length: 20, memorable: true }),
    })
    user = await User.findOrFail(user.id)
    assert.exists(user)
    await user.delete()
    const exists: User | null = await User.find(user.id)
    assert.notExists(exists)
  })
})
