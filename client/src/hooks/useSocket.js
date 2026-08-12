import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export const useSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!socketInstance) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      if (socketUrl) {
        socketInstance = io(socketUrl);
      } else {
        console.warn('Missing NEXT_PUBLIC_SOCKET_URL, socket connection disabled');
      }
    }
    setSocket(socketInstance);
    
    return () => {
      // Don't disconnect globally on unmount of one component
    };
  }, []);

  return socket;
};
