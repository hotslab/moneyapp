import EmitterEvents from "../types/emitterEvents";

let events: any = {};

const useEventEmitter = () => {
  return {
    dispatch: (event: keyof typeof EmitterEvents, data: any = null) => {
      if (!events[event]) return;
      events[event].forEach((callback: any) => callback(data));
      console.log(events, "DIS");
    },
    subscribe: (event: keyof typeof EmitterEvents, callback: (data: any) => any) => {
      if (!events[event]) events[event] = [];
      console.log(events);
      events[event].push(callback);
      console.log(events, "SUB");
    },
    unsubscribe: (event: keyof typeof EmitterEvents) => {
      if (!events[event]) return;
      delete events[event];
      console.log(events, "UNSUB");
    },
  };
};

export default useEventEmitter;
