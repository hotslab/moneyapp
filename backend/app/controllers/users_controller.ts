import User from '#models/user'
import { deleteUserValidator, showUserValidator, updateUserValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  async index({ auth, response }: HttpContext) {
    const authUser: User = auth.getUserOrFail()
    const users: Array<User> = await User.query().preload('accounts').whereNot('id', authUser.id)
    response.status(200).send({ users: users })
  }

  async update({ params, request, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const payload = await request.validateUsing(updateUserValidator, {
      meta: {
        userId: user.id,
      },
    })
    user.userName = payload.user_name
    user.email = payload.email
    if (payload.password) user.password = payload.password
    await user.save()
    response.status(200).send({ message: `${user.userName} updated successfully`, user: user })
  }

  async destroy({ params, response }: HttpContext) {
    const data = { id: params.id }
    const payload = await deleteUserValidator.validate(data)
    const user = await User.findOrFail(payload.id)
    await user.delete()
    response.status(200).send({ message: `${user.userName} deleted successfully` })
  }
}
