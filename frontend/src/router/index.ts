import { createBrowserRouter } from "react-router-dom";
import Home from '../pages/Home'
import Login from "../pages/Login";
import Layout from "../pages/Layout";
import Profile from "../pages/Profile";
import Users from "../pages/Users";
import Accounts from "../pages/Accounts";
import Transactions from "../pages/Transactions";
import Register from "../pages/Register";
import NotFound from "../pages/NotFound";
import VerifyEmail from "../pages/VerifyEmail";
import Notifications from "../pages/Notifications"
import ResetPassword from "../pages/ResetPassword";
import ResetPasswordLink from "../pages/ResetPasswordLink";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        path: "",
        Component: Home,
      },
      {
        path: "login",
        Component: Login,
      },
      {
        path: "register",
        Component: Register,
      },
      {
        path: "reset-password-link",
        Component: ResetPasswordLink,
      },
      {
        path: "reset-password/:token",
        Component: ResetPassword,
      },
      {
        path: "profile",
        Component: Profile,
      },
      {
        path: "users",
        Component: Users,
      },
      {
        path: "accounts/:userId",
        Component: Accounts,
      },
      {
        path: "transactions/:accountId",
        Component: Transactions,
      },
      {
        path: "notifications",
        Component: Notifications,
      },
      {
        path: "verify-email/:token",
        Component: VerifyEmail,
      },
      { path: "*", Component: NotFound },
    ],
  },
]);

export default router
