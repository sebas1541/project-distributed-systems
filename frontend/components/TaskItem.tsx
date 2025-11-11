'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Clock, Eye } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '@/types/task.types';
import { tasksApi } from '@/features/tasks';

interface TaskItemProps {
  task: Task;
  onTaskUpdated: () => void;
  onTaskClick?: (task: Task) => void;
}

const priorityColors = {
  [TaskPriority.LOW]: 'bg-gray-50 text-gray-600',
  [TaskPriority.MEDIUM]: 'bg-yellow-50 text-yellow-600',
  [TaskPriority.HIGH]: 'bg-orange-50 text-orange-600',
  [TaskPriority.URGENT]: 'bg-red-50 text-red-600',
};

const priorityLabels = {
  [TaskPriority.LOW]: 'Baja',
  [TaskPriority.MEDIUM]: 'Media',
  [TaskPriority.HIGH]: 'Alta',
  [TaskPriority.URGENT]: 'Urgente',
};

const statusColors = {
  [TaskStatus.PENDING]: 'bg-gray-50 text-gray-600',
  [TaskStatus.IN_PROGRESS]: 'bg-purple-50 text-purple-600',
  [TaskStatus.COMPLETED]: 'bg-green-50 text-green-600',
  [TaskStatus.CANCELLED]: 'bg-red-50 text-red-600',
};

export function TaskItem({ task, onTaskUpdated, onTaskClick }: TaskItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleTaskStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    try {
      const newStatus =
        task.status === TaskStatus.COMPLETED
          ? TaskStatus.PENDING
          : task.status === TaskStatus.PENDING
          ? TaskStatus.IN_PROGRESS
          : TaskStatus.COMPLETED;

      await tasksApi.updateTask(task.id, { status: newStatus });
      onTaskUpdated();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCardClick = () => {
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <button
            onClick={toggleTaskStatus}
            disabled={isUpdating}
            className="mt-1 disabled:opacity-50 flex-shrink-0"
          >
            {task.status === TaskStatus.COMPLETED ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400 hover:text-yellow-500 transition-colors" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold text-gray-900 mb-2 break-words ${
                task.status === TaskStatus.COMPLETED ? 'line-through text-gray-500' : ''
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="text-sm text-gray-600 mb-3 break-words line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
              {task.dueDate && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{formatDate(task.dueDate)}</span>
                </div>
              )}

              <span
                className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap ${
                  priorityColors[task.priority]
                }`}
              >
                {priorityLabels[task.priority]}
              </span>

              <span
                className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap ${
                  statusColors[task.status]
                }`}
              >
                {task.status === TaskStatus.COMPLETED
                  ? 'Completada'
                  : task.status === TaskStatus.IN_PROGRESS
                  ? 'En Progreso'
                  : task.status === TaskStatus.CANCELLED
                  ? 'Cancelada'
                  : 'Pendiente'}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 flex-shrink-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
