import React, { useEffect, useState } from "react";
import { NavigateFunction, useNavigate, useParams } from "react-router-dom";
import axiosApi from "../api";

function Account() {
  const navigate: NavigateFunction = useNavigate();
  const { id } = useParams();
  let [authUser, setAuthUser] = useState<any>(null);
  let [accountUser, setAccountUser] = useState<any>(null);
  let [account, setAccount] = useState<any>(null);
  let [currency, setCurrency] = useState<any>(null);
  
  function goToTransactions(accountId: number) {
    navigate(`/account/${accountId}`);
  }

  useEffect(() => {
    setAuthUser(JSON.parse(sessionStorage.getItem("authUser") as string));
    axiosApi.get(`api/accounts/${id}`).then(
      (response) => {
        setAccountUser(response.data.account.user);
        setAccount(response.data.account);
        setCurrency(response.data.account.currency);
      },
      (error) => {
        console.log(error);
      }
    );
  }, []);
  return (
    <>
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Account No. {account?.id }
          </h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Amount - {currency?.symbol} {account?.amount}
          </h1>
        </div>
      </main>
    </>
  );
}

export default Account;
