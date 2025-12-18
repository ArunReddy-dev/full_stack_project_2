export type TaskStatus = "TO_DO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "high" | "medium" | "low";

export interface Task {
  t_id: string;
  title: string;
  description: string;
  created_by: string;
  assigned_to?: string;
  assigned_by?: string;
  assigned_at?: string;
  updated_by?: string;
  updated_at?: string;
  priority: TaskPriority;
  status: TaskStatus;
  reviewer?: string;
  expected_closure: string;
  actual_closure?: string;
}

export interface TaskRemark {
  id: string;
  task_id: string;
  content: string;
  created_by: string;
  created_at: string;
}

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  TO_DO: {
    label: "To Do",
    color: "text-blue-700",
    bgColor: "bg-todo",
    borderColor: "border-todo-border",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-amber-700",
    bgColor: "bg-inprogress",
    borderColor: "border-inprogress-border",
  },
  REVIEW: {
    label: "Review",
    color: "text-orange-700",
    bgColor: "bg-review",
    borderColor: "border-review-border",
  },
  DONE: {
    label: "Done",
    color: "text-green-700",
    bgColor: "bg-done",
    borderColor: "border-done-border",
  },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bgColor: string }
> = {
  high: { label: "High", color: "text-red-700", bgColor: "bg-red-100" },
  medium: { label: "Medium", color: "text-amber-700", bgColor: "bg-amber-100" },
  low: { label: "Low", color: "text-green-700", bgColor: "bg-green-100" },
};
