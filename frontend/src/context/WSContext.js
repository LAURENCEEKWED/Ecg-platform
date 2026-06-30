import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WSContext = createContext(null);

export function WSProvider({ children }) {
  const { user } = useAuth();
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const listenersRef = useRef({});
  const reconnectTimerRef = useRef(null);

  const connect = useCallback(() => {
    if (!user) return;
    const wsUrl = `ws://localhost:5000/ws?userId=${user.id}&role=${user.role}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => { setConnected(true); console.log('WebSocket connected'); };
    ws.onclose = () => {
      setConnected(false);
      reconnectTimerRef.current = setTimeout(connect, 5000);
    };
    ws.onerror = () => ws.close();
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastEvent(data);
        if (data.type && listenersRef.current[data.type]) {
          listenersRef.current[data.type].forEach(fn => fn(data));
        }
      } catch {}
    };

    wsRef.current = ws;
  }, [user]);

  useEffect(() => {
    if (user) connect();
    return () => {
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [user, connect]);

  const subscribe = useCallback((type, fn) => {
    if (!listenersRef.current[type]) listenersRef.current[type] = new Set();
    listenersRef.current[type].add(fn);
    return () => listenersRef.current[type]?.delete(fn);
  }, []);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return (
    <WSContext.Provider value={{ connected, lastEvent, subscribe, send }}>
      {children}
    </WSContext.Provider>
  );
}

export const useWS = () => useContext(WSContext);
