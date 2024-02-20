import vine from '@vinejs/vine'

export const indexTransactionValidator = vine.compile(
  vine.object({
    account_id: vine.number().positive().withoutDecimals(),
  })
)

export const storeTransactionValidator = vine.compile(
  vine.object({
    idempotency_key: vine.string().trim().escape(),
    transaction_type: vine.string().trim().escape(),
    conversion_rate: vine.number().positive(),
    // sender details
    sender_amount: vine.number().positive().decimal([0, 2]),
    sender_currency_id: vine.number().positive().withoutDecimals(),
    sender_currency_symbol: vine.string().trim().escape(),
    sender_account_id: vine.number().positive().withoutDecimals().nullable(),
    sender_account_number: vine.number().positive().withoutDecimals(),
    sender_name: vine.string().trim().escape(),
    sender_email: vine.string().trim().email().escape(),
    // recipient details
    recipient_amount: vine.number().positive().decimal([0, 2]),
    recipient_currency_id: vine.number().positive().withoutDecimals(),
    recipient_currency_symbol: vine.string().trim().escape(),
    recipient_account_id: vine.number().positive().withoutDecimals().nullable(),
    recipient_account_number: vine.number().positive().withoutDecimals(),
    recipient_name: vine.string().trim().escape(),
    recipient_email: vine.string().trim().email().escape(),
  })
)

export const storeTransactionExtraFieldsValidator = vine.compile(
  vine.object({
    auth_user_id: vine.number().positive().withoutDecimals(),
    receiver_user_id: vine.number().positive().withoutDecimals().nullable(),
  })
)
