import { useEffect, useState } from "react";
import axiosApi from "../api";
import {
  Location,
  NavigateFunction,
  useLocation,
  useNavigate,
} from "react-router-dom";
import useValidator from "../services/useValidator";
import useEventEmitter from "../services/useEventEmitter";
import { AxiosError, AxiosResponse } from "axios";
import MessageTypes from "../types/messageTypes";
import EmitterEvents from "../types/emitterEvents";
import Loading from "../components/Loading";
import IconCurrencyFill from "../components/IconCurrencyFill";
import parseAxiosError from "../services/useParseAxiosError";

function Login() {
  const { dispatch } = useEventEmitter();
  const navigate: NavigateFunction = useNavigate();
  let location: Location = useLocation();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [validator] = useValidator();
  const [loading, setLoading] = useState<boolean>(false);

  function goToForgotPassword() {
    navigate("/reset-password-link");
  }

  function login() {
    if (validator.current.allValid()) {
      setLoading(true);
      axiosApi.post("/api/login", { email: email, password: password }).then(
        (response: AxiosResponse) => {
          setLoading(false);
          sessionStorage.setItem("authUser", JSON.stringify(response.data));
          dispatch(EmitterEvents.SET_AUTH_USER);
          navigate("/profile");
        },
        (error: AxiosError) => {
          let message = parseAxiosError(error);
          dispatch(EmitterEvents.SHOW_NOTIFICATION, {
            message: message || 'Unkonwn error. Please try again.',
            type: MessageTypes.error,
          });
          setLoading(false);
        }
      );
    } else validator.current.showMessages();
  }

  useEffect(() => {
    if (location.state && location.state.errorMessage) {
      dispatch(EmitterEvents.SHOW_NOTIFICATION, {
        message: location.state.errorMessage,
        type: MessageTypes.error,
      });
      dispatch(EmitterEvents.LOG_OUT);
    }
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
              Sign in to your account
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
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  ></input>
                  <span className="text-red-700">
                    {validator.current.message(
                      "email",
                      email,
                      "required|email",
                    )}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium leading-6 text-gray-900">
                    Password
                  </label>
                  <div className="text-sm">
                    <button
                      onClick={goToForgotPassword}
                      className="font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  ></input>
                  <span className="text-red-700">
                    {validator.current.message(
                      "password",
                      password,
                      "required"
                    )}
                  </span>
                </div>
              </div>

              <div>
                <button
                  onClick={login}
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Sign in
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Login;
