import env from '#start/env'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Server } from 'socket.io'
import NodeRedis from '#services/redis_service'
import { inject } from '@adonisjs/core'

export default class SocketServer extends BaseCommand {
  static commandName = 'socket:server'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  @inject()
  async run(nodeRedis: NodeRedis) {
    const envPort = env.get('SOCKET_PORT')
    const port: number = envPort ? Number.parseInt(envPort) : 4444
    this.logger.info(`${port} This is here`)
    const io = new Server(port, {
      cors: { origin: '*' },
    })
    const redis = await nodeRedis.io()

    io.on('connection', async (socket) => {
      this.logger.info(`Client connedted with id ${socket.id}`)

      socket.on('notification', async (data) => {
        this.logger.info(`Connected client sent => ${JSON.stringify(data)}`)
      })
    })

    io.engine.on('connection_error', (err) => {
      console.log('SOCKET_CONNECTION_ERROR', err.req) // the request object
      console.log('SOCKET_CONNECTION_ERROR', err.code) // the error code, for example 1
      console.log('SOCKET_CONNECTION_ERROR', err.message) // the error message, for example "Session ID unknown"
      console.log('SOCKET_CONNECTION_ERROR', err.context) // some additional error context
    })
    await redis.subscribe('notification', (message, channel) => {
      console.log(message, channel)
      this.logger.info(`Received ${message} from ${channel}`)
      this.logger.info(`SUBSCRIBE => ${message}`)
      io.emit('channel:notification', JSON.parse(message))
    })

    this.logger.info('Started socket server...')
  }
}
