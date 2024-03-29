import { useEffect, useState } from "react";
import useValidator from "../services/useValidator";
import useEventEmitter from "../services/useEventEmitter";
import axiosApi from "../api";
import { AxiosError, AxiosResponse } from "axios";
import Spinner from "./Spinner";
import transactionTypes from "../types/transactionTypes";
import MessageTypes from "../types/messageTypes";
import EmitterEvents from "../types/emitterEvents";
import parseAxiosError from "../services/useParseAxiosError";

function Transact({
  authUser,
  accountUser,
  senderAccount,
  receiverAccount,
  closeTransactModal,
}: {
  authUser: any;
  accountUser: any;
  senderAccount: any;
  receiverAccount: any;
  closeTransactModal: Function;
}) {
  const { dispatch } = useEventEmitter();
  const [validator] = useValidator();
  const [loading, setLoading] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>("0");
  const [differentCurrencies, setDifferenctCurrencies] =
    useState<boolean>(true);
  const [isSameUser, setIsSameUser] = useState<boolean>(false);
  const [rateConverted, setRateConverted] = useState<boolean>(false);
  const [conversionRate, setConversionRate] = useState<number>(1);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  function getExchangeRate() {
    if (validator.current.allValid()) {
      if (Number.parseFloat(senderAccount.amount) < Number.parseFloat(amount))
        return dispatch(EmitterEvents.SHOW_NOTIFICATION, {
          message: "Your balance is insufficient",
          type: MessageTypes.error,
        });
      setLoading(true);
      axiosApi
        .post(`/api/currency-conversion`, {
          senderCurrencyCode: senderAccount.currency.code,
          receiverCurrencyCode: receiverAccount.currency.code,
          amount: amount,
        })
        .then(
          (response: any) => {
            if (response.data.rate && response.data.convertedAmont) {
              setConversionRate(response.data.rate);
              setConvertedAmount(response.data.convertedAmont);
              setRateConverted(true);
            } else if (response.data.errorMessage)
              dispatch(EmitterEvents.SHOW_NOTIFICATION, {
                message: response.data.errorMessage,
                type: MessageTypes.error,
              });
            setLoading(false);
          },
          (error: AxiosError) => {
            const message = parseAxiosError(error)
            dispatch(EmitterEvents.SHOW_NOTIFICATION, {
              message: message,
              type: MessageTypes.error,
            });
            setLoading(false);
          }
        );
    }
  }

  function resetExchangeRate() {
    setRateConverted(false);
  }

  function submitPayment() {
    if (validator.current.allValid()) {
      if (Number.parseFloat(senderAccount.amount) < Number.parseFloat(amount))
        return dispatch(EmitterEvents.SHOW_NOTIFICATION, {
          message: "Your balance is insufficient",
          type: MessageTypes.error,
        });
      setLoading(true);
      axiosApi
        .post(
          `/api/transactions`,
          {
            transaction_type: isSameUser
              ? transactionTypes.TRANSFER
              : transactionTypes.PAYMENT,
            conversion_rate: conversionRate,
            // sender details
            sender_amount: amount,
            sender_currency_id: senderAccount.currency.id,
            sender_currency_symbol: senderAccount.currency.symbol,
            sender_account_id: senderAccount.id,
            sender_account_number: senderAccount.id,
            sender_name: authUser.user.userName,
            sender_email: authUser.user.email,
            // recipient details
            recipient_amount: differentCurrencies
              ? Number.parseFloat(`${convertedAmount}`).toFixed(2)
              : amount,
            recipient_currency_id: receiverAccount.currency.id,
            recipient_currency_symbol: receiverAccount.currency.symbol,
            recipient_account_id: receiverAccount.id,
            recipient_account_number: receiverAccount.id,
            recipient_name: accountUser.userName,
            recipient_email: accountUser.email,
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
              message:
                "Transaction was sent for processing. Please wait for notification via email or on this app when it has been successfully processed",
              type: MessageTypes.info,
            });
            closeTransactModal(true);
          },
          (error: AxiosError) => {
            setLoading(false);
            const message = parseAxiosError(error);
            dispatch(EmitterEvents.SHOW_NOTIFICATION, {
              message: message,
              type: MessageTypes.error,
            });
          }
        );
    } else validator.current.showMessages();
  }

  function showValidator() {
    validator.current.showMessageFor("amount");
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
        closeTransactModal();
      }
    );
  }

  useEffect(() => {
    getIdempotencyKey();
    setIsSameUser(parseInt(accountUser.id) === parseInt(authUser.user.id));
    setDifferenctCurrencies(
      senderAccount.currencyId !== receiverAccount.currencyId
    );
    return () => {};
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
                      <div className="mt-2 py-3">
                        <h1
                          className="text-xl capitalize mb-3 font-semibold leading-6 text-gray-700"
                          id="modal-title"
                        >
                          {differentCurrencies && !rateConverted
                            ? "Calculate Exchange Rate"
                            : "Send Amount"}
                        </h1>
                        <p className="text-3xl font-semibold my-4 leading-6 text-gray-500">
                          Your Available Balance:
                        </p>
                        <p className="text-3xl font-semibold my-4 leading-6 text-gray-500">
                          <span className="text-green-700">
                            {senderAccount.currency.symbol}{" "}
                            {Number.parseFloat(senderAccount.amount).toFixed(
                              2
                            ) || "0.00"}
                          </span>
                        </p>
                        <p className="text-2xl font-semibold my-4 leading-6 text-gray-500">
                          Amount To Be Sent:
                        </p>
                        <p className="text-2xl font-semibold my-4 leading-6 text-gray-500">
                          <span className="text-red-700">
                            {senderAccount.currency.symbol}{" "}
                            {Number.parseFloat(amount).toFixed(2) || "0.00"}
                          </span>
                        </p>
                        {differentCurrencies && rateConverted && (
                          <>
                            <p className="text-2xl font-semibold my-4 leading-6 text-gray-500">
                              Converted To:
                            </p>
                            <p className="text-2xl font-semibold my-4 leading-6 text-gray-500">
                              <span className="text-blue-700">
                                {receiverAccount.currency.symbol}{" "}
                                {Number.parseFloat(
                                  `${convertedAmount}`
                                ).toFixed(2) || "0.00"}
                              </span>{" "}
                              at rate{" "}
                              <span className="text-blue-700">
                                {conversionRate}
                              </span>
                            </p>
                          </>
                        )}
                      </div>
                      <div className="mt-2 py-3">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                          Enter Amount To Send
                        </label>
                        <div className="mt-2">
                          <input
                            type="number"
                            value={amount}
                            onBlur={() => showValidator()}
                            onChange={(e) => {
                              setAmount(e.target.value);
                              if (rateConverted) resetExchangeRate();
                            }}
                            className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          ></input>
                          <span className="text-red-700">
                            {validator.current.message(
                              "amount",
                              amount,
                              "required|numeric|min:0,num|currency"
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 py-3">
                        <h1
                          className="text-xl capitalize mb-3 font-semibold leading-6 text-gray-700"
                          id="modal-title"
                        >
                          Receiver Details
                        </h1>
                        <p className="font-semibold mb-2 leading-6 text-gray-500">
                          Account Number - {receiverAccount.id}
                        </p>
                        <p className="font-semibold mb-2 leading-6 text-gray-500">
                          Email - {accountUser.email}
                        </p>
                        <p className="font-semibold mb-2 leading-6 text-gray-500">
                          User Name - {accountUser.userName}
                        </p>
                        <p className="font-semibold mb-2 leading-6 text-gray-500">
                          Currency - {receiverAccount.currency?.name}
                        </p>
                      </div>
                      <div className="mt-2 py-3">
                        <h1
                          className="text-xl capitalize mb-3 font-semibold leading-6 text-gray-700"
                          id="modal-title"
                        >
                          Sender Details
                        </h1>
                        <p className="font-semibold mb-2 leading-6 text-gray-500">
                          Account Number - {senderAccount.id}
                        </p>
                        <p className="font-semibold mb-2 leading-6 text-gray-500">
                          Email - {authUser.user.email}
                        </p>
                        <p className="font-semibold mb-2 leading-6 text-gray-500">
                          User Name - {authUser.user.userName}
                        </p>
                        <p className="font-semibold mb-2 leading-6 text-gray-500">
                          Currency - {senderAccount.currency?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    onClick={() =>
                      !rateConverted
                        ? closeTransactModal()
                        : resetExchangeRate()
                    }
                    type="button"
                    className="inline-flex w-full mb-4 justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                  >
                    Cancel
                  </button>
                  {differentCurrencies && !rateConverted ? (
                    <button
                      onClick={() => getExchangeRate()}
                      type="button"
                      className="inline-flex w-full mb-4 justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto"
                    >
                      Calculate Exchange Rate
                    </button>
                  ) : (
                    <button
                      onClick={() => submitPayment()}
                      type="button"
                      className="inline-flex w-full mb-4 justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto"
                    >
                      Make Payment
                    </button>
                  )}
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

export default Transact;
