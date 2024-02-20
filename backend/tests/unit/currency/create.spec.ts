import { test } from '@japa/runner'

import Currency from '#models/currency'
import currencies from '#database/data/currency'
import { DateTime } from 'luxon'

test.group('Currency create', (group) => {
  let currencyData: (typeof currencies)[0]
  let currency: Currency

  group.setup(async () => {
    currencyData = currencies[Math.floor(Math.random() * currencies.length)]

    currency = new Currency()
    currency.code = currencyData.code
    currency.name = currencyData.name
    currency.namePlural = currencyData.name_plural
    currency.symbol = currencyData.symbol
    currency.symbolNative = currencyData.symbol_native
    currency.decimalDigits = currencyData.decimal_digits
    currency.rounding = currencyData.rounding
    await currency.save()
  })

  test('new currency is an instance of Currency model', async ({ expectTypeOf }) => {
    expectTypeOf(currency).toMatchTypeOf<Currency>()
  })

  test('new currency properties types are correct', async ({ expectTypeOf }) => {
    expectTypeOf(currency.code).toEqualTypeOf<string>()
    expectTypeOf(currency.name).toEqualTypeOf<string>()
    expectTypeOf(currency.namePlural).toEqualTypeOf<string>()
    expectTypeOf(currency.symbol).toEqualTypeOf<string>()
    expectTypeOf(currency.symbolNative).toEqualTypeOf<string>()
    expectTypeOf(currency.decimalDigits).toEqualTypeOf<number>()
    expectTypeOf(currency.rounding).toEqualTypeOf<number>()
    expectTypeOf(currency.createdAt).toEqualTypeOf<DateTime>()
    expectTypeOf(currency.createdAt).toEqualTypeOf<DateTime>()
  })

  test('new currency properties match data', async ({ assert }) => {
    assert.equal(currency.code, currencyData.code)
    assert.equal(currency.name, currencyData.name)
    assert.equal(currency.namePlural, currencyData.name_plural)
    assert.equal(currency.symbol, currencyData.symbol)
    assert.equal(currency.symbolNative, currencyData.symbol_native)
    assert.equal(currency.decimalDigits, currencyData.decimal_digits)
    assert.equal(currency.rounding, currencyData.rounding)
  })

  test('rejects duplicate currency records', async ({ assert }) => {
    try {
      await Currency.create(currencyData)
    } catch (error) {
      assert.equal(error.name, 'error')
      assert.match(error.message, /duplicate key/g)
      assert.match(error.message, /unique/g)
    }
  })
})
