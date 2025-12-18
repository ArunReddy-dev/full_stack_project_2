import { Task, PRIORITY_CONFIG } from "@/types/task";
import { Calendar, User, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const TaskCard = ({ task, isDragging }: TaskCardProps) => {
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") setOpen(true);
        }}
        className={cn(
          "bg-card rounded-lg p-4 shadow-sm border border-border transition-all duration-200 cursor-pointer",
          "hover:shadow-md hover:border-primary/30",
          isDragging && "shadow-lg rotate-2 scale-105 border-primary"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h4 className="font-medium text-sm text-foreground line-clamp-2 flex-1">
            {task.title}
          </h4>
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full shrink-0",
              priorityConfig.bgColor,
              priorityConfig.color
            )}
          >
            {priorityConfig.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {task.description}
        </p>

        {/* Task ID */}
        <div className="text-xs text-muted-foreground mb-3 font-mono">
          #{task.t_id}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {task.assigned_to && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{task.assigned_to}</span>
              </div>
            )}

            {task.assigned_by && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono">by</span>
                <span className="text-xs">{task.assigned_by}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(task.expected_closure), "MMM dd")}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-muted-foreground/70">
              <MessageSquare className="w-3 h-3" />
              <span>0</span>
            </div>
          </div>
        </div>

        {/* Reviewer badge */}
        {task.reviewer && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Reviewer:{" "}
              <span className="text-foreground font-medium">
                {task.reviewer}
              </span>
            </span>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {task.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">{task.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Task ID</div>
                <div className="font-mono">{task.t_id}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Priority</div>
                <div className="font-medium">{priorityConfig.label}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Assigned To</div>
                <div className="font-medium">
                  {task.assigned_to ?? "Unassigned"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Assigned By</div>
                <div className="font-medium">{task.assigned_by ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Reviewer</div>
                <div className="font-medium">{task.reviewer ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="font-medium">{task.status}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Expected Closure
                </div>
                <div className="font-medium">{task.expected_closure}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Actual Closure
                </div>
                <div className="font-medium">{task.actual_closure ?? "—"}</div>
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskCard;
