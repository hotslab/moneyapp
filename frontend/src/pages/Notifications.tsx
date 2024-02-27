import { useEffect, useState } from "react";
import axiosApi from "../api";
import { AxiosError, AxiosResponse } from "axios";
import NotificationModal from "../components/NotificationModal";
import clsx from "clsx";
import Loading from "../components/Loading";
import useEventEmitter from "../services/useEventEmitter";
import EmitterEvents from "../types/emitterEvents";
import MessageTypes from "../types/messageTypes";
import parseAxiosError from "../services/useParseAxiosError";

function Users() {
  const { dispatch } = useEventEmitter();
  let [notifications, setNotifications] = useState<Array<any>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showMessageModal, setShowMessageModal] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  function openMessageModal(notifcation: any) {
    setSelectedNotification(notifcation);
    setShowMessageModal(true);
  }

  function markAsRead(id: number) {
    axiosApi.put(`api/notifications/${id}`).then(
      () => getNotifications(),
      (error: AxiosError) => {
        const message = parseAxiosError(error);
        dispatch(EmitterEvents.SHOW_NOTIFICATION, {
          message: message,
          type: MessageTypes.error,
        });
      }
    );
  }

  function closeNotificationModal() {
    if (!selectedNotification.read) markAsRead(selectedNotification.id);
    setSelectedNotification(null);
    setShowMessageModal(false);
  }

  function getNotifications() {
    setLoading(true);
    axiosApi.get(`api/notifications`).then(
      (response: AxiosResponse) => {
        setNotifications(response.data.notifications);
        dispatch(EmitterEvents.SET_NOTIFICATIONS, response.data.notifications);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }

  useEffect(() => getNotifications(), []);

  return (
    <>
      {!loading ? (
        <div>
          <header className="bg-white shadow">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                Notifications {" - "}
                <span className="text-blue-600">{notifications.length}</span>
              </h1>
            </div>
          </header>
          <main className="mx-4">
            <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
              <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-200 uppercase bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        Type Of Notification
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Has Been Read
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Created At
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((notification, index) => (
                      <tr
                        key={index}
                        className="bg-white border-b hover:bg-gray-200"
                      >
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                        >
                          {notification.type}
                        </th>
                        <th
                          scope="row"
                          className={clsx(
                            "px-6 py-4 font-medium whitespace-nowrap",
                            notification.read
                              ? "text-green-700"
                              : "text-red-700"
                          )}
                        >
                          {notification.read ? "READ" : "UNREAD"}
                        </th>
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                        >
                          {notification.createdAt}
                        </th>
                        <td className="text-gray-800 px-6 py-4">
                          <button
                            onClick={() => openMessageModal(notification)}
                            title="Pay this user"
                            className="font-medium text-green-600 dark:text-green-500 hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {notifications.length === 0 && (
                  <div className="w-full text-2xl text-gray-700 py-6 flex justify-center items-center">
                    <span>No records found</span>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      ) : (
        <Loading />
      )}
      {showMessageModal && (
        <NotificationModal
          notification={selectedNotification}
          closeNotificationModal={() => closeNotificationModal()}
        />
      )}
    </>
  );
}

export default Users;
