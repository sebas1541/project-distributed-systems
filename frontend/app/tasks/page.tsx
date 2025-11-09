'use client';

import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, Plus, Search, Calendar, List } from 'lucide-react';
import { tasksApi } from '@/features/tasks';
import { Task, TaskStatus } from '@/types/task.types';
import { TaskItem } from '@/components/TaskItem';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { TaskCalendarView } from '@/components/TaskCalendarView';
import { TaskDetailsModal } from '@/components/TaskDetailsModal';

type ViewMode = 'list' | 'calendar';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, activeTab]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const allTasks = await tasksApi.getTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
    
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    // Filter by status based on active tab
    if (activeTab === 'pending') {
      filtered = filtered.filter((t) => t.status === TaskStatus.PENDING);
    } else if (activeTab === 'in_progress') {
      filtered = filtered.filter((t) => t.status === TaskStatus.IN_PROGRESS);
    } else if (activeTab === 'completed') {
      filtered = filtered.filter((t) => t.status === TaskStatus.COMPLETED);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  };

  const handleTaskCreated = () => {
    loadTasks();
  };

  const handleTaskUpdated = () => {
    loadTasks();
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  return (
    <AuthenticatedLayout onTaskCreated={handleTaskCreated}>
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Mis Tareas</h2>
          <p className="text-gray-600 text-base sm:text-lg">
            Gestiona y organiza tus actividades
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar tareas..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex-1 sm:flex-none"
            >
              <List className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Lista</span>
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="flex-1 sm:flex-none"
            >
              <Calendar className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Calendario</span>
            </Button>
          </div>

          <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' ? (
          isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
            </div>
          ) : (
            <TaskCalendarView 
              tasks={tasks} 
              onTaskClick={handleTaskClick}
            />
          )
        ) : (
          /* List View */
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-6 w-full flex-wrap h-auto">
              <TabsTrigger value="all" className="flex-1 min-w-[80px]">
                <span className="hidden sm:inline">Todas</span>
                <span className="sm:hidden">Todo</span> ({tasks.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex-1 min-w-[80px]">
                <span className="hidden sm:inline">Pendientes</span>
                <span className="sm:hidden">Pend.</span> (
                {tasks.filter((t) => t.status === TaskStatus.PENDING).length})
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="flex-1 min-w-[80px]">
                <span className="hidden sm:inline">En Progreso</span>
                <span className="sm:hidden">Prog.</span> (
                {tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1 min-w-[80px]">
                <span className="hidden sm:inline">Completadas</span>
                <span className="sm:hidden">Comp.</span> (
                {tasks.filter((t) => t.status === TaskStatus.COMPLETED).length})
              </TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
              </div>
            ) : (
            <>
              <TabsContent value="all" className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchQuery
                          ? 'No se encontraron tareas'
                          : 'No tienes tareas creadas'}
                      </p>
                      {!searchQuery && (
                        <Button
                          className="mt-4"
                          onClick={() => setShowCreateModal(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Crear tu primera tarea
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  filteredTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onTaskUpdated={handleTaskUpdated}
                      onTaskClick={handleTaskClick}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No hay tareas pendientes</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onTaskUpdated={handleTaskUpdated}
                      onTaskClick={handleTaskClick}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="in_progress" className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No hay tareas en progreso
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onTaskUpdated={handleTaskUpdated}
                      onTaskClick={handleTaskClick}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No hay tareas completadas</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onTaskUpdated={handleTaskUpdated}
                      onTaskClick={handleTaskClick}
                    />
                  ))
                )}
              </TabsContent>
            </>
          )}
          </Tabs>
        )}
      </main>

      <CreateTaskModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onTaskCreated={handleTaskCreated}
      />

      <TaskDetailsModal
        task={selectedTask}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        onTaskUpdated={handleTaskUpdated}
      />
    </AuthenticatedLayout>
  );
}
