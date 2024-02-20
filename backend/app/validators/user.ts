import vine from '@vinejs/vine'

export const showUserValidator = vine.compile(
  vine.object({
    id: vine.number().positive().withoutDecimals(),
  })
)

export const updateUserValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .trim()
      .email()
      .unique(async (db, value, field) => {
        const user = await db
          .from('users')
          .whereNot('id', field.meta.userId)
          .where('email', value)
          .first()
        return !user
      }),
    user_name: vine
      .string()
      .trim()
      .escape()
      .minLength(5)
      .unique(async (db, value, field) => {
        const user = await db
          .from('users')
          .whereNot('id', field.meta.userId)
          .where('user_name', value)
          .first()
        return !user
      }),
    password: vine.string().trim().escape().minLength(5).optional(),
  })
)

export const deleteUserValidator = vine.compile(
  vine.object({
    id: vine.number().positive().withoutDecimals(),
  })
)
