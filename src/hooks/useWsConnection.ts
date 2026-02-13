import { useEffect } from "react";

import { wsClient } from "../services/wsClient";
import { useTeleopStore } from "../store/teleopStore";

export function useWsConnection() {
  const setWsStatus = useTeleopStore((s) => s.setWsStatus);
  const setWsState = useTeleopStore((s) => s.setWsState);

  useEffect(() => {
    const unsubscribeStatus = wsClient.onStatus(setWsStatus);
    const unsubscribeMessage = wsClient.onMessage((msg) => {
      setWsState(msg);
    });

    wsClient.connect();

    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
      wsClient.disconnect();
    };
  }, [setWsState, setWsStatus]);
}
