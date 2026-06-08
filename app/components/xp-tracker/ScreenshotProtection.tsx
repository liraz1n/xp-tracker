import { useEffect, useState } from "react";

const PROTECTED_KEYS = new Set(["PrintScreen", "F12"]);

function isProtectedShortcut(event: KeyboardEvent) {
  const key = event.key.toLowerCase();

  return (
    PROTECTED_KEYS.has(event.key) ||
    ((event.ctrlKey || event.metaKey) && ["p", "s", "u"].includes(key)) ||
    ((event.ctrlKey || event.metaKey) && event.shiftKey && ["i", "j", "c", "s"].includes(key))
  );
}

export function ScreenshotProtection() {
  const [overlayMessage, setOverlayMessage] = useState("");
  const [windowBlurred, setWindowBlurred] = useState(false);
  const [devToolsDetected, setDevToolsDetected] = useState(false);

  useEffect(() => {
    let overlayTimeout: ReturnType<typeof setTimeout> | null = null;

    function showTemporaryOverlay(message: string) {
      setOverlayMessage(message);

      if (overlayTimeout) {
        clearTimeout(overlayTimeout);
      }

      overlayTimeout = setTimeout(() => {
        setOverlayMessage("");
      }, 2600);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!isProtectedShortcut(event)) return;

      event.preventDefault();
      event.stopPropagation();
      showTemporaryOverlay("Captura, impressão e inspeção foram bloqueadas nesta área.");
    }

    function handleContextMenu(event: MouseEvent) {
      event.preventDefault();
      showTemporaryOverlay("Menu de contexto bloqueado para proteger os dados do painel.");
    }

    function handleCopy(event: ClipboardEvent) {
      const target = event.target as HTMLElement | null;

      if (target?.closest("input, textarea")) return;

      event.preventDefault();
      showTemporaryOverlay("Cópia bloqueada para proteger os dados do painel.");
    }

    function handleBeforePrint(event: Event) {
      event.preventDefault();
      showTemporaryOverlay("Impressão bloqueada neste painel.");
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        setWindowBlurred(true);
        return;
      }

      setWindowBlurred(false);
    }

    function handleBlur() {
      setWindowBlurred(true);
    }

    function handleFocus() {
      setWindowBlurred(false);
    }

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("copy", handleCopy, true);
    window.addEventListener("beforeprint", handleBeforePrint);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    const devToolsInterval = window.setInterval(() => {
      const widthGap = Math.abs(window.outerWidth - window.innerWidth);
      const heightGap = Math.abs(window.outerHeight - window.innerHeight);

      setDevToolsDetected(widthGap > 180 || heightGap > 180);
    }, 1200);

    return () => {
      if (overlayTimeout) {
        clearTimeout(overlayTimeout);
      }

      window.clearInterval(devToolsInterval);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("copy", handleCopy, true);
      window.removeEventListener("beforeprint", handleBeforePrint);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const activeOverlayMessage =
    overlayMessage ||
    (devToolsDetected
      ? "Inspeção detectada. O painel ficará oculto enquanto a ferramenta estiver aberta."
      : windowBlurred
        ? "Painel protegido enquanto a janela não está ativa."
        : "");

  return (
    <>
      {activeOverlayMessage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-6 text-center backdrop-blur-xl">
          <div className="max-w-md rounded-3xl border border-yellow-500/25 bg-zinc-950 p-6 shadow-[0_0_60px_rgba(234,179,8,0.18)]">
            <p className="text-sm font-black uppercase tracking-wide text-yellow-400">
              Proteção ativa
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Conteúdo oculto
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {activeOverlayMessage}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
