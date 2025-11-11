'use client';

import { Bell, X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useState, useRef, useEffect } from 'react';
import { TaskDetailsModal } from './TaskDetailsModal';
import { tasksApi } from '@/features/tasks';
import { Task } from '@/types/task.types';

export function NotificationBell() {
  const { isConnected, unreadCount, notifications, markAsRead, clearNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLoadingTask, setIsLoadingTask] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark as read when opening
      setTimeout(() => markAsRead(), 500);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_REMINDER':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'MORNING_SUMMARY':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'INSIGHTS_UPDATE':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  const handleTaskClick = async (taskId: string) => {
    setIsLoadingTask(true);
    try {
      const task = await tasksApi.getTask(taskId);
      setSelectedTask(task);
      setIsTaskModalOpen(true);
      setIsOpen(false); // Close notifications dropdown
    } catch (error) {
      console.error('Error loading task:', error);
    } finally {
      setIsLoadingTask(false);
    }
  };

  const handleTaskUpdated = () => {
    // Refresh notifications or task list if needed
    console.log('Task updated');
  };

  const removeEmojis = (text: string) => {
    return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        title="Notificaciones"
      >
        <Bell className={`h-5 w-5 ${isConnected ? 'text-gray-700' : 'text-gray-400'}`} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        
        {/* Connection indicator */}
        {isConnected && (
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border-2 border-white" />
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium mb-1">
                          {notification.type === 'TASK_REMINDER' && 'Recordatorio de Tarea'}
                          {notification.type === 'MORNING_SUMMARY' && 'Resumen Matutino'}
                          {notification.type === 'INSIGHTS_UPDATE' && 'Nueva Información'}
                        </p>
                        <p className="text-sm text-gray-600 break-words">
                          {removeEmojis(notification.message)}
                        </p>
                        {notification.task && (
                          <button
                            onClick={() => handleTaskClick(notification.task!.id)}
                            disabled={isLoadingTask}
                            className="mt-2 w-full p-2 bg-yellow-50 hover:bg-yellow-100 rounded text-xs text-left transition-colors cursor-pointer"
                          >
                            <p className="font-medium text-gray-900">{notification.task.title}</p>
                            <p className="text-gray-500 mt-0.5">
                              Vence: {new Date(notification.task.dueDate).toLocaleString('es-CO', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </p>
                          </button>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 flex gap-2">
              <button
                onClick={() => {
                  markAsRead();
                }}
                className="flex-1 text-center text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors py-2 hover:bg-gray-100 rounded"
              >
                Marcar como leídas
              </button>
              <button
                onClick={() => {
                  clearNotifications();
                  setIsOpen(false);
                }}
                className="flex-1 text-center text-sm text-red-600 hover:text-red-700 font-medium transition-colors py-2 hover:bg-red-50 rounded"
              >
                Limpiar todas
              </button>
            </div>
          )}
        </div>
      )}

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={selectedTask}
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
}
