import React, { useEffect, useState } from "react";
import axiosApi from "../api";
import { NavigateFunction, useNavigate, useParams } from "react-router-dom";
import Transact from "../components/Transact";
import useEventEmitter from "../services/useEventEmitter";
import { AxiosResponse } from "axios";
import WithdrawOrAdd from "../components/WithdrawOrAdd";
import CreateAccount from "../components/CreateAccount";
import SelectAccounts from "../components/SelectAccounts";
import EmitterEvents from "../types/emitterEvents";
import Loading from "../components/Loading";

function Accounts() {
  const { subscribe, unsubscribe } = useEventEmitter();
  const navigate: NavigateFunction = useNavigate();
  const { userId } = useParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [accountUser, setAccountUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<Array<any>>([]);
  const [senderAccount, setSenderAccount] = useState<any>(null);
  const [receiverAccount, setReceiverAccount] = useState<any>(null);
  const [showTransactModal, setShowTransactModal] = useState<boolean>(false);
  const [showSelectAccountsModal, setShowSelectAccountsModal] =
    useState<boolean>(false);
  const [showCreateAccountModal, setShowCreateAccountModal] =
    useState<boolean>(false);
  const [showWithdrawOrAddModal, setShowWithdrawOrAddModal] =
    useState<boolean>(false);

  function isAuthUser(): boolean {
    return JSON.parse(sessionStorage.getItem("isAuthUserOnAccounts") as string);
  }

  function goBack() {
    isAuthUser() ? navigate(`/profile`) : navigate("/users");
  }

  function sendMoney(account: any) {
    sessionStorage.setItem("selectedSenderAccount", JSON.stringify(account));
    navigate(`/users`);
  }

  function viewHistory(accountId: number) {
    navigate(`/transactions/${accountId}`);
  }

  function openCreateAccountModal() {
    setShowCreateAccountModal(true);
  }

  function closeAccountModal(reloadAccounts: boolean = false) {
    setShowCreateAccountModal(false);
    if (reloadAccounts) getAccounts(authUser);
  }

  function openTransactModal(selectedReceiverAccount: any) {
    setSenderAccount(
      JSON.parse(sessionStorage.getItem("selectedSenderAccount") as string)
    );
    setReceiverAccount(selectedReceiverAccount);
    setShowTransactModal(true);
  }

  function closeTransactModal() {
    setShowTransactModal(false);
    setSenderAccount(null);
    setReceiverAccount(null);
  }

  function openWithdrawOrAddModal(selectedReceiverAccount: any) {
    setReceiverAccount(selectedReceiverAccount);
    setShowWithdrawOrAddModal(true);
  }

  function closeWithdrawOrAddModal(reloadAccounts: boolean = false) {
    setShowWithdrawOrAddModal(false);
    setReceiverAccount(null);
    if (reloadAccounts) getAccounts(authUser);
  }

  function openSelectAccountsModal(selectedAccount: any) {
    setSenderAccount(selectedAccount);
    setShowSelectAccountsModal(true);
  }

  function closeSelectAccountsModal(reloadAccounts: boolean) {
    setShowSelectAccountsModal(false);
    setSenderAccount(null);
    if (reloadAccounts) getAccounts(authUser);
  }

  function getAccounts(authUser: any) {
    setLoading(true);
    axiosApi.get(`api/accounts?user_id=${userId}`).then(
      (response: AxiosResponse) => {
        setAccountUser(response.data.user);
        setAccounts(response.data.accounts);
        sessionStorage.setItem(
          "isAuthUserOnAccounts",
          JSON.stringify(response.data.user.id === authUser.user.id)
        );
        setLoading(false);
      },
      (error) => {
        console.log(error);
        setLoading(false);
      }
    );
  }

  useEffect(() => {
    const authUser = JSON.parse(sessionStorage.getItem("authUser") as string);
    setAuthUser(authUser);
    getAccounts(authUser);
    subscribe(EmitterEvents.RELOAD_ACCOUNTS, () => getAccounts(authUser));
    return () => {
      unsubscribe(EmitterEvents.RELOAD_ACCOUNTS);
    };
  }, []);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div>
          <header className="bg-white shadow">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 sm:flex sm:justify-between sm:items-center">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                Accounts of {accountUser?.userName || "Guest"} {" - "}
                <span className="text-blue-600">{accounts.length}</span>
              </h1>
              <div className="sm:flex sm:justify-center sm:items-center">
                {isAuthUser() && (
                  <button
                    type="submit"
                    onClick={openCreateAccountModal}
                    // className="bg-green-600 mr-2 sm:ml-2 rounded p-1 text-white font-semibold text-sm hover:bg-green-500"
                    className="flex justify-center my-2 mr-2 sm:ml-2 rounded-md bg-green-700 hover:bg-green-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white"
                  >
                    Create Account
                  </button>
                )}
                <button
                  type="submit"
                  onClick={goBack}
                  // className="bg-red-600 mr-2 sm:ml-2 rounded p-1 text-white font-semibold text-sm hover:bg-red-500"
                  className="flex justify-center my-2 mr-2 sm:ml-2 rounded-md bg-red-700 hover:bg-red-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white"
                >
                  Back
                </button>
              </div>
            </div>
          </header>
          <main className="mx-4">
            <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
              <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-200 uppercase bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        Account No.
                      </th>
                      <th scope="col" className="px-6 py-3">
                        {isAuthUser() ? `Amount` : "Email"}
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Currency
                      </th>
                      {isAuthUser() && (
                        <th scope="col" className="px-6 py-3">
                          Pay User
                        </th>
                      )}
                      {!isAuthUser() && (
                        <th scope="col" className="px-6 py-3">
                          Pay
                        </th>
                      )}
                      {isAuthUser() && (
                        <th scope="col" className="px-6 py-3">
                          Transfer
                        </th>
                      )}
                      {isAuthUser() && (
                        <th scope="col" className="px-6 py-3">
                          Withdraw / Deposit
                        </th>
                      )}
                      {isAuthUser() && (
                        <th scope="col" className="px-6 py-3">
                          History
                        </th>
                      )}
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
                          {isAuthUser()
                            ? `${account.currency?.symbol} ${Number.parseFloat(
                                account.amount
                              ).toFixed(2)}`
                            : `${accountUser.email}`}
                        </th>
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                        >
                          {account?.currency?.name || "No currency specified"}
                        </th>
                        {isAuthUser() && (
                          <th
                            scope="row"
                            className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                          >
                            <button
                              title="Pay other user accounts with money from this account"
                              onClick={() => sendMoney(account)}
                              className="font-medium text-green-600 hover:underline mr-2"
                            >
                              Pay
                            </button>
                          </th>
                        )}
                        {!isAuthUser() && (
                          <th
                            scope="row"
                            className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                          >
                            <button
                              title="Pay into this user's account"
                              onClick={() => openTransactModal(account)}
                              className="font-medium text-orange-600  hover:underline mr-2"
                            >
                              Pay
                            </button>
                          </th>
                        )}
                        {isAuthUser() && (
                          <th
                            scope="row"
                            className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                          >
                            <button
                              title="Transfer to your other accounts with this account"
                              onClick={() => openSelectAccountsModal(account)}
                              className="font-medium text-orange-600  hover:underline mr-2"
                            >
                              Transfer
                            </button>
                          </th>
                        )}
                        {isAuthUser() && (
                          <th
                            scope="row"
                            className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                          >
                            <button
                              title="Add or withdraw money into this account directly"
                              onClick={() => openWithdrawOrAddModal(account)}
                              className="font-medium text-purple-700 hover:underline mr-2"
                            >
                              Deposit
                            </button>
                          </th>
                        )}
                        {isAuthUser() && (
                          <th
                            scope="row"
                            className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                          >
                            <button
                              title="View this acount's transaction history"
                              onClick={() => viewHistory(account.id)}
                              className="font-medium text-blue-600 hover:underline mr-2"
                            >
                              History
                            </button>
                          </th>
                        )}
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
          </main>
          {showCreateAccountModal && (
            <CreateAccount
              existingAccounts={accounts}
              closeAccountModal={(e: boolean) => closeAccountModal(e)}
            />
          )}
          {showTransactModal && (
            <Transact
              authUser={authUser}
              accountUser={accountUser}
              senderAccount={senderAccount}
              receiverAccount={receiverAccount}
              closeTransactModal={() => closeTransactModal()}
            />
          )}
          {showWithdrawOrAddModal && (
            <WithdrawOrAdd
              authUser={authUser}
              account={receiverAccount}
              closeWithdrawOrAddModal={(e: boolean) =>
                closeWithdrawOrAddModal(e)
              }
            />
          )}
          {showSelectAccountsModal && (
            <SelectAccounts
              accounts={accounts.filter(
                (account: any) => account.id !== senderAccount.id
              )}
              authUser={authUser}
              senderAccount={senderAccount}
              accountUser={accountUser}
              reloadAccounts={() => getAccounts(authUser)}
              closeSelectAccountsModal={(e: boolean) =>
                closeSelectAccountsModal(e)
              }
            />
          )}
        </div>
      )}
    </>
  );
}

export default Accounts;
