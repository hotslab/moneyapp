import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class UserEmailVerifiedMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    /**
     * Middleware logic goes here (before the next call)
     */
    const authUser: User | undefined = ctx.auth.user
    // if (authUser) {}
    console.log('MIDDLEWARE', authUser)

    /**
     * Call next method in the pipeline and return its output
     */
    const output = await next()
    return output
  }
}
