import vine from '@vinejs/vine'
import { currencyCodeRule } from './rules/currency.js'

export const currencyConversionValidator = vine.compile(
  vine.object({
    amount: vine.number().positive().decimal([0, 2]),
    senderCurrencyCode: vine.string().trim().escape().use(currencyCodeRule({})),
    receiverCurrencyCode: vine.string().trim().escape().use(currencyCodeRule({})),
  })
)
