import { createBrowserRouter } from "react-router-dom";
import Home from '../pages/Home'
import Login from "../pages/Login";
import Layout from "../pages/Layout";
import Profile from "../pages/Profile";
import Users from "../pages/Users";
import Accounts from "../pages/Accounts";
import Account from "../pages/Account";
import Transactions from "../pages/Transactions";
import Register from "../pages/Register";
import NotFound from "../pages/NotFound";
import VerifyEmail from "../pages/VerifyEmail";

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
        path: "account/:id",
        Component: Account,
      },
      {
        path: "transactions/:accountId",
        Component: Transactions,
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
