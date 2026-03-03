"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskCardDetail } from "./TaskCardDetail";
import { ElapsedTime } from "./ElapsedTime";
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  TaskStatus,
} from "@/lib/types";
import type { Task } from "@/generated/prisma/client";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <Card
        className="cursor-pointer gap-0 border-border/50 p-3 transition-colors hover:border-border"
        onClick={() => setDetailOpen(true)}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium leading-snug">{task.title}</h3>
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] ${PRIORITY_COLORS[task.priority]}`}
          >
            {PRIORITY_LABELS[task.priority]}
          </Badge>
        </div>

        {task.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
            {task.description}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2">
          <Badge
            variant="secondary"
            className={`text-[10px] ${STATUS_COLORS[task.status]}`}
          >
            {task.status === "in_progress" ? "Running" : task.status}
          </Badge>

          {task.status === TaskStatus.IN_PROGRESS && task.startedAt && (
            <span className="text-[10px] text-muted-foreground">
              <ElapsedTime start={new Date(task.startedAt)} />
            </span>
          )}

          {task.status === TaskStatus.FAILED && task.error && (
            <span className="truncate text-[10px] text-red-400">
              {task.error}
            </span>
          )}

          {task.retryCount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              retry {task.retryCount}/{task.maxRetries}
            </span>
          )}
        </div>
      </Card>

      <TaskCardDetail
        task={task}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
