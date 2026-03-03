"use client";

import { useCallback, useMemo } from "react";
import {
  DragDropContext,
  type DropResult,
} from "@hello-pangea/dnd";
import { Column } from "./Column";
import { CreateTaskForm } from "../forms/CreateTaskForm";
import { DispatcherToggle } from "./DispatcherToggle";
import { useTasksQuery, useUpdateTask } from "@/hooks/useTasksQuery";
import { useEventSource } from "@/hooks/useEventSource";
import { COLUMN_ORDER, TaskStatus } from "@/lib/types";
import type { Task } from "@/generated/prisma/client";

export function Board() {
  useEventSource();
  const { data: tasks = [], isLoading } = useTasksQuery();
  const updateTask = useUpdateTask();

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    for (const task of tasks) {
      const status = task.status === "failed" ? "done" : task.status;
      if (grouped[status]) {
        grouped[status].push(task);
      }
    }
    return grouped;
  }, [tasks]);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const { draggableId, destination } = result;
      const newStatus = destination.droppableId;

      // Prevent manual drag into "in_progress" - only dispatcher does this
      if (newStatus === TaskStatus.IN_PROGRESS) return;

      const task = tasks.find((t) => t.id === draggableId);
      if (!task) return;

      // Don't update if status hasn't changed
      if (task.status === newStatus) return;

      // Don't allow dragging failed/in_progress tasks directly
      if (
        task.status === TaskStatus.IN_PROGRESS ||
        task.status === TaskStatus.FAILED
      )
        return;

      updateTask.mutate({
        id: draggableId,
        status: newStatus,
        position: destination.index,
      });
    },
    [tasks, updateTask]
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading board...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold">AgentBoard</h1>
        <div className="flex items-center gap-3">
          <DispatcherToggle />
          <CreateTaskForm />
        </div>
      </header>

      <div className="flex flex-1 gap-6 overflow-x-auto p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          {COLUMN_ORDER.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={tasksByStatus[status] || []}
            />
          ))}
        </DragDropContext>
      </div>
    </div>
  );
}
