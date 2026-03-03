export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function sendNotification(title: string, options?: NotificationOptions) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;
  // Only send when tab is not focused
  if (document.hasFocus()) return;
  const notification = new Notification(title, {
    icon: "/favicon.ico",
    ...options,
  });
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}
