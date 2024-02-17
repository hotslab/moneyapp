import { useEffect, useState } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import axiosApi from "../api";
import useValidator from "../services/useValidator";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "../components/Loading";
import { v4 as uuidv4 } from "uuid";
import EmitterEvents from "../types/emitterEvents";
import MessageTypes from "../types/messageTypes";
import useEventEmitter from "../services/useEventEmitter";
import IconCurrencyFill from "../components/IconCurrencyFill";

function ResetPasswordLink() {
  const { dispatch } = useEventEmitter();
  const navigate: NavigateFunction = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [validator] = useValidator();
  const [loading, setLoading] = useState<boolean>(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  function createResetPasswordLink() {
    if (validator.current.allValid()) {
      setLoading(true);
      axiosApi
        .post(
          "/api/password-reset-link",
          {
            email: email,
          },
          {
            headers: {
              idempotency_key: idempotencyKey,
            },
          }
        )
        .then(
          (response: AxiosResponse) => {
            setLoading(false);
            dispatch(EmitterEvents.SHOW_NOTIFICATION, {
              message: `Please check your email ${email} for the password reset link.`,
              type: MessageTypes.info,
            });
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

  useEffect(() => {
    setIdempotencyKey(uuidv4());
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
              Reset Your Password
            </h2>
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Enter Email address
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
                <button
                  onClick={createResetPasswordLink}
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ResetPasswordLink;
