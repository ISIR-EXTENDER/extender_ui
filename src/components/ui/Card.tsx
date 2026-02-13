import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
};

export function Card({ children, className, as = "section" }: CardProps) {
  const Element = as;
  return <Element className={`card ${className ?? ""}`.trim()}>{children}</Element>;
}
