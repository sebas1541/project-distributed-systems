'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { tasksApi } from '@/features/tasks';
import { Task, TaskStatus } from '@/types/task.types';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

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

  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING).length;
  const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;

  return (
    <AuthenticatedLayout>
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            ¡Bienvenido de vuelta! 👋
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            Aquí está tu resumen de hoy
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Tareas</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{tasks.length}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
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
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg"
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
          </>
        )}
      </main>
    </AuthenticatedLayout>
  );
}
