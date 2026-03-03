"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/utils";

export function ElapsedTime({ start }: { start: Date }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{formatDuration(start)}</>;
}
