import vine from '@vinejs/vine'

export const indexAccountValidator = vine.compile(
  vine.object({
    id: vine.number().positive().withoutDecimals(),
  })
)

export const storeAccountValidator = vine.compile(
  vine.object({
    currency_id: vine.number().positive().withoutDecimals(),
  })
)

export const showAccountValidator = vine.compile(
  vine.object({
    id: vine.number().positive().withoutDecimals(),
  })
)

export const deleteAccountValidator = vine.compile(
  vine.object({
    id: vine.number().positive().withoutDecimals(),
  })
)
