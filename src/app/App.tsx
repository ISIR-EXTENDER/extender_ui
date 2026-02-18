import { useEffect, useMemo, useState } from "react";

import { loadApplicationsFromLocalStorage } from "./applications";
import { TopBar } from "../components/layout/TopBar";
import { ApplicationPage } from "../pages/ApplicationPage";
import { CanvasDesignPage } from "../pages/CanvasDesignPage";
import { HomePage } from "../pages/HomePage";
import { useUiStore } from "../store/uiStore";
import { useWsConnection } from "../hooks/useWsConnection";
import { useTeleopPublisher } from "../hooks/useTeleopPublisher";
import { useThemeMode } from "../hooks/useThemeMode";
import { type AppRoute, useAppRouter } from "./router";

export default function App() {
  useWsConnection();
  useThemeMode();
  const { stopAndZero } = useTeleopPublisher();
  const { route, navigate } = useAppRouter();
  const focusMode = useUiStore((s) => s.focusMode);
  const setIsEditorMode = useUiStore((s) => s.setIsEditorMode);
  const [hasUnsavedCanvasChanges, setHasUnsavedCanvasChanges] = useState(false);
  const applicationTitle = useMemo(() => {
    if (route.kind !== "application") return null;
    const match = loadApplicationsFromLocalStorage().find(
      (application) => application.id === route.appId
    );
    return match?.name ?? route.appId;
  }, [route]);
  const pageTitle =
    route.kind === "canvas-design"
      ? "Canvas Design"
      : route.kind === "application"
        ? applicationTitle ?? route.appId
        : "Extender Tablet Interface";

  useEffect(() => {
    setIsEditorMode(route.kind === "canvas-design" && !focusMode);
  }, [focusMode, route.kind, setIsEditorMode]);

  const guardedNavigate = (nextRoute: AppRoute) => {
    const leavingCanvasDesign = route.kind === "canvas-design" && nextRoute.kind !== "canvas-design";
    if (
      leavingCanvasDesign &&
      hasUnsavedCanvasChanges &&
      !window.confirm("You have unsaved screen changes. Leave without saving?")
    ) {
      return;
    }
    navigate(nextRoute);
  };

  return (
    <div className="app">
      <TopBar
        onStop={stopAndZero}
        onHome={() => guardedNavigate({ kind: "home" })}
        onOpenCanvasDesign={() => guardedNavigate({ kind: "canvas-design" })}
        isCanvasDesign={route.kind === "canvas-design"}
        pageTitle={pageTitle}
      />
      {route.kind === "home" ? (
        <HomePage
          onOpenCanvasDesign={() => guardedNavigate({ kind: "canvas-design" })}
          onOpenApplication={(applicationId) =>
            guardedNavigate({ kind: "application", appId: applicationId, screenId: null })
          }
        />
      ) : route.kind === "canvas-design" ? (
        <CanvasDesignPage
          focusOnly={focusMode}
          onDirtyChange={setHasUnsavedCanvasChanges}
        />
      ) : (
        <ApplicationPage
          applicationId={route.appId}
          routeScreenId={route.screenId}
          onNavigateToScreen={(screenId) =>
            navigate({ kind: "application", appId: route.appId, screenId })
          }
        />
      )}
    </div>
  );
}
