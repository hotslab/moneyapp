import Notification from '#models/notification'
import User from '#models/user'
import { updateNotificationValidator } from '#validators/notification'
import type { HttpContext } from '@adonisjs/core/http'

export default class NotificationsController {
  /**
   * Display a list of resource
   */
  async index({ auth, response }: HttpContext) {
    const authUser: User = auth.getUserOrFail()
    const notifications: Array<Notification> = await Notification.query()
      .where('user_id', authUser.id)
      .orderBy('createdAt', 'desc')
    response.status(200).send({ notifications: notifications })
  }

  async update({ params, response }: HttpContext) {
    const data = { id: params.id }
    const payload = await updateNotificationValidator.validate(data)
    const notification: Notification = await Notification.findOrFail(payload.id)
    notification.read = true
    await notification.save()
    response
      .status(200)
      .send({ message: `Notification marked as read`, notification: notification })
  }
}
