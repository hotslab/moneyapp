import React, { useEffect, useState } from "react";
import { NavigateFunction, useNavigate, useParams } from "react-router-dom";
import axiosApi from "../api";
import useEventEmitter from "../helpers/useEventEmitter";

function VerifyEmail() {
  const { dispatch } = useEventEmitter();
  const navigate: NavigateFunction = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    dispatch("show_loading", true);
    axiosApi.get(`api/verify-email/${token}`).then(
      () => {
        dispatch("show_loading", false);
        navigate("/login");
      },
      (error: any) => {
        dispatch("show_loading", false);
      }
    );
  }, []);
  return (
    <>
      <div className="bg-white h-screen flex flex-col justify-center items-center px-12 py-12 lg:px-16">
        <h3 className="text-3xl font-bold text-center text-gray-700">
          Failed email verification.
        </h3>
        <h3 className="text-3xl font-bold text-center text-gray-700">
          Please login and try to re-verify on your profile page
        </h3>
      </div>
    </>
  );
}

export default VerifyEmail;
