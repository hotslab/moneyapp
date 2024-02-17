import { useEffect, useState } from "react";
import { NavigateFunction, useNavigate, useParams } from "react-router-dom";
import axiosApi from "../api";
import useValidator from "../services/useValidator";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "../components/Loading";
import EmitterEvents from "../types/emitterEvents";
import useEventEmitter from "../services/useEventEmitter";
import MessageTypes from "../types/messageTypes";
import IconCurrencyFill from "../components/IconCurrencyFill";

function ResetPassword() {
  const { dispatch } = useEventEmitter();
  const navigate: NavigateFunction = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordDoNotMatch, setPasswordDoNotMatch] = useState<boolean>(false);
  const [validator] = useValidator();
  const [loading, setLoading] = useState<boolean>(false);

  function resetPassword() {
    if (!token)
      dispatch(EmitterEvents.SHOW_NOTIFICATION, {
        message:
          "The reset token is missing. Please re-try again to send another password reset link to your email.",
        type: MessageTypes.error,
      });
    if (validator.current.allValid() && !passwordDoNotMatch) {
      setLoading(true);
      axiosApi
        .put(`api/reset-password/${token}`, {
          password: password,
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
    if ((password || confirmPassword) && password != confirmPassword)
      return setPasswordDoNotMatch(true);
    else setPasswordDoNotMatch(false);
  }

  useEffect(() => {}, []);

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
              Enter New Password
            </h2>
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <div className="space-y-6">
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
                  onClick={resetPassword}
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ResetPassword;
