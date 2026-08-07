import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export const useSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000');
    }
    setSocket(socketInstance);
    
    return () => {
      // Don't disconnect globally on unmount of one component
    };
  }, []);

  return socket;
};
