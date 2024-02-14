import React, { useEffect, useState } from "react";
import axiosApi from "../api";
import { NavigateFunction, useNavigate, useParams } from "react-router-dom";
import Transact from "../components/Transact";
import useEventEmitter from "../helpers/useEventEmitter";
import { AxiosResponse } from "axios";
import WithdrawOrAdd from "../components/WithdrawOrAdd";

function Accounts() {
  const { dispatch } = useEventEmitter();
  const navigate: NavigateFunction = useNavigate();
  const { userId } = useParams();
  const [authUser, setAuthUser] = useState<any>(null);
  const [accountUser, setAccountUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<Array<any>>([]);
  const [senderAccount, setSenderAccount] = useState<any>(null);
  const [receiverAccount, setReceiverAccount] = useState<any>(null);
  const [showTransactModal, setShowTransactModal] = useState<boolean>(false);
  const [showWithdrawOrAddModal, setShowWithdrawOrAddModal] =
    useState<boolean>(false);

  function isAuthUser(): boolean {
    return JSON.parse(sessionStorage.getItem("isAuthUserOnAccounts") as string);
  }

  function goBack() {
    isAuthUser() ? navigate(`/profile`) : navigate("/users");
  }

  /* when auth user views their own accounts */
  function sendMoney(account: any) {
    sessionStorage.setItem("selectedSenderAccount", JSON.stringify(account));
    navigate(`/users`);
  }

  function viewHistory(accountId: number) {
    navigate(`/transactions/${accountId}`);
  }

  /* when auth user views others accounts */
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

  function closeWithdrawOrAddModal(reload: boolean = false) {
    setShowWithdrawOrAddModal(false);
    setReceiverAccount(null);
    if (reload) getAccounts(authUser);
  }

  function getAccounts(authUser: any) {
    // dispatch("show_loading", true);
    axiosApi.get(`api/accounts?user_id=${userId}`).then(
      (response: AxiosResponse) => {
        setAccountUser(response.data.user);
        setAccounts(response.data.accounts);
        // dispatch("show_loading", false);
        sessionStorage.setItem(
          "isAuthUserOnAccounts",
          JSON.stringify(response.data.user.id === authUser.user.id)
        );
      },
      (error) => {
        console.log(error);
        // dispatch("show_loading", false);
      }
    );
  }

  useEffect(() => {
    console.log('HAS BEEN RUN TOO MUCH')
    const authUser = JSON.parse(sessionStorage.getItem("authUser") as string);
    setAuthUser(authUser);
    getAccounts(authUser);
    return () => {};
  }, []);

  return (
    <>
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            Accounts of {accountUser?.userName || "Guest"} {" - "}
            <span className="text-blue-600">{accounts.length}</span>
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
                    Account No.
                  </th>
                  <th scope="col" className="px-6 py-3">
                    {isAuthUser() ? `Amount` : "Email"}
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Currency
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Pay User
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Transfer
                  </th>
                  {isAuthUser() && (
                    <th scope="col" className="px-6 py-3">
                      Withdraw / Deposit
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3">
                    History
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
                      {isAuthUser()
                        ? `${account.currency?.symbol} ${Number.parseFloat(account.amount).toFixed(2)}`
                        : `${accountUser.email}`}
                    </th>
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                    >
                      {account?.currency?.name || "No currency specified"}
                    </th>
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                    >
                      <button
                        title="Pay other accounts with money from this account"
                        onClick={() => sendMoney(account)}
                        className="font-medium text-green-600 hover:underline mr-2"
                      >
                        Pay
                      </button>
                    </th>
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                    >
                      <button
                        title="Pay into this account"
                        onClick={() => openTransactModal(account)}
                        className="font-medium text-orange-600  hover:underline mr-2"
                      >
                        Transfer
                      </button>
                    </th>
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
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                    >
                      <button
                        title="View acount transaction history"
                        onClick={() => viewHistory(account.id)}
                        className="font-medium text-blue-600 hover:underline mr-2"
                      >
                        History
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
      </main>
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
          closeWithdrawOrAddModal={(e: boolean) => closeWithdrawOrAddModal(e)}
        />
      )}
    </>
  );
}

export default Accounts;
