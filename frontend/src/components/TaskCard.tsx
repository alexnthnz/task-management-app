import React from 'react';
import { Task, TaskStatus } from '../types/task';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'TODO':
      return 'bg-gray-100 text-gray-700';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-700';
    case 'COMPLETED':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'TODO':
      return '⭕';
    case 'IN_PROGRESS':
      return '🔄';
    case 'COMPLETED':
      return '✅';
    default:
      return '⭕';
  }
};

export default function TaskCard({ task, onDelete, onEdit }: TaskCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-move">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 
              className="font-medium text-gray-900 mb-1 hover:text-indigo-600 cursor-pointer line-clamp-2"
              onClick={() => onEdit(task)}
            >
              {task.title}
            </h4>
            <p className="text-sm text-gray-600 mb-3 line-clamp-4">{task.description}</p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {getStatusIcon(task.status)} {task.status.replace('_', ' ')}
              </span>
              <span className="text-xs text-gray-500">
                Created: {format(new Date(task.createdAt), 'MMM d')}
              </span>
            </div>
          </div>
          <button
            onClick={() => onDelete(task.id)}
            className="text-gray-400 hover:text-red-500 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 