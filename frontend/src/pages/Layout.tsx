import React, { useEffect, useState } from "react";
import api from "../api";
import {
  Location,
  NavigateFunction,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import clsx from "clsx";
import useEventEmitter from "../helpers/useEventEmitter";

function Layout() {
  const navigate: NavigateFunction = useNavigate();
  const location: Location = useLocation();
  const {subscribe, unsubscribe} = useEventEmitter();
  const [message, setMessage] = useState<string>("");
  const [authUser, setAuthUser] = useState<{ user: any; token: string } | null>(
    null
  );
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const links = [
    { name: "Profile", url: "/profile", auth: true, guest: false },
    { name: "Home", url: "/", auth: false, guest: true },
    { name: "Login", url: "/login", auth: false, guest: true },
    { name: "Register", url: "/register", auth: false, guest: true },
  ];
  const inactiveRouteClass =
    "text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium";
  const activeRouteClass =
    "bg-gray-900 text-white rounded-md px-3 py-2 text-sm font-medium";
  const mobileInactiveRouteClass =
    "text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium";
  const mobileActiveRouteClass =
    "bg-gray-900 text-white block rounded-md px-3 py-2 text-base font-medium";

  function getWelcome() {
    api.get("/").then((res: any) => {
      console.log(res);
      setMessage(res.data.hello);
    });
  }

  function toggleMenu() {
    console.log(showMenu, "RUNNING");
    setShowMenu(showMenu ? false : true);
  }

  function navigateTo(route: string) {
    setShowMenu(false);
    navigate(route);
  }

  function logOut() {
    setShowMenu(false);
    sessionStorage.removeItem("authUser");
    setAuthUser(null)
    navigate("/");
  }

  useEffect(() => {
    setAuthUser(JSON.parse(sessionStorage.getItem("authUser") as string) || null);
    subscribe("set_auth_user", () => {
      console.log('running auth')
      setAuthUser(JSON.parse(sessionStorage.getItem("authUser") as string))
    });
    return () => {
      unsubscribe("set_auth_user");
    };
  }, []);

  return (
    <div className="min-h-full">
      <nav className="bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img
                  className="h-8 w-8"
                  src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
                  alt="Your Company"
                ></img>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {/* <!-- Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" --> */}
                  {links.map(
                    (link, index) =>
                      ((link.auth && authUser) ||
                        (link.guest && !authUser)) && (
                        <button
                          key={index}
                          onClick={() => navigateTo(link.url)}
                          className={clsx(
                            location.pathname == link.url && activeRouteClass,
                            location.pathname != link.url && inactiveRouteClass
                          )}
                        >
                          {link.name}
                        </button>
                      )
                  )}
                  <button
                    onClick={logOut}
                    className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            <div className="-mr-2 flex md:hidden">
              {/* <!-- Mobile menu button --> */}
              <button
                type="button"
                className="relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                aria-controls="mobile-menu"
                aria-expanded="false"
                onClick={toggleMenu}
              >
                <span className="absolute -inset-0.5"></span>
                <span className="sr-only">Open main menu</span>
                {/* <!-- Menu open: "hidden", Menu closed: "block" --> */}
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
                {/* <!-- Menu open: "block", Menu closed: "hidden" --> */}
                <svg
                  className="hidden h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* <!-- Mobile menu, show/hide based on menu state. --> */}
        {showMenu && (
          <div className="md:hidden" id="mobile-menu">
            <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
              {links.map(
                (link, index) =>
                  ((link.auth && authUser) || (link.guest && !authUser)) && (
                    <button
                      key={index}
                      onClick={() => navigateTo(link.url)}
                      className={clsx(
                        location.pathname == link.url && mobileActiveRouteClass,
                        location.pathname != link.url &&
                          mobileInactiveRouteClass
                      )}
                      aria-current="page"
                    >
                      {link.name}
                    </button>
                  )
              )}
              <button
                onClick={logOut}
                className="text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>
      <Outlet />;
    </div>
  );
}

export default Layout;
