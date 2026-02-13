import { useCallback, useEffect, useMemo, useState } from "react";

export type AppRoute =
  | { kind: "home" }
  | { kind: "canvas-design" }
  | { kind: "application"; appId: string; screenId: string | null };

const normalizePath = (path: string) => {
  if (!path) return "/";
  if (path === "/") return "/";
  return `/${path.replace(/^\/+/, "").replace(/\/+$/, "")}`;
};

const parseRoute = (path: string): AppRoute => {
  const normalized = normalizePath(path);
  if (normalized === "/") {
    return { kind: "home" };
  }
  if (normalized === "/canvas-design") {
    return { kind: "canvas-design" };
  }

  const parts = normalized.split("/").filter(Boolean);
  if (parts[0] === "application" && typeof parts[1] === "string" && parts[1].trim()) {
    return {
      kind: "application",
      appId: decodeURIComponent(parts[1]),
      screenId: parts[2] ? decodeURIComponent(parts[2]) : null,
    };
  }

  return { kind: "home" };
};

export const appRouteToPath = (route: AppRoute) => {
  if (route.kind === "home") return "/";
  if (route.kind === "canvas-design") return "/canvas-design";
  const base = `/application/${encodeURIComponent(route.appId)}`;
  return route.screenId ? `${base}/${encodeURIComponent(route.screenId)}` : base;
};

export function useAppRouter() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const onPopState = () => {
      setPath(normalizePath(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const route = useMemo(() => parseRoute(path), [path]);

  const navigate = useCallback((nextRoute: AppRoute) => {
    const nextPath = appRouteToPath(nextRoute);
    const normalized = normalizePath(nextPath);
    if (normalized === normalizePath(window.location.pathname)) {
      setPath(normalized);
      return;
    }
    window.history.pushState({}, "", normalized);
    setPath(normalized);
  }, []);

  return { route, navigate };
}

