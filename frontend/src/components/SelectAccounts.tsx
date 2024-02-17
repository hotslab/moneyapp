import { useState } from "react";
import Transact from "./Transact";

function SelectAccounts({
  accounts,
  authUser,
  senderAccount,
  accountUser,
  reloadAccounts,
  closeSelectAccountsModal,
}: {
  accounts: Array<any>;
  authUser: any;
  senderAccount: any;
  accountUser: any;
  reloadAccounts: Function;
  closeSelectAccountsModal: Function;
}) {
  const [showTransactionModal, setShowTransactionModal] =
    useState<boolean>(false);
  const [selectedReceiverAccount, setSelectedReceiverAccount] =
    useState<any>(null);

  function openTransactionModal(account: any) {
    setSelectedReceiverAccount(account);
    setShowTransactionModal(true);
  }

  function closeTransactModal(refreshAccounts: boolean) {
    setShowTransactionModal(false);
    if (refreshAccounts) reloadAccounts();
  }

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
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3
                      id="modal-title"
                      className="text-base font-semibold leading-6"
                    >
                      Select Your Account To Transfer To Below
                    </h3>
                    {/*  */}
                    <div className="relative overflow-x-auto my-2 shadow-md sm:rounded-lg">
                      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-200 uppercase bg-gray-700">
                          <tr>
                            <th scope="col" className="px-6 py-3">
                              Account No.
                            </th>
                            <th scope="col" className="px-6 py-3">
                              Amount
                            </th>
                            <th scope="col" className="px-6 py-3">
                              Currency
                            </th>
                            <th scope="col" className="px-6 py-3">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.map((account, index) => (
                            <tr
                              key={index}
                              className="bg-white border-b hover:bg-gray-200"
                            >
                              <th
                                scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                              >
                                {account.id}
                              </th>
                              <th
                                scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                              >
                                {`${
                                  account.currency?.symbol
                                } ${Number.parseFloat(account.amount).toFixed(
                                  2
                                )}`}
                              </th>
                              <th
                                scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                              >
                                {account.currency?.name}
                              </th>
                              <th
                                scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                              >
                                <button
                                  title="Transfer to this account"
                                  onClick={() => openTransactionModal(account)}
                                  className="font-medium text-blue-600 hover:underline mr-2"
                                >
                                  Transfer
                                </button>
                              </th>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {accounts.length === 0 && (
                        <div className="w-full text-2xl text-gray-700 py-6 flex justify-center items-center">
                          <span>No records found</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={() => closeSelectAccountsModal()}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showTransactionModal && (
        <Transact
          authUser={authUser}
          accountUser={accountUser}
          senderAccount={senderAccount}
          receiverAccount={selectedReceiverAccount}
          closeTransactModal={(e: boolean) => closeTransactModal(e)}
        />
      )}
    </>
  );
}

export default SelectAccounts;
