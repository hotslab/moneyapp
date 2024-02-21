import { Queue } from 'bullmq'
import mail from '@adonisjs/mail/services/main'
import VerifyEmailNotification from '#mails/verify_email_notification'
import TransactionEmailNotification from '#mails/transaction_mail_notification'
import EmailTypes from '../types/email_types.js'
import PasswordResetNotification from '#mails/password_reset_notification'
import { MessageBodyTemplates, NodeMailerMessage } from '@adonisjs/mail/types'
import NotificationService from './notification_service.js'
import NotificationTypes from '../types/notification_types.js'

export default class EmailService {
  async queue({ type, emailData }: { type: keyof typeof EmailTypes; emailData: any }) {
    try {
      const emailsQueue = new Queue('emails', {
        connection: {
          host: 'moneyapp_redis',
          port: 6379,
        },
      })
      mail.setMessenger((mailer) => {
        return {
          async queue(mailMessage, config) {
            if (
              EmailTypes.VERIFY_EMAIL === type ||
              EmailTypes.TRANSACTION_EMAIL === type ||
              EmailTypes.PASSWORD_RESET_EMAIL === type
            ) {
              await emailsQueue.add(type, {
                mailMessage,
                config,
                mailerName: mailer.name,
              })
            }
          },
        }
      })

      if (EmailTypes.VERIFY_EMAIL === type)
        await mail.sendLater(
          new VerifyEmailNotification({
            user: emailData.user,
            emailVerifyToken: emailData.emailVerifyToken,
          })
        )
      if (EmailTypes.PASSWORD_RESET_EMAIL === type)
        await mail.sendLater(
          new PasswordResetNotification({
            user: emailData.user,
            passwordResetToken: emailData.passwordResetToken,
          })
        )
      if (EmailTypes.TRANSACTION_EMAIL === type)
        await mail.sendLater(
          new TransactionEmailNotification({
            transaction: emailData.transaction,
            isSender: emailData.isSender,
            isError: emailData.isError,
            errorMessage: emailData.errorMessage,
          })
        )
    } catch (error) {
      console.log('EMAIL SERVICE ERROR', error)
    }
  }

  async sendMail(emailData: {
    mailMessage: {
      message: NodeMailerMessage
      views: MessageBodyTemplates
    }
    config: unknown
    mailerName: any
  }) {
    const { mailMessage, config, mailerName } = emailData
    await mail.use(mailerName).sendCompiled(mailMessage, config)
  }

  async createNotifications(
    eventName: keyof typeof EmailTypes,
    userId: number,
    mailMessage: {
      message: NodeMailerMessage
      views: MessageBodyTemplates
    },
    notificationService: NotificationService
  ) {
    if (EmailTypes.VERIFY_EMAIL === eventName || EmailTypes.PASSWORD_RESET_EMAIL === eventName) {
      let message = ''
      if (EmailTypes.VERIFY_EMAIL === eventName)
        message = `A new email verification link was send to your email address at ${mailMessage.message.to}`
      if (EmailTypes.PASSWORD_RESET_EMAIL === eventName)
        message = `A new password reset link was sent to your email address at ${mailMessage.message.to}`
      notificationService.queue({
        type: NotificationTypes.INSUFFICENT_BALANCE,
        user_id: userId,
        message: message,
      })
    }
  }
}
