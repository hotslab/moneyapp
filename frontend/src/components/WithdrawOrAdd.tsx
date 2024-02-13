import { useEffect, useState } from "react";
import useValidator from "../helpers/useValidator";
import Freecurrencyapi from "@everapi/freecurrencyapi-js";
import axiosApi from "../api";
import useEventEmitter from "../helpers/useEventEmitter";
import { AxiosResponse } from "axios";
import Spinner from "./Spinner";
import Account from "../pages/Account";

function WithdrawOrAdd(props: {
  authUser: any;
  account: any;
  closeWithdrawOrAddModal: Function;
}) {
  const { dispatch } = useEventEmitter();
  const [validator] = useValidator();
  const [loading, setLoading] = useState<boolean>(false);
  const actionTypes: Array<string> = ["withdraw", "add"];
  const [amount, setAmount] = useState<string>("");
  const [action, setAction] = useState<string>("");

  function showValidator() {
    validator.current.showMessageFor("amount");
  }

  function submit() {
    if (validator.current.allValid()) {
      if (
        Number.parseFloat(props.account.amount) < Number.parseFloat(amount) &&
        action === "withdraw"
      )
        return dispatch("show_notification", {
          message: "Amount withdrawn is greater than balance",
          type: "error",
        });
      setLoading(true);
      axiosApi
        .put(`/api/accounts/${props.account.id}`, {
          amount: amount,
          action: action,
        })
        .then(
          (response: AxiosResponse) => {
            setLoading(false);
            dispatch("show_notification", {
              message: "Account was updated",
              type: "info",
            });
            props.closeWithdrawOrAddModal(true);
          },
          (error) => {
            setLoading(false);
            dispatch("show_notification", {
              message: error.message,
              type: "error",
            });
          }
        );
    } else validator.current.showMessages();
  }

  useEffect(() => {}, []);
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
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-5/6 sm:mx-6">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left divide-y divide-gray-300">
                      <h1
                        className="text-xl capitalize mb-3 font-semibold leading-6 text-gray-700 mb-3"
                        id="modal-title"
                      >
                        Direct Deposit or Withdraw from Account No.{" "}
                        {props.account.id}
                      </h1>
                      <p className="text-3xl font-semibold mb-2 leading-6 text-gray-500 py-3">
                        Balance Available{" - "}
                        <span className="text-green-700">
                          {props.account.currency.symbol}{" "}
                          {props.account.amount || 0}
                        </span>
                      </p>
                      <div className="mt-2 py-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium leading-6 text-gray-900">
                            Enter Amount
                          </label>
                        </div>
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
                              "required|numeric|min:0,num|currency"
                            )}
                          </span>
                        </div>
                        <div className="mt-3 py-3">
                          <label className="block text-sm font-medium leading-6 text-gray-900">
                            Select to Withdraw or Deposit
                          </label>
                          <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          >
                            <option defaultValue="">Select action</option>
                            {actionTypes.map(
                              (action: string, index: number) => (
                                <option
                                  key={index}
                                  value={action}
                                  className="capitalize"
                                >
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
                    onClick={() => props.closeWithdrawOrAddModal()}
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => submit()}
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto"
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
