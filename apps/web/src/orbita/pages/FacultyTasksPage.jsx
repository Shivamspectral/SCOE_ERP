import React, { useState } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Filter,
  CheckCircle2,
  X,
  Send,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Breadcrumb } from "../components/Breadcrumb";

export function FacultyTasksPage() {
  const { tasks, toggleTask, addTask, deleteTask, toast, backendConfigured, isAuthenticated, session } = usePortal();
  const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);

  const [activeTab, setActiveTab] = useState("All");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState("High");
  const [taskDueDate, setTaskDueDate] = useState("Tomorrow");
  const [taskCategory, setTaskCategory] = useState("Academics");

  const displayedTasks = liveSession ? [] : tasks;
  const filteredTasks = displayedTasks.filter((t) => {
    if (activeTab === "Pending") return !t.completed;
    if (activeTab === "Completed") return t.completed;
    if (activeTab === "High") return t.priority === "High";
    return true;
  });

  const completedCount = displayedTasks.filter((t) => t.completed).length;
  const pendingCount = displayedTasks.length - completedCount;

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (liveSession) { toast({ title: "Task service unavailable", description: "Tasks are not connected to the institutional backend. No task was created.", variant: "info" }); return; }
    if (!taskTitle.trim()) {
      toast({
        title: "Task Title Required",
        description: "Please enter a descriptive task title.",
        variant: "warning",
      });
      return;
    }

    addTask({
      title: taskTitle,
      priority: taskPriority,
      dueDate: taskDueDate,
      category: taskCategory,
    });

    setTaskTitle("");
    setAddModalOpen(false);
    toast({
      title: "Task Created",
      description: `Added "${taskTitle}" to academic action list.`,
      variant: "success",
    });
  };

  const handleDelete = (id, title) => {
    if (liveSession) { toast({ title: "Task service unavailable", description: "Tasks are not connected to the institutional backend. No task was deleted.", variant: "info" }); return; }
    deleteTask(id);
    toast({
      title: "Task Deleted",
      description: `Removed "${title}".`,
      variant: "info",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tasks & Workload" },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tasks & Academic Responsibilities
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track syllabus deadlines, NBA documentation, exam uploads, and institutional duties.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          <span>Add New Task</span>
        </button>
      </div>

      <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground" role="status"><strong>{liveSession ? "Task service unavailable." : "Demo preview only."}</strong> {liveSession ? "The task list is not loaded from the college database; live task writes are disabled." : "Tasks are local preview data and are not persisted."}</div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs text-muted-foreground">Total Action Items</span>
          <span className="mt-1 block font-display text-2xl font-bold text-foreground">
            {liveSession ? "—" : tasks.length}
          </span>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <span className="text-xs text-warning-foreground font-medium">Pending Tasks</span>
          <span className="mt-1 block font-display text-2xl font-bold text-warning-foreground">
            {pendingCount}
          </span>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/10 p-4">
          <span className="text-xs text-success font-medium">Completed</span>
          <span className="mt-1 block font-display text-2xl font-bold text-success">
            {completedCount}
          </span>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
          <span className="text-xs text-primary font-medium">Completion Rate</span>
          <span className="mt-1 block font-display text-2xl font-bold text-primary">
            {liveSession ? "—" : `${Math.round((completedCount / (tasks.length || 1)) * 100)}%`}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 w-fit">
        {["All", "Pending", "Completed", "High"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab
                ? "bg-card text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No tasks found in this view.
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between rounded-xl border p-4 transition-all bg-card ${
                t.completed
                  ? "border-border/60 opacity-60 bg-muted/20"
                  : "border-border hover:border-primary/40 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => liveSession ? toast({ title: "Task service unavailable", description: "No task status was changed.", variant: "info" }) : toggleTask(t.id)}
                  className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.completed ? (
                    <CheckSquare className="size-5 text-success" />
                  ) : (
                    <Square className="size-5" />
                  )}
                </button>

                <div>
                  <p
                    className={`text-sm font-semibold text-foreground ${
                      t.completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {t.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded bg-muted px-2 py-0.5 font-medium text-foreground">
                      {t.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3 text-muted-foreground/70" />
                      <span>{t.dueDate}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    t.priority === "High"
                      ? "bg-destructive/15 text-destructive"
                      : t.priority === "Medium"
                      ? "bg-warning/15 text-warning-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {t.priority}
                </span>

                <button
                  onClick={() => handleDelete(t.id, t.title)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Create Academic Task
                </h3>
                <p className="text-xs text-muted-foreground">
                  Assign deadlines and priority to your workflow
                </p>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Upload Lab Term-Work Marks on SPPU ERP"
                  className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-card px-2 outline-none focus:border-primary text-xs"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Due Date
                  </label>
                  <input
                    type="text"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    placeholder="e.g. Tomorrow, 5 PM"
                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Category
                </label>
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2 outline-none focus:border-primary text-xs"
                >
                  <option value="Academics">Academics</option>
                  <option value="Examinations">Examinations</option>
                  <option value="Accreditation">Accreditation (NBA/NAAC)</option>
                  <option value="Mentoring">Mentoring</option>
                  <option value="Events">Events</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-lg border border-border px-3.5 py-1.5 font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="size-3.5" />
                  <span>Add Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
