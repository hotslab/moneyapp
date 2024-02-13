import React, { useEffect, useReducer, useRef, useState } from "react";
import axiosApi from "../api";
import { Location, NavigateFunction, useLocation, useNavigate } from "react-router-dom";
import useValidator from "../helpers/useValidator";
import useEventEmitter from "../helpers/useEventEmitter";
import { AxiosResponse } from "axios";

function Login() {
  const {dispatch} = useEventEmitter()
  const navigate: NavigateFunction = useNavigate();
  let location: Location = useLocation();
  const [email, setEmail] = useState<string>("hotslices7@gmail.com");
  const [password, setPassword] = useState<string>("test");
  const [validator] = useValidator();

  function login() {
    if (validator.current.allValid()) {
      dispatch('show_loading', true)
      axiosApi.post("/api/login", { email: email, password: password }).then(
        (response: AxiosResponse) => {
          dispatch("show_loading", false);
          sessionStorage.setItem(
            "authUser",
            JSON.stringify(response.data)
          );
          dispatch("set_auth_user");
          navigate("/profile");
        },
        (error) => {
          console.log(error.message);
          dispatch("show_loading", false);
          dispatch('show_notification', {message: error.message, type: 'error'})
        }
      );
    } else validator.current.showMessages();
  }

  useEffect(() => {
    if (location.state && location.state.errorMessage) dispatch("show_notification", {
      message: location.state.errorMessage,
      type: "error",
    });
  }, []);

  return (
    <>
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            className="mx-auto h-10 w-auto"
            src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
            alt="Your Company"
          ></img>
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
                  {validator.current.message("email", email, "required|email")}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Password
                </label>
                <div className="text-sm">
                  <a className="font-semibold text-indigo-600 hover:text-indigo-500">
                    Forgot password?
                  </a>
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
                  {validator.current.message("password", password, "required")}
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
    </>
  );
}

export default Login;
