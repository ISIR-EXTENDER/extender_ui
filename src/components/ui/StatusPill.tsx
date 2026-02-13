import type { ReactNode } from "react";

import type { WsStatus } from "../../types/ws";

type StatusPillProps = {
  status: WsStatus;
  children?: ReactNode;
};

export function StatusPill({ status, children }: StatusPillProps) {
  return (
    <div className={`status ${status}`}>
      {children ?? status}
    </div>
  );
}
