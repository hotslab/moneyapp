import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    password: vine.string().trim().escape().minLength(5),
  })
)

export const registerValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .trim()
      .email()
      .unique(async (db, value) => {
        const user = await db.from('users').where('email', value).first()
        return !user
      }),
    user_name: vine
      .string()
      .trim()
      .escape()
      .minLength(5)
      .unique(async (db, value) => {
        const user = await db.from('users').where('user_name', value).first()
        return !user
      }),
    password: vine.string().trim().escape().minLength(5),
    currency_id: vine.number().positive().withoutDecimals(),
  })
)

export const verifyEmailValidator = vine.compile(
  vine.object({
    token: vine.string().trim().escape(),
  })
)

export const passwordResetLinkValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
  })
)

export const resetPasswordValidator = vine.compile(
  vine.object({
    token: vine.string().trim().escape(),
    password: vine.string().trim().escape().minLength(5),
  })
)
