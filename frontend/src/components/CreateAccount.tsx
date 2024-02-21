import { AxiosResponse } from "axios";
import axiosApi from "../api";
import { useEffect, useState } from "react";
import useValidator from "../services/useValidator";
import Spinner from "./Spinner";
import useEventEmitter from "../services/useEventEmitter";
import MessageTypes from "../types/messageTypes";
import EmitterEvents from "../types/emitterEvents";

function CreateAccount({
  existingAccounts,
  closeAccountModal,
}: {
  existingAccounts: Array<any>;
  closeAccountModal: Function;
}) {
  const { dispatch } = useEventEmitter();
  const [validator] = useValidator();
  const [currencies, setCurrencies] = useState<Array<any>>([]);
  const [selectedCurrencyId, setSelectedCurrency] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  function getCurrencies() {
    setLoading(true);
    axiosApi.get(`api/currencies`).then(
      (response: AxiosResponse) => {
        setCurrencies(response.data.currencies);
        setSelectedCurrency(
          response.data.currencies.length > 0
            ? response.data.currencies[0].id
            : ""
        );
        setLoading(false);
      },
      (error) => {
        setLoading(false);
      }
    );
  }

  function createAccount() {
    const exists = existingAccounts.find(
      (account: any) =>
        Number.parseInt(account.currencyId) ===
        Number.parseInt(selectedCurrencyId)
    );
    if (exists)
      return dispatch(EmitterEvents.SHOW_NOTIFICATION, {
        message: `An account with the currency ${exists.currency.name} already exists. Please choose another currency.`,
        type: MessageTypes.error,
      });
    if (validator.current.allValid()) {
      setLoading(true);
      axiosApi.post("/api/accounts", { currency_id: selectedCurrencyId }).then(
        (response: AxiosResponse) => {
          setLoading(true);
          closeAccountModal(true);
        },
        (error) => {
          dispatch(EmitterEvents.SHOW_NOTIFICATION, {
            message: error.response?.data
              ? (error.response.data as any).message
              : error.message,
            type: MessageTypes.error,
          });
          setLoading(true);
        }
      );
    } else validator.current.showMessages();
  }

  useEffect(() => {
    getCurrencies();
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
            {/*  */}
            {!loading ? (
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3
                        id="modal-title"
                        className="text-base font-semibold leading-6 text-gray"
                      >
                        New Account
                      </h3>
                      <div className="mt-3 py-3">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                          Select currency
                        </label>
                        <select
                          value={selectedCurrencyId}
                          onChange={(e) => setSelectedCurrency(e.target.value)}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        >
                          {currencies.map((currency: any, index: number) => (
                            <option key={index} value={currency.id}>
                              {currency.name}
                            </option>
                          ))}
                        </select>
                        <span className="text-red-700">
                          {validator.current.message(
                            "selectedCurrencyId",
                            selectedCurrencyId,
                            "required"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={() => closeAccountModal()}
                    className="inline-flex w-full mb-4 justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => createAccount()}
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

export default CreateAccount;
