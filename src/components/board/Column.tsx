"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import { TaskCard } from "./TaskCard";
import { COLUMN_TITLES, type TaskStatusType } from "@/lib/types";
import type { Task } from "@/generated/prisma/client";

interface ColumnProps {
  status: TaskStatusType;
  tasks: Task[];
}

export function Column({ status, tasks }: ColumnProps) {
  return (
    <div className="flex w-80 min-w-80 flex-col rounded-lg bg-muted/50">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {COLUMN_TITLES[status]}
        </h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2 ${
              snapshot.isDraggingOver ? "bg-accent/50" : ""
            }`}
          >
            {tasks.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground/50">
                No tasks
              </div>
            )}
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? "opacity-80" : ""}
                  >
                    <TaskCard task={task} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
