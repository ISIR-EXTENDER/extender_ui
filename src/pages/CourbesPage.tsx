import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { useTeleopStore } from "../store/teleopStore";
import { useUiStore } from "../store/uiStore";
import { useWidgetConfig } from "../hooks/useWidgetConfig";

export function CourbesPage() {
  const joyX = useTeleopStore((s) => s.joyX);
  const joyY = useTeleopStore((s) => s.joyY);
  const rotX = useTeleopStore((s) => s.rotX);
  const rotY = useTeleopStore((s) => s.rotY);
  const scaleX = useTeleopStore((s) => s.scaleX);
  const scaleY = useTeleopStore((s) => s.scaleY);
  const maxVelocity = useTeleopStore((s) => s.maxVelocity);
  const wsState = useTeleopStore((s) => s.wsState);
  const jointPositions = useUiStore((s) => s.jointPositions);
  const { isVisible, titleFor } = useWidgetConfig();

  const chartStartRef = useRef<number>(0);
  const [chartData, setChartData] = useState<
    Array<{
      t: number;
      lin: number;
      ang: number;
      err: number;
      gain: number;
      jv1: number;
      jv2: number;
      jp1: number;
      jp2: number;
    }>
  >([]);

  useEffect(() => {
    if (chartStartRef.current === 0) {
      chartStartRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const t = (Date.now() - chartStartRef.current) / 1000;
      const lin = Math.hypot(joyX * scaleX, joyY * scaleY);
      const ang = Math.hypot(rotX * scaleX, rotY * scaleY);
      const err =
        wsState?.cmd_age_ms != null && wsState?.watchdog_timeout_ms
          ? Math.min(1, wsState.cmd_age_ms / wsState.watchdog_timeout_ms)
          : 0;
      setChartData((prev) => {
        const last = prev[prev.length - 1];
        const dt = last ? Math.max(0.001, t - last.t) : 0.2;
        const jv1 = last ? (jointPositions[0] - last.jp1) / dt : 0;
        const jv2 = last ? (jointPositions[1] - last.jp2) / dt : 0;
        const next = [
          ...prev,
          {
            t,
            lin,
            ang,
            err,
            gain: maxVelocity,
            jv1,
            jv2,
            jp1: jointPositions[0],
            jp2: jointPositions[1],
          },
        ];
        return next.slice(-120);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [joyX, joyY, rotX, rotY, scaleX, scaleY, wsState, maxVelocity, jointPositions]);

  if (!isVisible("curves.plots")) {
    return <main className="layout" />;
  }

  return (
    <main className="layout">
      <section className="card">
        <h2>{titleFor("curves.plots", "Courbes")}</h2>
        <div className="curves-grid">
          <div className="chart-card">
            <h3>Linear Velocity</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="t" tickFormatter={(v) => `${v.toFixed(0)}s`} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="lin" stroke="#22c55e" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="chart-card">
            <h3>Angular Velocity</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="t" tickFormatter={(v) => `${v.toFixed(0)}s`} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ang" stroke="#f97316" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="chart-card">
            <h3>Joint Velocities</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="t" tickFormatter={(v) => `${v.toFixed(0)}s`} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="jv1" stroke="#3b82f6" dot={false} />
                  <Line type="monotone" dataKey="jv2" stroke="#8b5cf6" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="chart-card">
            <h3>Error Norms</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="t" tickFormatter={(v) => `${v.toFixed(0)}s`} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="err" stroke="#ef4444" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="chart-card">
            <h3>Controller Gains</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="t" tickFormatter={(v) => `${v.toFixed(0)}s`} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="gain" stroke="#14b8a6" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
