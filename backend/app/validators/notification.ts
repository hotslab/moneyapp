import vine from '@vinejs/vine'

export const updateNotificationValidator = vine.compile(
  vine.object({
    id: vine.number().positive().withoutDecimals(),
  })
)
