import React, { useEffect, useState } from "react";
import axiosApi from "../api";
import { NavigateFunction, useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import useEventEmitter from "../helpers/useEventEmitter";

function Transactions() {
  const { dispatch } = useEventEmitter();
  const { accountId } = useParams();
  const navigate: NavigateFunction = useNavigate();
  let [authUser, setAuthUser] = useState<any>(null);
  let [transactions, setTransactions] = useState<Array<any>>([]);

  function goBack() {
    navigate(`/accounts/${accountId}`);
  }

  useEffect(() => {
    setAuthUser(JSON.parse(sessionStorage.getItem("authUser") as string));
    dispatch("show_loading", true);
    axiosApi.get(`api/transactions?account_id=${accountId}`).then(
      (response) => {
        setTransactions(response.data.transactions);
        dispatch("show_loading", false);
      },
      (error) => {
        console.log(error);
        dispatch("show_loading", false);
      }
    );
  }, []);

  return (
    <>
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
      <main>
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
                          transaction.senderAccountId === accountId
                            ? "text-red-700"
                            : "text-green-700"
                        )}
                      >
                        {transaction.senderAccountId === accountId
                          ? "Sent"
                          : "Received"}
                      </span>
                    </th>
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                    >
                      {transaction.currency.name} {transaction.amount}
                    </th>
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                    >
                      {transaction.senderAccountId === accountId
                        ? transaction.recipientName
                        : transaction.senderName}
                    </th>
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                    >
                      {transaction.senderAccountId === accountId
                        ? transaction.recipientEmail
                        : transaction.senderEmail}
                    </th>
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                    >
                      {transaction.senderAccountId === accountId
                        ? transaction.recipientAccountNumber
                        : transaction.senderAccountNumber}
                    </th>
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
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
    </>
  );
}

export default Transactions;
