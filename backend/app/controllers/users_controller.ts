import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  /**
   * Display a list of resource
   */
  async index({ response }: HttpContext) {
    const users: User[] = await User.all()
    response.status(200).send({ users: users })
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
  async show({ params, response }: HttpContext) {
    const user: User = await User.findOrFail(params.id)
    response.status(200).send({
      user: user,
      accounts: await user.preload('accounts'),
      notifications: await user.preload('notifications'),
    })
  }

  /**
   * Edit individual record
   */
  async edit({ params }: HttpContext) {}

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    user.userName = request.input('user_name')
    user.email = request.input('email')
    await user.save()
    response.status(200).send({ message: `${user.userName} updated successfully` })
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.delete()
    response.status(200).send({ message: `${user.userName} deleted successfully` })
  }
}
