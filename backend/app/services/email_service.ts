import { Queue } from 'bullmq'
import mail from '@adonisjs/mail/services/main'
import VerifyEmailNotification from '#mails/verify_email_notification'
import TransactionEmailNotification from '#mails/transaction_mail_notification'

enum EmailTypes {
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  TRANSACTION_EMAIL = 'TRANSACTION_EMAIL',
}

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
            if (EmailTypes.VERIFY_EMAIL === type)
              await emailsQueue.add('verify_email', {
                mailMessage,
                config,
                mailerName: mailer.name,
              })
            if (EmailTypes.TRANSACTION_EMAIL === type)
              await emailsQueue.add('transaction_email', {
                mailMessage,
                config,
                mailerName: mailer.name,
              })
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
