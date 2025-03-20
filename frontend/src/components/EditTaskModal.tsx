import React, { useState, useEffect } from "react";
import { Task, TaskStatus } from "../types/task";
import { taskService } from "../services/taskService";
import toast from "react-hot-toast";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  onTaskUpdated: () => void;
}

export default function EditTaskModal({
  isOpen,
  onClose,
  taskId,
  onTaskUpdated,
}: EditTaskModalProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [isPreview, setIsPreview] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const task = await taskService.getTaskById(taskId);
        setTask(task);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to fetch task",
        );
      }
    };

    if (isOpen) {
      fetchTask();
    }
  }, [isOpen, taskId]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      await taskService.updateTask(task.id, {
        title,
        description,
        status,
      });
      toast.success("Task updated successfully");
      onTaskUpdated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[70vh] overflow-auto">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPreview(!isPreview)}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    {isPreview ? "Edit" : "Preview"}
                  </button>
                </div>
              </div>
              {isPreview ? (
                <div className="w-full px-3 py-2 min-h-[150px] whitespace-pre-wrap text-gray-700">
                  {description || "No description provided"}
                </div>
              ) : (
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[150px]"
                  placeholder="Add a description..."
                />
              )}
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
