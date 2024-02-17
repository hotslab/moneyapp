import { Queue } from 'bullmq'
import mail from '@adonisjs/mail/services/main'
import VerifyEmailNotification from '#mails/verify_email_notification'
import TransactionEmailNotification from '#mails/transaction_mail_notification'
import EmailTypes from '../types/email_types.js'
import PasswordResetNotification from '#mails/password_reset_notification'

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
}
