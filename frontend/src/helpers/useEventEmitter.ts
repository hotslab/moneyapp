enum Events {
  SET_AUTH_USER = "set_auth_user",
  SHOW_LOADING = "show_loading",
  SHOW_NOTIFICATION = "show_notification",
}

let events: any = {};

const useEventEmitter = () => {
  return {
    dispatch: (event: string, data: any = null) => {
      if (!events[event]) return;
      events[event].forEach((callback: any) => callback(data));
      console.log(events, "DIS");
    },
    subscribe: (event: string, callback: (data: any) => any) => {
      if (!events[event]) events[event] = [];
      console.log(events);
      events[event].push(callback);
      console.log(events, "SUB");
    },
    unsubscribe: (event: string) => {
      if (!events[event]) return;
      delete events[event];
      console.log(events, "UNSUB");
    },
  };
};

export default useEventEmitter;
