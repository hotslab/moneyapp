import { useEffect, useState } from "react";
import axiosApi from "../api";
import useValidator from "../services/useValidator";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { AxiosError, AxiosResponse } from "axios";
import useEventEmitter from "../services/useEventEmitter";
import EmitterEvents from "../types/emitterEvents";
import Loading from "../components/Loading";
import MessageTypes from "../types/messageTypes";

function Profile() {
  const { dispatch } = useEventEmitter();
  const navigate: NavigateFunction = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [email, setEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordDoNotMatch, setPasswordDoNotMatch] = useState<boolean>(false);
  const [validator] = useValidator();

  function updateDetails() {
    if (validator.current.allValid() && !passwordDoNotMatch) {
      setLoading(true);
      axiosApi
        .put(`/api/users/${authUser.user.id}`, {
          user_name: userName,
          password: password,
          email: email,
        })
        .then(
          (response: AxiosResponse) => {
            const loggedInUser = sessionStorage.getItem("authUser");
            if (loggedInUser) {
              let parsedUser: { user: any; token: string } =
                JSON.parse(loggedInUser);
              parsedUser.user = response.data.user;
              sessionStorage.setItem("authUser", JSON.stringify(parsedUser));
              dispatch(EmitterEvents.SET_AUTH_USER);
              setEmail(parsedUser.user.email);
              setUserName(parsedUser.user.userName);
              setAuthUser(parsedUser);
            }
            setLoading(false);
          },
          (error) => {
            dispatch(EmitterEvents.SHOW_NOTIFICATION, {
              message: error.response?.data
                ? (error.response.data as any).message
                : error.message,
              type: MessageTypes.error,
            });
            setLoading(false);
          }
        );
    } else validator.current.showMessages();
  }

  function checkPasswordMatches() {
    if ((password || confirmPassword) && password !== confirmPassword)
      return setPasswordDoNotMatch(true);
    else setPasswordDoNotMatch(false);
  }

  function goToAccounts() {
    navigate(`/accounts/${authUser.user.id}`);
  }

  function verifyEmail() {
    setLoading(true)
    axiosApi
      .get(`/api/resend-verify-email`)
      .then(
        (response: AxiosResponse) => {
          dispatch(EmitterEvents.SHOW_NOTIFICATION, {
            message: response.data.message,
            type: MessageTypes.info,
          });
          setLoading(false);
        },
        (error: AxiosError) => {
          dispatch(EmitterEvents.SHOW_NOTIFICATION, {
            message: error.response?.data
              ? (error.response.data as any).message
              : error.message,
            type: MessageTypes.error,
          });
          setLoading(false);
        }
      );
  }

  function getCurrentNotifications() {
    console.log("RUNNING");
    axiosApi.get(`api/notifications`).then(
      (response: AxiosResponse) => {
        dispatch(EmitterEvents.SET_NOTIFICATIONS, response.data.notifications);
      },
      (error) => {
        console.log(error);
      }
    );
  }

  useEffect(() => {
    let user = JSON.parse(sessionStorage.getItem("authUser") as string);
    if (user) {
      setEmail(user.user.email);
      setUserName(user.user.userName);
      setAuthUser(user);
    }
    getCurrentNotifications()
    dispatch(EmitterEvents.LOAD_NOTIFICATIONS);
    return () => {};
  }, []);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div>
          <header className="bg-white shadow">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between item-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 capitalize">
                {`${authUser?.user.userName} Profile`}
              </h1>
              {authUser?.user.verified ? (
                <button
                  onClick={goToAccounts}
                  className="flex justify-center rounded-md bg-green-700 hover:bg-green-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white"
                >
                  View Accounts
                </button>
              ) : (
                <button
                  onClick={verifyEmail}
                  className="flex justify-center rounded-md bg-green-700 hover:bg-green-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white"
                >
                  Verify Email
                </button>
              )}
            </div>
          </header>
          <main className="mx-4">
            <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
              <h3 className="text-center">Details</h3>
              <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <div className="space-y-6">
                  <div>
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
                  <div>
                    <label className="block text-sm font-medium leading-6 text-gray-900">
                      User Name
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

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium leading-6 text-gray-900">
                        Password
                      </label>
                    </div>
                    <div className="mt-2">
                      <input
                        type="password"
                        value={password}
                        onBlur={checkPasswordMatches}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      ></input>
                      <span className="text-red-700">
                        {validator.current.message(
                          "password",
                          password,
                          "min:5"
                        )}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium leading-6 text-gray-900">
                        Confirm Password
                      </label>
                    </div>
                    <div className="mt-2">
                      <input
                        type="password"
                        value={confirmPassword}
                        onKeyUp={checkPasswordMatches}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      ></input>
                      {passwordDoNotMatch && (
                        <span className="text-red-700">
                          Passwords do not match
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={updateDetails}
                      type="submit"
                      className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Update Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </>
  );
}

export default Profile;
