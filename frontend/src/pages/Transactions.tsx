import { useEffect, useState } from "react";
import axiosApi from "../api";
import { NavigateFunction, useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import transactionTypes from "../types/transactionTypes";
import Loading from "../components/Loading";

function Transactions() {
  const { accountId } = useParams();
  const navigate: NavigateFunction = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  let [authUser, setAuthUser] = useState<any>(null);
  let [transactions, setTransactions] = useState<Array<any>>([]);

  function goBack() {
    navigate(`/accounts/${authUser.user.id}`);
  }

  function isSenderPayment(senderId: string, transactionType: string): boolean {
    return (
      transactionType === transactionTypes.PAYMENT &&
      Number.parseInt(senderId) === Number.parseInt(accountId as string)
    );
  }
  function isReceiverPayment(
    receiverId: string,
    transactionType: string
  ): boolean {
    return (
      transactionType === transactionTypes.PAYMENT &&
      Number.parseInt(receiverId) === Number.parseInt(accountId as string)
    );
  }
  function isSenderTransfer(
    senderId: string,
    transactionType: string
  ): boolean {
    return (
      transactionType === transactionTypes.TRANSFER &&
      Number.parseInt(senderId) === Number.parseInt(accountId as string)
    );
  }
  function isReceiverTransfer(
    receiverId: string,
    transactionType: string
  ): boolean {
    return (
      transactionType === transactionTypes.TRANSFER &&
      Number.parseInt(receiverId) === Number.parseInt(accountId as string)
    );
  }

  useEffect(() => {
    setAuthUser(JSON.parse(sessionStorage.getItem("authUser") as string));
    setLoading(true)
    axiosApi.get(`api/transactions?account_id=${accountId}`).then(
      (response) => {
        setTransactions(response.data.transactions);
        setLoading(false);
      },
      (error) => {
        console.log(error);
        setLoading(false);
      }
    );
  }, []);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div>
          <header className="bg-white shadow">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                Account <span className="text-green-600">No. {accountId}</span>{" "}
                History{" - "}
                <span className="text-blue-600">{transactions.length}</span>
              </h1>
              <button
                type="submit"
                onClick={goBack}
                className="bg-red-600 rounded p-1 text-white font-semibold text-sm hover:bg-red-500"
              >
                Back
              </button>
            </div>
          </header>
          <main className="mx-4">
            <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
              <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-200 uppercase bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Account No.
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Conversion Rate
                      </th>
                      <th scope="col" className="px-6 py-3 text-right">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction, index) => (
                      <tr
                        key={index}
                        className="bg-white border-b hover:bg-gray-200"
                      >
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                        >
                          <span
                            className={clsx(
                              transaction.transactionType ===
                                transactionTypes.WITHDRAW && "text-red-700",
                              isSenderPayment(
                                transaction.senderAccountNumber,
                                transaction.transactionType
                              ) && "text-red-700",
                              transaction.transactionType ===
                                transactionTypes.DEPOSIT && "text-green-700",
                              isReceiverPayment(
                                transaction.recipientAccountNumber,
                                transaction.transactionType
                              ) && "text-green-700",
                              isSenderTransfer(
                                transaction.senderAccountNumber,
                                transaction.transactionType
                              ) && "text-red-700",
                              isReceiverTransfer(
                                transaction.recipientAccountNumber,
                                transaction.transactionType
                              ) && "text-green-700"
                            )}
                          >
                            {transaction.transactionType}
                          </span>
                        </th>
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                        >
                          {isSenderPayment(
                            transaction.senderAccountNumber,
                            transaction.transactionType
                          ) &&
                            `
                      ${transaction.senderCurrencySymbol} 
                      ${Number.parseFloat(transaction.senderAmount).toFixed(
                        2
                      )}`}
                          {transaction.transactionType ===
                            transactionTypes.WITHDRAW &&
                            `
                        ${transaction.senderCurrencySymbol} 
                      ${Number.parseFloat(transaction.senderAmount).toFixed(2)}
                        `}
                          {isReceiverPayment(
                            transaction.recipientAccountNumber,
                            transaction.transactionType
                          ) &&
                            `
                      ${transaction.recipientCurrencySymbol} 
                      ${Number.parseFloat(transaction.recipientAmount).toFixed(
                        2
                      )}`}
                          {transaction.transactionType ===
                            transactionTypes.DEPOSIT &&
                            `
                        ${transaction.recipientCurrencySymbol} 
                      ${Number.parseFloat(transaction.recipientAmount).toFixed(
                        2
                      )}
                        `}
                          {isSenderTransfer(
                            transaction.senderAccountNumber,
                            transaction.transactionType
                          ) &&
                            `${transaction.senderCurrencySymbol} 
                      ${Number.parseFloat(transaction.senderAmount).toFixed(
                        2
                      )}`}
                          {isReceiverTransfer(
                            transaction.recipientAccountNumber,
                            transaction.transactionType
                          ) &&
                            `${transaction.recipientCurrencySymbol} 
                      ${Number.parseFloat(transaction.recipientAmount).toFixed(
                        2
                      )}`}
                        </th>
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap capitalize"
                        >
                          {isReceiverPayment(
                            transaction.recipientAccountNumber,
                            transaction.transactionType
                          ) && transaction.senderName}
                          {transaction.transactionType ===
                            transactionTypes.DEPOSIT && transaction.senderName}
                          {isSenderPayment(
                            transaction.senderAccountNumber,
                            transaction.transactionType
                          ) && transaction.recipientName}
                          {transaction.transactionType ===
                            transactionTypes.WITHDRAW && transaction.senderName}
                          {isSenderTransfer(
                            transaction.senderAccountNumber,
                            transaction.transactionType
                          ) && transaction.senderName}
                          {isReceiverTransfer(
                            transaction.recipientAccountNumber,
                            transaction.transactionType
                          ) && transaction.recipientName}
                        </th>
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                        >
                          {transaction.transactionType ===
                            transactionTypes.DEPOSIT && transaction.senderEmail}
                          {isReceiverPayment(
                            transaction.recipientAccountNumber,
                            transaction.transactionType
                          ) && transaction.senderEmail}
                          {transaction.transactionType ===
                            transactionTypes.WITHDRAW &&
                            transaction.senderEmail}
                          {isSenderPayment(
                            transaction.senderAccountNumber,
                            transaction.transactionType
                          ) && transaction.recipientEmail}
                          {isSenderTransfer(
                            transaction.senderAccountNumber,
                            transaction.transactionType
                          ) && transaction.recipientEmail}
                          {isReceiverTransfer(
                            transaction.recipientAccountNumber,
                            transaction.transactionType
                          ) && transaction.senderEmail}
                        </th>
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                        >
                          {transaction.transactionType ===
                            transactionTypes.DEPOSIT &&
                            transaction.senderAccountNumber}
                          {isReceiverPayment(
                            transaction.recipientAccountNumber,
                            transaction.transactionType
                          ) && transaction.senderAccountNumber}
                          {transaction.transactionType ===
                            transactionTypes.WITHDRAW &&
                            transaction.recipientAccountNumber}
                          {isSenderPayment(
                            transaction.senderAccountNumber,
                            transaction.transactionType
                          ) && transaction.recipientAccountNumber}
                          {isSenderTransfer(
                            transaction.senderAccountNumber,
                            transaction.transactionType
                          ) && transaction.recipientAccountNumber}
                          {isReceiverTransfer(
                            transaction.recipientAccountNumber,
                            transaction.transactionType
                          ) && transaction.senderAccountNumber}
                        </th>
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-right text-gray-900 whitespace-nowrap"
                        >
                          {transaction.conversionRate}
                        </th>
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-right text-gray-900 whitespace-nowrap"
                        >
                          {transaction.createdAt}
                        </th>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transactions.length === 0 && (
                  <div className="w-full text-2xl text-gray-700 py-6 flex justify-center items-center">
                    <span>No records found</span>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      )}
    </>
  );
}

export default Transactions;
