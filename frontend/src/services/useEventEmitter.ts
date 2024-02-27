import EmitterEvents from "../types/emitterEvents";

let events: any = {};

const useEventEmitter = () => {
  return {
    dispatch: (event: keyof typeof EmitterEvents, data: any = null) => {
      if (!events[event]) return;
      events[event].forEach((callback: any) => callback(data));
    },
    subscribe: (event: keyof typeof EmitterEvents, callback: (data: any) => any) => {
      if (!events[event]) events[event] = [];
      events[event].push(callback);
    },
    unsubscribe: (event: keyof typeof EmitterEvents) => {
      if (!events[event]) return;
      delete events[event];
    },
  };
};

export default useEventEmitter;
