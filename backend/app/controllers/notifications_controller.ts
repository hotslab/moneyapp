import Notification from '#models/notification'
import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class NotificationsController {
  /**
   * Display a list of resource
   */
  async index({ auth, request, response }: HttpContext) {
    const authUser: User = auth.getUserOrFail()
    const notifications: Array<Notification> = await Notification.query()
      .where((query) => {
        query.where('user_id', authUser.id)
        if (request.input('unread')) query.where('read', 1)
      })
      .orderBy('createdAt', 'desc')
    response.status(200).send({ notifications: notifications })
  }

  /**
   * Display form to create a new record
   */
  async create({}: HttpContext) {}

  /**
   * Handle form submission for the create action
   */
  async store({ request }: HttpContext) {}

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {}

  /**
   * Edit individual record
   */
  async edit({ params }: HttpContext) {}

  /**
   * Handle form submission for the edit action
   */
  async update({ params, response }: HttpContext) {
    const notification: Notification = await Notification.findOrFail(params.id)
    notification.read = true
    await notification.save()
    response.status(200).send({ message: `Notifiction marked as read`, notification: notification })
  }

  /**
   * Delete record
   */
  async destroy({ params }: HttpContext) {}
}
