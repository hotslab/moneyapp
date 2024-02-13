import { RouterProvider } from "react-router-dom";
import router from "./router";
import Loading from "./components/Loading";
import Modal from "./components/Modal";
import { useEffect, useState } from "react";
import useEventEmitter from "./helpers/useEventEmitter";

function App() {
  const { subscribe, unsubscribe } = useEventEmitter();
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationMessage, setNotificationMesssage] = useState<string>("");
  const [notificationType, setNotificationType] = useState<string>("");

  function closeModal() {
    setShowNotification(false);
    setNotificationType("");
    setNotificationMesssage("");
  }

  useEffect(() => {
    subscribe("show_loading", (value: boolean) => setShowLoading(value));
    subscribe(
      "show_notification",
      (data: { type: string; message: string }) => {
        setNotificationType(data.type);
        setNotificationMesssage(data.message);
        setShowNotification(true);
      }
    );
    return () => {
      unsubscribe("show_loading");
      unsubscribe("show_notification");
    };
  }, []);

  return (
    <>
      {showLoading ? (
        <Loading />
      ) : (
        <RouterProvider router={router} fallbackElement={<Loading />} />
      )}
      {showNotification && (
        <Modal
          message={notificationMessage}
          type={notificationType}
          closeModal={() => closeModal()}
        />
      )}
    </>
  );
}

export default App;
