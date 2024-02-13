import env from '#start/env'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Server } from 'socket.io'
import ioredis from '#services/redis_service'

export default class NotificationQueue extends BaseCommand {
  static commandName = 'socket:server'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  async run() {
    const port: string | undefined = env.get('REDIS_HOST')
    console.log(port)
    const io = new Server(4444, {
      cors: { origin: '*' },
    })

    io.on('connection', async (socket) => {
      this.logger.info(`Client connedted with id ${socket.id}`)
      socket.on('notification', (data) =>
        this.logger.info(`Connected client sent => ${JSON.stringify(data)}`)
      )
    })

    ioredis.subscribe('notification', (err, count) => {
      if (err) this.logger.error(`Failed to subscribe: ${err.message}`)
      else
        this.logger.info(
          `Subscribed successfully! This client is currently subscribed to ${count} channels.`
        )
    })

    ioredis.on('message', (channel, message) => {
      this.logger.info(`Received ${message} from ${channel}`)
      this.logger.info(`SUBSCRIBE => ${message}`)
      io.emit('channel:notification', JSON.parse(message))
    })

    this.logger.info('Started socket server...')
  }
}
