import { useCallback, useEffect } from "react";

import { wsClient } from "../services/wsClient";
import { useTeleopStore } from "../store/teleopStore";

export function useTeleopPublisher() {
  const mode = useTeleopStore((s) => s.mode);
  const z = useTeleopStore((s) => s.z);
  const rz = useTeleopStore((s) => s.rz);
  const wsStatus = useTeleopStore((s) => s.wsStatus);

  // Read from store imperatively at call time to keep callbacks stable
  // and avoid re-render cascades from nextSeq() state mutations.
  const sendTeleop = useCallback(() => {
    const state = useTeleopStore.getState();
    const seq = state.nextSeq();
    const payload = state.buildTeleopCommand(seq);
    wsClient.send(payload);
  }, []);

  const sendZero = useCallback(() => {
    const state = useTeleopStore.getState();
    const seq = state.nextSeq();
    wsClient.send({
      type: "teleop_cmd",
      seq,
      mode: state.mode,
      linear: { x: 0, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: 0 },
    });
  }, []);

  const stopAndZero = useCallback(() => {
    const state = useTeleopStore.getState();
    state.setJoy(0, 0);
    state.setRot(0, 0);
    state.setZ(0);
    state.setRz(0);
    sendZero();
  }, [sendZero]);

  // Clear axes that don't apply to the current mode
  useEffect(() => {
    const rotationActive = mode === 0 || mode === 1 || mode === 3;
    const translationActive = mode === 0 || mode === 2 || mode === 3;
    const state = useTeleopStore.getState();

    if (!translationActive && z !== 0) {
      state.setZ(0);
    }
    if (!rotationActive && rz !== 0) {
      state.setRz(0);
    }
  }, [mode, rz, z]);

  // Periodic teleop heartbeat at ~30Hz
  useEffect(() => {
    const interval = setInterval(sendTeleop, 33);
    return () => clearInterval(interval);
  }, [sendTeleop]);

  // Enforce safe defaults on startup/reconnect.
  useEffect(() => {
    if (wsStatus !== "connected") return;
    stopAndZero();
  }, [stopAndZero, wsStatus]);

  return { stopAndZero };
}
