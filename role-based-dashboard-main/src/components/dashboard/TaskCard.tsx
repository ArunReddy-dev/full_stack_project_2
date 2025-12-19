import { Task, PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/types/task";
import { Calendar, User, Edit3, Trash2, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onModified?: () => void; // called after update/delete to refresh parent
  openTaskId?: string;
}

const TaskCard = ({
  task,
  isDragging,
  onModified,
  openTaskId,
}: TaskCardProps) => {
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<"details" | "attachments">(
    "details"
  );

  // editable form state
  const [formTitle, setFormTitle] = useState(task.title);
  const [formDescription, setFormDescription] = useState(
    task.description ?? ""
  );
  const [formPriority, setFormPriority] = useState(task.priority);
  const [formAssignedTo, setFormAssignedTo] = useState(task.assigned_to ?? "");
  const [formReviewer, setFormReviewer] = useState(task.reviewer ?? "");
  const [formExpectedClosure, setFormExpectedClosure] = useState(
    task.expected_closure ?? ""
  );
  const [attachments, setAttachments] = useState<Array<any>>([]);
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [attachRemark, setAttachRemark] = useState("");

  const mapRoleToBackend = (r?: string) => {
    if (!r) return "Developer";
    if (r === "admin") return "Admin";
    if (r === "manager") return "Manager";
    return "Developer";
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await api.del(`/Task/attachment?id=${attachmentId}&role=${roleParam}`);
      toast.success("Attachment removed");
      fetchAttachments();
    } catch (err: any) {
      const detail = err?.data?.detail ?? err?.message ?? "Delete failed";
      toast.error(String(detail));
    }
  };

  const roleParam = mapRoleToBackend(user?.role);

  const getNumericId = (id: string) => {
    const n = Number(id);
    return Number.isFinite(n) ? n : id;
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    try {
      const idForApi = getNumericId(task.t_id);
      await api.del(`/Task/delete?id=${idForApi}&role=${roleParam}`);
      toast.success("Task deleted");
      onModified?.();
    } catch (err: any) {
      const detail = err?.data?.detail ?? err?.message ?? "Delete failed";
      const msg = Array.isArray(detail)
        ? detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ")
        : typeof detail === "object"
        ? JSON.stringify(detail)
        : String(detail);
      toast.error(msg);
    }
  };

  const serverBase = api.API_BASE.replace(/\/api$/i, "");

  const fetchAttachments = async () => {
    try {
      const atts = await api.get(
        `/Task/attachments?id=${getNumericId(task.t_id)}&role=${roleParam}`
      );
      setAttachments(Array.isArray(atts) ? atts : []);
    } catch (err) {
      // ignore silently
      setAttachments([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setAttachFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!attachFile) return toast.error("Please select a file");
    try {
      const idForApi = getNumericId(task.t_id);

      // 1) Upload file to task attachments endpoint (records in SQL attachments table)
      const fd = new FormData();
      fd.append("role", roleParam);
      fd.append("remark", attachRemark || "");
      fd.append("file", attachFile);
      await api.post(`/Task/attach?id=${idForApi}`, fd);

      // 2) Also create a remark entry in the remarks collection so the assigner
      //    can see the remark in their notifications. Use the correct router
      //    path (/Remark/create) and include the acting role. We don't need to
      //    re-upload the file to GridFS here because /Task/attach already saved
      //    the file to disk and created an attachment DB record.
      try {
        const rf = new FormData();
        rf.append("task_id", String(idForApi));
        rf.append("comment", attachRemark || "");
        rf.append("role", roleParam);
        // backend expects header `e_id` (int)
        await api.post("/Remark/create", rf, {
          e_id: String(user?.emp_id ?? ""),
        });
      } catch (rErr) {
        // don't block main upload if remark storing fails; show a non-fatal toast
        console.warn("Failed to create remark entry:", rErr);
        toast("Saved file, but failed to add remark metadata");
      }

      toast.success("File uploaded");
      setAttachFile(null);
      setAttachRemark("");
      fetchAttachments();
    } catch (err: any) {
      const detail = err?.data?.detail ?? err?.message ?? "Upload failed";
      const msg = Array.isArray(detail)
        ? detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ")
        : typeof detail === "object"
        ? JSON.stringify(detail)
        : String(detail);
      toast.error(msg);
    }
  };

  const canDeveloperAddRemark = () => {
    if (!user) return false;
    if (user.role !== "developer") return true; // managers/admins can add
    return task.status === "TO_DO" || task.status === "IN_PROGRESS";
  };

  const handleAddRemark = async () => {
    if (!canDeveloperAddRemark()) {
      return toast.error("You can add remarks only in To Do or In Progress");
    }
    if (!attachRemark && !attachFile)
      return toast.error("Enter a remark or attach a file");
    try {
      const idForApi = getNumericId(task.t_id);

      // If a file was selected, upload it via the Task attachment endpoint so
      // the SQL attachment table reflects the uploaded file. Then create a
      // remark record (without re-uploading the file to GridFS) so the assigner
      // will see a notification.
      if (attachFile) {
        try {
          const fd = new FormData();
          fd.append("role", roleParam);
          fd.append("remark", attachRemark || "");
          fd.append("file", attachFile);
          await api.post(`/Task/attach?id=${idForApi}`, fd);
        } catch (e: any) {
          const detail = e?.data?.detail ?? e?.message ?? "Upload failed";
          return toast.error(String(detail));
        }
      }

      // Create remark entry so notifications will surface to the assigner
      const rf = new FormData();
      rf.append("task_id", String(idForApi));
      rf.append("comment", attachRemark || "");
      rf.append("role", roleParam);
      await api.post("/Remark/create", rf, {
        e_id: String(user?.emp_id ?? ""),
      });
      toast.success("Remark added");
      setAttachRemark("");
      setAttachFile(null);
      // refresh attachments/remarks
      fetchAttachments();
      // close dialog and notify parent to refresh
      setOpen(false);
      onModified?.();
    } catch (err: any) {
      const detail =
        err?.data?.detail ?? err?.message ?? "Failed to add remark";
      toast.error(String(detail));
    }
  };

  // if openTaskId matches this task, open the dialog
  useEffect(() => {
    if (!openTaskId) return;
    try {
      if (String(openTaskId) === String(task.t_id)) {
        setViewMode("details");
        setOpen(true);
        fetchAttachments();
      }
    } catch (e) {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTaskId]);

  return (
    <>
      <div
        onClick={() => {
          setViewMode("details");
          setOpen(true);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") setOpen(true);
        }}
        className={cn(
          "bg-card rounded-lg p-4 shadow-sm border border-border transition-all duration-200 cursor-pointer",
          "hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5",
          isDragging && "shadow-xl scale-105",
          // add a subtle left status stripe using status border color
          "border-l-4",
          TASK_STATUS_CONFIG[task.status]?.borderColor
        )}
      >
        {/* Minimal preview: title, assigned by, expected date, attachment icon, description, actions */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold">
                {String(task.title || "")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-sm text-foreground line-clamp-1">
                  {task.title}
                </h4>
                <div className="text-xs text-muted-foreground mt-0.5">
                  <span className="text-[10px] font-mono">by </span>
                  <span className="font-medium">{task.assigned_by ?? "—"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{format(new Date(task.expected_closure), "MMM dd")}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode("attachments");
                  setOpen(true);
                  fetchAttachments();
                }}
                className="text-muted-foreground/80 p-1 rounded hover:bg-muted/40"
                title="Attachments"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-3">
            {task.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Edit button: hidden for admins */}
              {user?.role !== "admin" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    setOpen(true);
                    setViewMode("details");
                  }}
                  className="text-sm px-2 py-1 rounded bg-card hover:shadow-sm"
                >
                  Edit
                </button>
              )}

              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleDelete();
                }}
                className="text-sm px-2 py-1 rounded bg-destructive/10 text-destructive"
              >
                Delete
              </button>
            </div>

            <div className="text-xs text-muted-foreground">#{task.t_id}</div>
          </div>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (val) {
            fetchAttachments();
          } else {
            setIsEditing(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[640px] bg-card animate-fade-in border border-border shadow-lg rounded-xl overflow-hidden">
          {/* Decorative header stripe using status plate color */}
          <div
            className={cn(
              "h-3 w-full",
              TASK_STATUS_CONFIG[task.status]?.bgColor + "-plate"
            )}
          />
          <DialogHeader className="px-6 pt-4">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-lg font-semibold">
                {isEditing ? "Edit Task" : task.title}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {/* Action buttons moved here (Edit / Delete) for clearer preview and to avoid clutter */}
                <div className="flex items-center gap-2">
                  {user?.role !== "admin" && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-1 rounded hover:bg-muted/50"
                      title="Edit task"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      await handleDelete();
                    }}
                    className="p-1 rounded hover:bg-muted/50"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">
                  {priorityConfig.label}
                </span>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 mt-2 px-6 pb-6">
            {isEditing ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const payload: any = {
                      title: formTitle,
                      description: formDescription,
                      priority: formPriority,
                      assigned_to: formAssignedTo || undefined,
                      reviewer: formReviewer || undefined,
                      expected_closure: formExpectedClosure || undefined,
                    };
                    // convert numeric-like fields
                    if (payload.assigned_to) {
                      const n = Number(payload.assigned_to);
                      payload.assigned_to = Number.isFinite(n)
                        ? n
                        : payload.assigned_to;
                    }
                    if (payload.reviewer) {
                      const n = Number(payload.reviewer);
                      payload.reviewer = Number.isFinite(n)
                        ? n
                        : payload.reviewer;
                    }
                    const idForApi = getNumericId(task.t_id);
                    await api.put(
                      `/Task/update?id=${idForApi}&role=${roleParam}`,
                      payload
                    );
                    toast.success("Task updated");
                    onModified?.();
                    setIsEditing(false);
                    setOpen(false);
                  } catch (err: any) {
                    const detail =
                      err?.data?.detail ?? err?.message ?? "Update failed";
                    const msg = Array.isArray(detail)
                      ? detail
                          .map((d: any) => d.msg || JSON.stringify(d))
                          .join("; ")
                      : typeof detail === "object"
                      ? JSON.stringify(detail)
                      : String(detail);

                    // If server returned Forbidden for Admin role, show a clearer popup
                    if (
                      err?.status === 403 ||
                      String(msg).toLowerCase().includes("admin")
                    ) {
                      // use a blocking alert so the user sees the precise rule
                      // (we also show a toast for consistency)
                      try {
                        window.alert(msg);
                      } catch {
                        /* ignore if not available */
                      }
                    }

                    toast.error(msg);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs text-muted-foreground">Title</label>
                  <input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full p-2 border rounded bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Description
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full p-2 border rounded bg-background"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Priority
                    </label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as any)}
                      className="w-full p-2 border rounded bg-background"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Assigned To
                    </label>
                    <input
                      value={formAssignedTo}
                      onChange={(e) => setFormAssignedTo(e.target.value)}
                      className="w-full p-2 border rounded bg-background"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Reviewer (Manager ID)
                    </label>
                    <input
                      value={formReviewer}
                      onChange={(e) => setFormReviewer(e.target.value)}
                      className="w-full p-2 border rounded bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Expected Closure
                    </label>
                    <input
                      type="date"
                      value={formExpectedClosure?.split("T")[0] || ""}
                      onChange={(e) => setFormExpectedClosure(e.target.value)}
                      className="w-full p-2 border rounded bg-background"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            ) : viewMode === "attachments" ? (
              <div className="space-y-4">
                <h4 className="text-sm font-medium mb-2">Attachments</h4>
                <div className="space-y-2">
                  {attachments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No attachments
                    </div>
                  ) : (
                    attachments.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-3 p-2 rounded border"
                      >
                        <div>
                          <div className="font-medium">{a.filename}</div>
                          {a.remark && (
                            <div className="text-xs text-muted-foreground">
                              {a.remark}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`${serverBase}/uploads/${task.t_id}/${a.filename}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline text-sm"
                          >
                            Download
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(a.id)}
                            className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="pt-3 border-t mt-2">
                    <div className="grid grid-cols-1 gap-2">
                      <label className="text-xs text-muted-foreground">
                        Add Attachment / Remark
                      </label>
                      <input type="file" onChange={handleFileChange} />
                      {attachFile && (
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-sm text-muted-foreground">
                            Selected: {attachFile.name}
                          </div>
                          <button
                            type="button"
                            className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded"
                            onClick={() => setAttachFile(null)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      <textarea
                        value={attachRemark}
                        onChange={(e) => setAttachRemark(e.target.value)}
                        placeholder="Enter remark (optional)"
                        className="w-full p-2 border rounded bg-background"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAttachFile(null);
                            setAttachRemark("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddRemark}
                          disabled={!canDeveloperAddRemark()}
                        >
                          Add
                        </Button>
                      </div>
                      {!canDeveloperAddRemark() && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Developers can add remarks only when task is To Do or
                          In Progress.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {task.description}
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Task ID</div>
                    <div className="font-mono">{task.t_id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Priority
                    </div>
                    <div className="font-medium">{priorityConfig.label}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Assigned To
                    </div>
                    <div className="font-medium">
                      {task.assigned_to ?? "Unassigned"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Assigned By
                    </div>
                    <div className="font-medium">{task.assigned_by ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Reviewer
                    </div>
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
                    <div className="font-medium">
                      {task.actual_closure ?? "—"}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {attachments.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No attachments
                      </div>
                    ) : (
                      attachments.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-3 p-2 rounded border"
                        >
                          <div>
                            <div className="font-medium">{a.filename}</div>
                            {a.remark && (
                              <div className="text-xs text-muted-foreground">
                                {a.remark}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`${serverBase}/uploads/${task.t_id}/${a.filename}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline text-sm"
                            >
                              Download
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(a.id)}
                              className="text-xs text-destructive px-2 py-1 rounded"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    )}

                    <div className="pt-3 border-t mt-2">
                      <div className="grid grid-cols-1 gap-2">
                        <label className="text-xs text-muted-foreground">
                          Add Attachment / Remark
                        </label>
                        <input type="file" onChange={handleFileChange} />
                        {attachFile && (
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-sm text-muted-foreground">
                              Selected: {attachFile.name}
                            </div>
                            <button
                              type="button"
                              className="text-xs text-destructive underline"
                              onClick={() => setAttachFile(null)}
                            >
                              Remove selected
                            </button>
                          </div>
                        )}
                        <textarea
                          value={attachRemark}
                          onChange={(e) => setAttachRemark(e.target.value)}
                          placeholder="Enter remark (optional)"
                          className="w-full p-2 border rounded bg-background"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setAttachFile(null);
                              setAttachRemark("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAddRemark}
                            disabled={!canDeveloperAddRemark()}
                          >
                            Add
                          </Button>
                        </div>
                        {!canDeveloperAddRemark() && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Developers can add remarks only when task is To Do
                            or In Progress.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button onClick={() => setOpen(false)}>Close</Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskCard;
