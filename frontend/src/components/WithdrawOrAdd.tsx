import { useEffect, useState } from "react";
import useValidator from "../services/useValidator";
import axiosApi from "../api";
import useEventEmitter from "../services/useEventEmitter";
import { AxiosError, AxiosResponse } from "axios";
import Spinner from "./Spinner";
import transactionTypes from "../types/transactionTypes";
import MessageTypes from "../types/messageTypes";
import EmitterEvents from "../types/emitterEvents";
import parseAxiosError from "../services/useParseAxiosError";

function WithdrawOrAdd({
  authUser,
  account,
  closeWithdrawOrAddModal,
}: {
  authUser: any;
  account: any;
  closeWithdrawOrAddModal: Function;
}) {
  const { dispatch } = useEventEmitter();
  const [validator] = useValidator();
  const actionTypes: Array<string> = ["DEPOSIT", "WITHDRAW"];
  const [loading, setLoading] = useState<boolean>(false);
  const [bankAccountNumber, setBankAccountNumber] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [action, setAction] =
    useState<keyof typeof transactionTypes>("DEPOSIT");
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  function showValidator() {
    validator.current.showMessageFor("amount");
  }

  function submit() {
    if (validator.current.allValid()) {
      if (
        transactionTypes.WITHDRAW === action &&
        Number.parseFloat(account.amount) < Number.parseFloat(amount)
      )
        return dispatch(EmitterEvents.SHOW_NOTIFICATION, {
          message: "Your balance is insufficient",
          type: MessageTypes.error,
        });
      setLoading(true);
      axiosApi
        .post(
          `/api/transactions`,
          {
            transaction_type: action,
            conversion_rate: 1,
            // sender details
            sender_amount: Number.parseFloat(`${amount}`).toFixed(2),
            sender_currency_id: account.currency.id,
            sender_currency_symbol: account.currency.symbol,
            sender_account_id:
              action === transactionTypes.DEPOSIT ? null : account.id,
            sender_account_number:
              action === transactionTypes.DEPOSIT
                ? bankAccountNumber
                : account.id,
            sender_name: userName,
            sender_email: email,
            // recipient details
            recipient_amount: Number.parseFloat(`${amount}`).toFixed(2),
            recipient_currency_id: account.currency.id,
            recipient_currency_symbol: account.currency.symbol,
            recipient_account_id:
              action === transactionTypes.WITHDRAW ? null : account.id,
            recipient_account_number:
              action === transactionTypes.WITHDRAW
                ? bankAccountNumber
                : account.id,
            recipient_name: authUser.user.userName,
            recipient_email: authUser.user.email,
          },
          {
            headers: {
              idempotencyKey: idempotencyKey,
            },
          }
        )
        .then(
          (response: AxiosResponse) => {
            setLoading(false);
            dispatch(EmitterEvents.SHOW_NOTIFICATION, {
              message: `Transaction was sent for processing. Please wait for notification via email or 
                on this app when it has been successfully processed. Your account blance will 
                then reflect the changes if it succeeded`,
              type: MessageTypes.info,
            });
            closeWithdrawOrAddModal(true);
          },
          (error) => {
            const message = parseAxiosError(error);
            dispatch(EmitterEvents.SHOW_NOTIFICATION, {
              message: message,
              type: MessageTypes.error,
            });
            setLoading(false);
          }
        );
    } else validator.current.showMessages();
  }

  function getIdempotencyKey() {
    setLoading(true);
    axiosApi.get(`/api/transaction-key`).then(
      (response: AxiosResponse) => {
        setIdempotencyKey(response.data.idempotency_key);
        setLoading(false);
      },
      (error: AxiosError) => {
        const message = parseAxiosError(error);
        dispatch(EmitterEvents.SHOW_NOTIFICATION, {
          message: message,
          type: MessageTypes.error,
        });
        setLoading(false);
        closeWithdrawOrAddModal();
      }
    );
  }

  useEffect(() => {
    getIdempotencyKey();
  }, []);

  return (
    <>
      <div
        className="relative z-10"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            {!loading ? (
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-full sm:w-5/6 md:w-4/6 lg:w-3/6 sm:mx-6">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left divide-y divide-gray-300">
                      <h1
                        className="text-xl capitalize mb-3 font-semibold leading-6 text-gray-700 mb-3"
                        id="modal-title"
                      >
                        Deposit or Withdraw from Account No. {account.id}
                      </h1>
                      <p className="text-3xl font-semibold my-4 leading-6 text-gray-500 py-3">
                        Balance Available:
                      </p>
                      <p className="text-3xl font-semibold my-4 leading-6 text-gray-500 py-3">
                        <span className="text-green-700">
                          {account.currency.symbol} {account.amount || 0}
                        </span>
                      </p>
                      <div className="mt-2 py-3">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                          Bank Account Number <span className="text-gray-500">e.g. 242342342342342</span>
                        </label>
                        <div className="mt-2">
                          <input
                            type="text"
                            value={bankAccountNumber}
                            onChange={(e) =>
                              setBankAccountNumber(e.target.value)
                            }
                            className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          ></input>
                          <span className="text-red-700">
                            {validator.current.message(
                              "bankAccountNumber",
                              bankAccountNumber,
                              "required|numeric|size:15"
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 py-3">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                          Email address
                        </label>
                        <div className="mt-2">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          ></input>
                          <span className="text-red-700">
                            {validator.current.message(
                              "email",
                              email,
                              "required|email"
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 py-3">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                          Name
                        </label>
                        <div className="mt-2">
                          <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          ></input>
                          <span className="text-red-700">
                            {validator.current.message(
                              "userName",
                              userName,
                              "required|min:5"
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 py-3">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                          Enter Amount
                        </label>
                        <div className="mt-3">
                          <input
                            type="number"
                            value={amount}
                            onBlur={() => showValidator()}
                            onChange={(e) => setAmount(e.target.value)}
                            className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          ></input>
                          <span className="text-red-700">
                            {validator.current.message(
                              "amount",
                              amount,
                              "required|numeric|min:1,num|currency"
                            )}
                          </span>
                        </div>
                        <div className="mt-3 py-3">
                          <label className="block text-sm font-medium leading-6 text-gray-900">
                            Select to Withdraw or Deposit
                          </label>
                          <select
                            value={action}
                            onChange={(e) =>
                              setAction(
                                e.target.value as keyof typeof transactionTypes
                              )
                            }
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          >
                            {actionTypes.map(
                              (action: string, index: number) => (
                                <option key={index} value={action}>
                                  {action}
                                </option>
                              )
                            )}
                          </select>
                          <span className="text-red-700">
                            {validator.current.message(
                              "action",
                              action,
                              "required"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    onClick={() => closeWithdrawOrAddModal()}
                    type="button"
                    className="inline-flex w-full mb-4 justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => submit()}
                    type="button"
                    className="inline-flex w-full mb-4 justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto"
                  >
                    Submit
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-20 rounded-lg shadow-xl">
                <Spinner />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default WithdrawOrAdd;
