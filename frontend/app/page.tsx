'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { tasksApi } from '@/features/tasks';
import { Task, TaskStatus } from '@/types/task.types';
import { GoogleCalendarPrompt } from '@/components/GoogleCalendarPrompt';
import { TaskCalendarView } from '@/components/TaskCalendarView';
import { TaskDetailsModal } from '@/components/TaskDetailsModal';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendarPrompt, setShowCalendarPrompt] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    loadTasks();
    checkCalendarPrompt();
  }, []);

  const checkCalendarPrompt = async () => {
    // Check if we've already shown the prompt
    const promptShown = localStorage.getItem('calendar-prompt-shown');
    if (promptShown === 'true') {
      return;
    }

    // Check if calendar is already connected
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id || '1';
      
      const response = await fetch('http://localhost/api/scheduler/auth/google/status', {
        headers: {
          'x-user-id': userId,
        },
      });
      const data = await response.json();
      
      // Only show prompt if not connected and not shown before
      if (!data.connected) {
        // Small delay to let the page load first
        setTimeout(() => {
          setShowCalendarPrompt(true);
        }, 1000);
      } else {
        // If already connected, mark prompt as shown
        localStorage.setItem('calendar-prompt-shown', 'true');
      }
    } catch (error) {
      console.error('Error checking calendar status:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const allTasks = await tasksApi.getTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskUpdated = () => {
    loadTasks();
  };

  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING).length;
  const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;

  return (
    <AuthenticatedLayout>
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            ¡Bienvenido de vuelta!
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            Aquí está tu resumen de hoy
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Stats and Recent Tasks (2/3 width on desktop) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Tareas</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{tasks.length}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Completadas</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-600">{completedTasks}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Pendientes</p>
                      <p className="text-2xl sm:text-3xl font-bold text-orange-600">{pendingTasks}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">En Progreso</p>
                      <p className="text-2xl sm:text-3xl font-bold text-purple-600">{inProgressTasks}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

              {tasks.length > 0 && (
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        Tareas Recientes
                      </h3>
                      <Link href="/tasks">
                        <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                          Ver todas
                          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                        </Button>
                      </Link>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      {tasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => handleTaskClick(task)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base break-words">{task.title}</p>
                            {task.description && (
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                            )}
                          </div>
                          <span
                            className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              task.status === TaskStatus.COMPLETED
                                ? 'bg-green-100 text-green-700'
                                : task.status === TaskStatus.IN_PROGRESS
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {task.status === TaskStatus.COMPLETED
                              ? 'Completada'
                              : task.status === TaskStatus.IN_PROGRESS
                              ? 'En Progreso'
                              : 'Pendiente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Side - Calendar View (1/3 width on desktop, hidden on mobile) */}
            <div className="hidden lg:block">
              <Card className="sticky top-6">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Calendario de Tareas
                  </h3>
                  <TaskCalendarView 
                    tasks={tasks}
                    onTaskClick={handleTaskClick}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Google Calendar Connection Prompt */}
      <GoogleCalendarPrompt 
        open={showCalendarPrompt} 
        onClose={() => setShowCalendarPrompt(false)} 
      />

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={selectedTask}
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        onTaskUpdated={handleTaskUpdated}
      />
    </AuthenticatedLayout>
  );
}
