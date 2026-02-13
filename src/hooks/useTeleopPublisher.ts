import { useCallback, useEffect } from "react";

import { wsClient } from "../services/wsClient";
import { useTeleopStore } from "../store/teleopStore";

export function useTeleopPublisher() {
  const mode = useTeleopStore((s) => s.mode);
  const z = useTeleopStore((s) => s.z);
  const rz = useTeleopStore((s) => s.rz);
  const setJoy = useTeleopStore((s) => s.setJoy);
  const setRot = useTeleopStore((s) => s.setRot);
  const setZ = useTeleopStore((s) => s.setZ);
  const setRz = useTeleopStore((s) => s.setRz);
  const nextSeq = useTeleopStore((s) => s.nextSeq);
  const buildTeleopCommand = useTeleopStore((s) => s.buildTeleopCommand);

  const sendTeleop = useCallback(() => {
    const seq = nextSeq();
    const payload = buildTeleopCommand(seq);
    wsClient.send(payload);
  }, [buildTeleopCommand, nextSeq]);

  const sendZero = useCallback(() => {
    const seq = nextSeq();
    wsClient.send({
      type: "teleop_cmd",
      seq,
      mode,
      linear: { x: 0, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: 0 },
    });
  }, [mode, nextSeq]);

  const stopAndZero = useCallback(() => {
    setJoy(0, 0);
    setRot(0, 0);
    setZ(0);
    setRz(0);
    sendZero();
  }, [sendZero, setJoy, setRot, setRz, setZ]);

  useEffect(() => {
    const rotationActive = mode === 0 || mode === 1 || mode === 3;
    const translationActive = mode === 0 || mode === 2 || mode === 3;

    if (!translationActive && z !== 0) {
      setZ(0);
    }
    if (!rotationActive && rz !== 0) {
      setRz(0);
    }
  }, [mode, rz, setRz, setZ, z]);

  useEffect(() => {
    sendTeleop();
  }, [sendTeleop]);

  useEffect(() => {
    const interval = setInterval(() => {
      sendTeleop();
    }, 10);

    return () => clearInterval(interval);
  }, [sendTeleop]);

  return {
    stopAndZero,
  };
}
