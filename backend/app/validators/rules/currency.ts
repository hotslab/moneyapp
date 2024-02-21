import Currency from '#models/currency'
import vine from '@vinejs/vine'
import { FieldContext } from '@vinejs/vine/types'

/**
 * Options accepted by the unique rule
 */

/**
 * Implementation
 */
async function currencyCode(value: unknown, _options: {}, field: FieldContext) {
  /**
   * We do not want to deal with non-string
   * values. The "string" rule will handle the
   * the validation.
   */
  if (typeof value !== 'string') return
  const row = await Currency.findBy('code', value)
  if (!row) {
    field.report(
      `The currency code '${value}' for {{ field }} field is not valid or accepted by the system`,
      'error',
      field
    )
  }
}

export const currencyCodeRule = vine.createRule(currencyCode)
