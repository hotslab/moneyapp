/* eslint-disable @adonisjs/prefer-lazy-controller-import */
/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import AuthController from '#controllers/auth_controller'
import UsersController from '#controllers/users_controller'
import AccountsController from '#controllers/accounts_controller'
import TransactionsController from '#controllers/transactions_controller'
import CurrenciesController from '#controllers/currencies_controller'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router
  .group(() => {
    router.post('login', [AuthController, 'login'])
    router.post('register', [AuthController, 'register'])
    router.post('verify-email', [AuthController, 'verifyEmail'])
    router.resource('currencies', CurrenciesController)
  })
  .prefix('/api')

router
  .group(() => {
    router.resource('users', UsersController)
    router.resource('accounts', AccountsController)
    router.resource('transactions', TransactionsController)
  })
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )
  .prefix('/api')
