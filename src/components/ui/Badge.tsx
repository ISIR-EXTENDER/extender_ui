import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return <div className={`badge ${className ?? ""}`.trim()}>{children}</div>;
}
