import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function Button({ className, children, ...rest }: ButtonProps) {
  return (
    <button className={`header-button ${className ?? ""}`.trim()} {...rest}>
      {children}
    </button>
  );
}
