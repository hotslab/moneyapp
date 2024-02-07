import { Queue } from 'bullmq'

export default class TransactionService {
  async queue(transactionData: {
    idempotency_key: string
    currency_id: number
    amount: number
    sender_account_id: number
    sender_account_number: number
    sender_name: string
    sender_email: string
    recipient_account_id: number
    recipient_account_number: number
    recipient_name: string
    recipient_email: string
  }) {
    const transactionQueue = new Queue('transactions', {
      connection: {
        host: 'moneyapp_redis',
        port: 6379,
      },
    })
    await transactionQueue.add('create_transaction', transactionData)
  }
}
