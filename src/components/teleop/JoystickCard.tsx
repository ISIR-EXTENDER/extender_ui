import type { ReactNode } from "react";

type JoystickCardProps = {
  title: string;
  children: ReactNode;
};

export function JoystickCard({ title, children }: JoystickCardProps) {
  return (
    <div className="card joystick-panel">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
