"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from "@/lib/notifications";

export function NotificationToggle() {
  const [permission, setPermission] = useState<string>("default");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const sup = isNotificationSupported();
    setSupported(sup);
    if (sup) {
      setPermission(getNotificationPermission());
    }
  }, []);

  const handleClick = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? "granted" : "denied");
  }, []);

  if (!supported) return null;
  if (permission === "denied") return null;

  if (permission === "granted") {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5 text-xs opacity-70">
        Notifications On
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} className="text-xs">
      Enable Notifications
    </Button>
  );
}
