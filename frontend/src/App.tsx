import { RouterProvider } from "react-router-dom";
import router from "./router";
import Loading from "./components/Loading";
import MessageModal from "./components/MessageModal";
import { useEffect, useState } from "react";
import useEventEmitter from "./services/useEventEmitter";
import useSocket from "./services/useSocket";
import MessageTypes from "./types/messageTypes";
import EmitterEvents from "./types/emitterEvents";
import ServerNotificationTypes from "./types/serverNotificationTypes";

function App() {
  const { dispatch, subscribe, unsubscribe } = useEventEmitter();
  const [socket] = useSocket();
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationMessage, setNotificationMesssage] = useState<string>("");
  const [notificationType, setNotificationType] = useState<
    keyof typeof MessageTypes | keyof typeof ServerNotificationTypes | null
  >(null);

  function closeModal() {
    setShowNotification(false);
    setNotificationType(null);
    setNotificationMesssage("");
  }

  function soecketEvents({
    message,
    user_id,
    type,
  }: {
    message: string;
    user_id: number;
    type: keyof typeof MessageTypes | keyof typeof ServerNotificationTypes;
  }) {
    if (type === ServerNotificationTypes.NEW_TRANSACTION) {
      dispatch(EmitterEvents.RELOAD_ACCOUNTS);
    }
  }

  useEffect(() => {
    socket.on(
      "channel:notification",
      ({
        message,
        user_id,
        type,
      }: {
        message: string;
        user_id: number;
        type: keyof typeof MessageTypes | keyof typeof ServerNotificationTypes;
      }) => {
        const user = sessionStorage.getItem("authUser");
        if (user) {
          const authUser = JSON.parse(user);
          if (authUser.user.id === user_id) {
            setNotificationType(type);
            setNotificationMesssage(message);
            setShowNotification(true);
            soecketEvents({ message, user_id, type });
          }
        }
      }
    );
    subscribe(
      EmitterEvents.SHOW_NOTIFICATION,
      ({
        type,
        message,
      }: {
        type: keyof typeof MessageTypes;
        message: string;
      }) => {
        setNotificationType(type);
        setNotificationMesssage(message);
        setShowNotification(true);
      }
    );
    return () => {
      unsubscribe(EmitterEvents.SHOW_NOTIFICATION);
      socket.off("channel:notification");
    };
  }, []);

  return (
    <>
      <RouterProvider router={router} fallbackElement={<Loading />} />
      {showNotification && (
        <MessageModal
          message={notificationMessage}
          type={notificationType}
          closeModal={() => closeModal()}
        />
      )}
    </>
  );
}

export default App;
