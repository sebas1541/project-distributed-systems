'use client';

import { useState, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { tasksApi } from '@/features/tasks';
import { CreateTaskDto, TaskPriority } from '@/types/task.types';

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
}

export function CreateTaskModal({
  open,
  onOpenChange,
  onTaskCreated,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData: CreateTaskDto = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
      };

      await tasksApi.createTask(taskData);
      
      // Reset form
      setTitle('');
      setDescription('');
      setPriority(TaskPriority.MEDIUM);
      setDueDate('');
      
      onTaskCreated();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || 'Error al crear la tarea');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
            Nueva Tarea
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Crea una nueva tarea para gestionar tus actividades
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-gray-700">
                Título *
              </label>
              <Input
                id="title"
                placeholder="Ej: Completar informe mensual"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                id="description"
                placeholder="Describe los detalles de la tarea..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="w-full min-h-[100px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium text-gray-700">
                  Prioridad
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={TaskPriority.LOW}>Baja</option>
                  <option value={TaskPriority.MEDIUM}>Media</option>
                  <option value={TaskPriority.HIGH}>Alta</option>
                  <option value={TaskPriority.URGENT}>Urgente</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="dueDate" className="text-sm font-medium text-gray-700">
                  Fecha límite
                </label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isSubmitting}
                  className="text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs sm:text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto text-sm"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto text-sm">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Creando...
                </span>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Tarea
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
