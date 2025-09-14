import { useState, useEffect, useCallback } from "react";

const useWebSocket = (url) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received:", data);
      setLastMessage(data);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback(
    (message) => {
      if (socket && isConnected) {
        socket.send(JSON.stringify(message));
      }
    },
    [socket, isConnected]
  );

  return { isConnected, lastMessage, sendMessage };
};

export default useWebSocket;

