import { useEffect, useState } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import axiosApi from "../api";
import useValidator from "../services/useValidator";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "../components/Loading";
import useEventEmitter from "../services/useEventEmitter";
import EmitterEvents from "../types/emitterEvents";
import MessageTypes from "../types/messageTypes";
import IconCurrencyFill from "../components/IconCurrencyFill";
import parseAxiosError from "../services/useParseAxiosError";

function Register() {
  const { dispatch } = useEventEmitter();
  const navigate: NavigateFunction = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [currencyId, setCurrencyId] = useState<number>();
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordDoNotMatch, setPasswordDoNotMatch] = useState<boolean>(false);
  const [currencies, setCurrencies] = useState<Array<any>>([]);
  const [validator] = useValidator();
  const [loading, setLoading] = useState<boolean>(false);

  function register() {
    if (validator.current.allValid() && !passwordDoNotMatch) {
      setLoading(true);
      axiosApi
        .post("/api/register", {
          user_name: userName,
          password: password,
          email: email,
          currency_id: currencyId,
        })
        .then(
          (response: AxiosResponse) => {
            dispatch(EmitterEvents.SHOW_NOTIFICATION, {
              message: response.data.message,
              type: MessageTypes.info,
            });
            setLoading(false);
            navigate("/login");
          },
          (error: AxiosError) => {
            let message = parseAxiosError(error);
            dispatch(EmitterEvents.SHOW_NOTIFICATION, {
              message: message || "Unknown error. Please try again.",
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

  useEffect(() => {
    axiosApi.get("api/currencies").then(
      (response: AxiosResponse) => {
        setCurrencies(response.data.currencies);
        setCurrencyId(
          response.data.currencies.length > 0
            ? response.data.currencies[0].id
            : ""
        );
      },
      () => {}
    );
  }, []);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <IconCurrencyFill
              className="text-pink-500 mx-auto w-auto"
              width="48px"
              height="48px"
            />
            <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Sign up to your account
            </h2>
          </div>

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
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Select Currency
                </label>
                <select
                  value={currencyId}
                  onChange={(e) =>
                    setCurrencyId(Number.parseInt(e.target.value))
                  }
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  {currencies.map((currency: any, index: number) => (
                    <option
                      key={index}
                      value={currency.id}
                      className="capitalize"
                    >
                      {currency.name}
                    </option>
                  ))}
                </select>
                <span className="text-red-700">
                  {validator.current.message(
                    "currencyId",
                    currencyId,
                    "required"
                  )}
                </span>
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
                    onKeyUp={checkPasswordMatches}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  ></input>
                  <span className="text-red-700">
                    {validator.current.message(
                      "password",
                      password,
                      "required|min:5"
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
                    onBlur={checkPasswordMatches}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  ></input>
                  {passwordDoNotMatch && (
                    <span className="text-red-700">Passwords do not match</span>
                  )}
                </div>
              </div>

              <div>
                <button
                  onClick={register}
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Register;
