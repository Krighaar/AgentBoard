export const TaskStatus = {
  TODO: "todo",
  READY: "ready",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  FAILED: "failed",
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

export const COLUMN_ORDER: TaskStatusType[] = [
  TaskStatus.TODO,
  TaskStatus.READY,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
];

export const COLUMN_TITLES: Record<TaskStatusType, string> = {
  [TaskStatus.TODO]: "To Do",
  [TaskStatus.READY]: "Ready",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.DONE]: "Done",
  [TaskStatus.FAILED]: "Failed",
};

export const PRIORITY_LABELS: Record<number, string> = {
  1: "High",
  2: "Medium",
  3: "Low",
};

export const PRIORITY_COLORS: Record<number, string> = {
  1: "bg-red-500/10 text-red-500 border-red-500/20",
  2: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  3: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-500/10 text-slate-400",
  ready: "bg-amber-500/10 text-amber-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  done: "bg-green-500/10 text-green-400",
  failed: "bg-red-500/10 text-red-400",
};
