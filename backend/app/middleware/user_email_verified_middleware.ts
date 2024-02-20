import User from '#models/user'
import { ExceptionHandler, type HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class UserEmailVerifiedMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    /**
     * Middleware logic goes here (before the next call)
     */
    const authUser: User | undefined = ctx.auth.user
    if (authUser && !authUser.verified) {
      const exception = new ExceptionHandler()
      return exception.handle('Unauthorized - email not verified', ctx)
    }
    /**
     * Call next method in the pipeline and return its output
     */
    const output = await next()
    return output
  }
}
