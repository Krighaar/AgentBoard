"use client";

import { useEffect } from "react";

interface KeyboardShortcutHandlers {
  onNewTask: () => void;
  onToggleDispatcher: () => void;
  onShowHelp: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire when typing in inputs or textareas
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't fire when modifier keys are held (except shift for ?)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case "n":
          e.preventDefault();
          handlers.onNewTask();
          break;
        case "d":
          e.preventDefault();
          handlers.onToggleDispatcher();
          break;
        case "?":
          e.preventDefault();
          handlers.onShowHelp();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
