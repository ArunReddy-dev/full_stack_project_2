import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Task, TaskStatus, TASK_STATUS_CONFIG } from "@/types/task";
import { useAuth } from "@/contexts/AuthContext";
import TaskCard from "./TaskCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskKanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask?: () => void;
  onTaskModified?: () => void;
  openTaskId?: string;
}

const COLUMNS: TaskStatus[] = ["TO_DO", "IN_PROGRESS", "REVIEW", "DONE"];

const TaskKanbanBoard = ({
  tasks,
  onTaskUpdate,
  onAddTask,
  onTaskModified,
  openTaskId,
}: TaskKanbanBoardProps) => {
  const { user } = useAuth();
  const [draggingOver, setDraggingOver] = useState<string | null>(null);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  // Check if user can move task to specific status
  const canMoveToStatus = (
    task: Task,
    fromStatus: TaskStatus,
    targetStatus: TaskStatus
  ): { allowed: boolean; reason?: string } => {
    if (!user) return { allowed: false, reason: "Not authenticated" };

    // Admin cannot drag and drop at all
    if (user.role === "admin") {
      return {
        allowed: false,
        reason: "Admins cannot change task status by drag and drop",
      };
    }

    // Developer/Employee can only move from TO_DO -> IN_PROGRESS -> REVIEW
    if (user.role === "developer") {
      // Can only move tasks assigned to them
      if (String(task.assigned_to) !== String(user.emp_id)) {
        return {
          allowed: false,
          reason: "You can only move tasks assigned to you",
        };
      }
      // TO_DO -> IN_PROGRESS
      if (fromStatus === "TO_DO" && targetStatus === "IN_PROGRESS") {
        return { allowed: true };
      }
      // IN_PROGRESS -> REVIEW
      if (fromStatus === "IN_PROGRESS" && targetStatus === "REVIEW") {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Employees can only move: To Do → In Progress → Review",
      };
    }

    // Manager can move tasks from REVIEW -> TO_DO or REVIEW -> DONE
    if (user.role === "manager") {
      if (
        fromStatus === "REVIEW" &&
        (targetStatus === "TO_DO" || targetStatus === "DONE")
      ) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Managers can only move tasks from Review to To Do or Done",
      };
    }

    return { allowed: false, reason: "Permission denied" };
  };

  const handleDragEnd = (result: DropResult) => {
    setDraggingOver(null);

    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    const newStatus = destination.droppableId as TaskStatus;
    const fromStatus = source.droppableId as TaskStatus;
    const task = tasks.find((t) => t.t_id === draggableId);

    if (!task) return;
    if (task.status === newStatus) return;

    const { allowed, reason } = canMoveToStatus(task, fromStatus, newStatus);

    if (!allowed) {
      toast.error(reason || "You cannot move this task");
      return;
    }

    // Check if remark is needed (REVIEW -> IN_PROGRESS requires remark)
    if (task.status === "REVIEW" && newStatus === "IN_PROGRESS") {
      toast.info(
        "Remark is required when moving from Review back to In Progress"
      );
    }

    onTaskUpdate(draggableId, newStatus);
    toast.success(
      `Task "${task.title}" moved to ${TASK_STATUS_CONFIG[newStatus].label}!`
    );
  };

  const handleDragUpdate = (update: {
    destination?: { droppableId: string } | null;
  }) => {
    setDraggingOver(update.destination?.droppableId || null);
  };

  const canCreateTask = user?.role === "admin" || user?.role === "manager";

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragUpdate={handleDragUpdate}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {COLUMNS.map((status) => {
          const config = TASK_STATUS_CONFIG[status];
          const columnTasks = getTasksByStatus(status);
          const isOver = draggingOver === status;

          return (
            <div key={status} className="flex-1 min-w-[280px] max-w-[320px]">
              {/* Column Header */}
              <div
                className={cn(
                  "rounded-t-lg px-4 py-3 border-t-4",
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className={cn("font-semibold text-sm", config.color)}>
                      {config.label}
                    </h3>
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        config.bgColor,
                        config.color
                      )}
                    >
                      {columnTasks.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Column Content */}
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "min-h-[500px] p-2 rounded-b-lg transition-all duration-200",
                      // use a soft plate background per status so columns are visually distinct
                      `${config.bgColor}-plate`,
                      "border border-t-0 border-border",
                      snapshot.isDraggingOver &&
                        "bg-primary/5 border-primary/30",
                      isOver && "ring-2 ring-primary/20"
                    )}
                  >
                    <div className="space-y-3">
                      {columnTasks.map((task, index) => (
                        <Draggable
                          key={task.t_id}
                          draggableId={task.t_id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskCard
                                task={task}
                                isDragging={snapshot.isDragging}
                                onModified={onTaskModified}
                                openTaskId={openTaskId}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                    {provided.placeholder}

                    {columnTasks.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                        No tasks
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default TaskKanbanBoard;
