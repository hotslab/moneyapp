import { io } from "socket.io-client";

const useSocket = () => {
  const socket = io(process.env.REACT_APP_SOCKET_URL as string);
  return [ socket ];
};

export default useSocket
