import { useEffect, useState } from "react";
import { NavigateFunction, useNavigate, useParams } from "react-router-dom";
import axiosApi from "../api";
import Loading from "../components/Loading";
import MessageTypes from "../types/messageTypes";
import EmitterEvents from "../types/emitterEvents";
import useEventEmitter from "../services/useEventEmitter";
import { AxiosError, AxiosResponse } from "axios";

function VerifyEmail() {
  const { dispatch } = useEventEmitter();
  const navigate: NavigateFunction = useNavigate();
  const { token } = useParams();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    axiosApi.get(`api/verify-email/${token}`).then(
      (response: AxiosResponse) => {
        setLoading(false);
        dispatch(EmitterEvents.SHOW_NOTIFICATION, {
          message: response.data.message,
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
  }, []);
  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div className="bg-white h-screen flex flex-col justify-center items-center px-12 py-12 lg:px-16">
          <h3 className="text-3xl font-bold text-center text-gray-700">
            Failed email verification.
          </h3>
          <h3 className="text-3xl font-bold text-center text-gray-700">
            Please login to your profile, and click the button to send another
            verification link to your email address.
          </h3>
        </div>
      )}
    </>
  );
}

export default VerifyEmail;
