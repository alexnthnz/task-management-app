import React, { useState, useEffect, useRef, useCallback } from "react";
import { Task, TaskStatus } from "../types/task";
import { taskService } from "../services/taskService";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import toast from "react-hot-toast";
import ConfirmModal from "./ConfirmModal";
import EditTaskModal from "./EditTaskModal";
import TaskCard from "./TaskCard";

interface TaskListProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  fetchTasks: () => void;
  loading: boolean;
  error: string;
  setError: (error: string | null) => void;
}

export default function TaskList({
  tasks,
  setTasks,
  fetchTasks,
  loading,
  error,
  setError,
}: TaskListProps) {
  const [status, setStatus] = useState<TaskStatus | undefined>();
  const taskRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const columnRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const cleanupRefs = useRef<{ [key: string]: () => void }>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const handleStatusFilter = async (newStatus: TaskStatus | undefined) => {
    try {
      setStatus(newStatus);
      const data = await taskService.getAllTasks(newStatus);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    }
  };

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      try {
        // Find the task in the current tasks list
        const task = tasks.find((t) => t.id === taskId);
        if (!task) {
          throw new Error("Task not found");
        }

        // Update the task with all its properties
        await taskService.updateTask(taskId, {
          title: task.title,
          description: task.description,
          status: newStatus,
        });
        toast.success(`Task moved to ${newStatus.replace("_", " ")}`);
        fetchTasks();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update task",
        );
      }
    },
    [tasks, fetchTasks],
  );

  const setupDropTarget = useCallback(
    (status: TaskStatus, element: HTMLElement) => {
      if (!element) return;

      const cleanup = combine(
        dropTargetForElements({
          element,
          onDrag: (args) => {
            const draggedElement = args.source.element;
            const taskStatus = draggedElement.dataset.taskStatus;
            if (taskStatus && taskStatus !== status) {
              element.classList.add("bg-indigo-50");
            }
          },
          onDragLeave: () => {
            element.classList.remove("bg-indigo-50");
          },
          onDrop: async (args) => {
            const draggedElement = args.source.element;
            const taskId = draggedElement.dataset.taskId;
            const taskStatus = draggedElement.dataset.taskStatus;

            if (taskId && taskStatus && taskStatus !== status) {
              try {
                await handleStatusChange(taskId, status);
                // Refresh the task list to show updated status
                fetchTasks();
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Failed to update task status",
                );
              }
            }
            element.classList.remove("bg-indigo-50");
          },
        }),
        autoScrollForElements({
          element,
          canScroll: () => true,
        }),
      );

      return cleanup;
    },
    [handleStatusChange, fetchTasks, setError],
  );

  useEffect(() => {
    // Cleanup function to remove all drag and drop instances
    return () => {
      Object.values(cleanupRefs.current).forEach((cleanup) => {
        if (cleanup) cleanup();
      });
    };
  }, []);

  useEffect(() => {
    // Clean up previous drag and drop instances
    Object.values(cleanupRefs.current).forEach((cleanup) => {
      if (cleanup) cleanup();
    });
    cleanupRefs.current = {};

    // Set up new drag and drop instances for tasks
    tasks.forEach((task) => {
      const element = taskRefs.current[task.id];
      if (element) {
        const cleanup = setupDragAndDrop(task, element);
        if (cleanup) {
          cleanupRefs.current[task.id] = cleanup;
        }
      }
    });

    // Set up drop targets for columns
    (["TODO", "IN_PROGRESS", "COMPLETED"] as TaskStatus[]).forEach(
      (columnStatus) => {
        const element = columnRefs.current[columnStatus];
        if (element) {
          const cleanup = setupDropTarget(columnStatus, element);
          if (cleanup) {
            cleanupRefs.current[`column-${columnStatus}`] = cleanup;
          }
        }
      },
    );
  }, [tasks, setupDropTarget]);

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;

    try {
      await taskService.deleteTask(taskToDelete.id);
      toast.success("Task deleted successfully");
      fetchTasks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setDeleteModalOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleEditClick = (task: Task) => {
    setTaskToEdit(task);
    setEditModalOpen(true);
  };

  const setupDragAndDrop = (task: Task, element: HTMLElement) => {
    if (!element) return;

    const cleanup = combine(
      draggable({
        element,
        onDragStart: () => {
          element.classList.add("opacity-50");
        },
        onDrop: () => {
          element.classList.remove("opacity-50");
        },
      }),
    );

    // Store the task data on the element itself
    element.dataset.taskId = task.id;
    element.dataset.taskStatus = task.status;

    return cleanup;
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <select
            value={status || ""}
            onChange={(e) =>
              handleStatusFilter((e.target.value as TaskStatus) || undefined)
            }
            className="border rounded-md px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Status</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-13rem)]">
        {(["TODO", "IN_PROGRESS", "COMPLETED"] as TaskStatus[]).map(
          (columnStatus) => (
            <div
              key={columnStatus}
              ref={(el) => {
                if (el) {
                  columnRefs.current[columnStatus] = el;
                }
              }}
              className="bg-gray-50 rounded-lg p-4 h-full overflow-y-auto transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 z-10 py-2">
                <h3 className="font-semibold text-gray-700">
                  {columnStatus.replace("_", " ")}
                </h3>
                <span className="text-sm text-gray-500">
                  {tasks.filter((task) => task.status === columnStatus).length}{" "}
                  tasks
                </span>
              </div>
              <div className="space-y-3">
                {tasks
                  .filter((task) => task.status === columnStatus)
                  .map((task) => (
                    <div
                      key={task.id}
                      ref={(el) => {
                        if (el) {
                          taskRefs.current[task.id] = el;
                        }
                      }}
                    >
                      <TaskCard
                        task={task}
                        onDelete={() => handleDeleteClick(task)}
                        onEdit={handleEditClick}
                      />
                    </div>
                  ))}
              </div>
            </div>
          ),
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
      />

      {taskToEdit && (
        <EditTaskModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setTaskToEdit(null);
          }}
          taskId={taskToEdit.id}
          onTaskUpdated={fetchTasks}
        />
      )}
    </div>
  );
}
