"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LogViewer } from "../logs/LogViewer";
import {
  useDeleteTask,
  useStopTask,
  useRetryTask,
} from "@/hooks/useTasksQuery";
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  TaskStatus,
} from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { toast } from "sonner";
import type { Task } from "@/generated/prisma/client";

interface TaskCardDetailProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskCardDetail({
  task,
  open,
  onOpenChange,
}: TaskCardDetailProps) {
  const deleteTask = useDeleteTask();
  const stopTask = useStopTask();
  const retryTask = useRetryTask();

  const handleStop = () => {
    stopTask.mutate(task.id, {
      onSuccess: () => toast.success("Task stopped"),
      onError: () => toast.error("Failed to stop task"),
    });
  };

  const handleRetry = () => {
    retryTask.mutate(task.id, {
      onSuccess: () => {
        toast.success("Task queued for retry");
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to retry task"),
    });
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        toast.success("Task deleted");
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to delete task"),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-left">{task.title}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {/* Status & Priority */}
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={STATUS_COLORS[task.status]}
            >
              {task.status}
            </Badge>
            <Badge
              variant="outline"
              className={PRIORITY_COLORS[task.priority]}
            >
              {PRIORITY_LABELS[task.priority]}
            </Badge>
            {task.retryCount > 0 && (
              <span className="text-xs text-muted-foreground">
                Retries: {task.retryCount}/{task.maxRetries}
              </span>
            )}
          </div>

          {/* Timestamps */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>Created: {new Date(task.createdAt).toLocaleString()}</div>
            {task.startedAt && (
              <div>Started: {new Date(task.startedAt).toLocaleString()}</div>
            )}
            {task.completedAt && (
              <div>
                Completed: {new Date(task.completedAt).toLocaleString()}
                {task.startedAt && (
                  <span>
                    {" "}
                    ({formatDuration(new Date(task.startedAt), new Date(task.completedAt))})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <>
              <Separator />
              <div>
                <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                  Description
                </h4>
                <p className="whitespace-pre-wrap text-sm">{task.description}</p>
              </div>
            </>
          )}

          {/* Criteria */}
          {task.criteria && (
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                Acceptance Criteria
              </h4>
              <p className="whitespace-pre-wrap text-sm">{task.criteria}</p>
            </div>
          )}

          {/* Repo URL */}
          {task.repoUrl && (
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                Working Directory
              </h4>
              <code className="text-xs">{task.repoUrl}</code>
            </div>
          )}

          {/* Error */}
          {task.error && (
            <div className="rounded-md bg-red-500/10 p-3">
              <h4 className="mb-1 text-xs font-medium text-red-400">Error</h4>
              <p className="text-sm text-red-300">{task.error}</p>
            </div>
          )}

          <Separator />

          {/* Logs */}
          <div className="flex min-h-0 flex-1 flex-col">
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">
              Agent Logs
            </h4>
            <LogViewer
              taskId={task.id}
              isActive={task.status === TaskStatus.IN_PROGRESS}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {task.status === TaskStatus.IN_PROGRESS && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStop}
                disabled={stopTask.isPending}
              >
                Stop Agent
              </Button>
            )}
            {task.status === TaskStatus.FAILED && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRetry}
                disabled={retryTask.isPending}
              >
                Retry
              </Button>
            )}
            {(task.status === TaskStatus.TODO ||
              task.status === TaskStatus.DONE ||
              task.status === TaskStatus.FAILED) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={deleteTask.isPending}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
