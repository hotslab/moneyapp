import React, { useEffect, useState } from "react";
import axiosApi from "../api";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { AxiosResponse } from "axios";
import useEventEmitter from "../helpers/useEventEmitter";

function Users() {
  const { dispatch } = useEventEmitter();
  const navigate: NavigateFunction = useNavigate();
  let [authUser, setAuthUser] = useState<any>();
  let [users, setUsers] = useState<Array<any>>([]);

  function goToUserAccounts(userId: number) {
    navigate(`/accounts/${userId}`);
  }

  function goBack() {
    navigate(`/accounts/${authUser.user.id}`)
  }

  useEffect(() => {
    let user = JSON.parse(sessionStorage.getItem("authUser") as string);
    setAuthUser(user);
    dispatch('show_loading', true)
    axiosApi.get(`api/users`).then(
      (response: AxiosResponse) => {
        setUsers(response.data.users);
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
            Users {" - "}
            <span className="text-blue-600">{users.length}</span>
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
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3">
                    UserName
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3">
                    No. of Accounts
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={index}
                    className="bg-white border-b hover:bg-gray-200"
                  >
                    <td className="text-gray-800 px-6 py-4">
                      <a
                        onClick={() => goToUserAccounts(user.id)}
                        title="Pay this user"
                        className="font-medium text-green-600 dark:text-green-500 hover:underline"
                      >
                        Pay
                      </a>
                    </td>
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                    >
                      {user.userName}
                    </th>
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                    >
                      {user.email}
                    </th>
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                    >
                      {user.accounts.length}
                    </th>
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                    >
                      {user.createdAt}
                    </th>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
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

export default Users;
