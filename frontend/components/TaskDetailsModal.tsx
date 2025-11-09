'use client';

import { useState, FormEvent, useEffect } from 'react';
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
import { Eye, Edit2, Trash2, Save, X } from 'lucide-react';
import { tasksApi } from '@/features/tasks';
import { Task, TaskPriority, TaskStatus } from '@/types/task.types';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface TaskDetailsModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
}

const priorityLabels = {
  [TaskPriority.LOW]: 'Baja',
  [TaskPriority.MEDIUM]: 'Media',
  [TaskPriority.HIGH]: 'Alta',
  [TaskPriority.URGENT]: 'Urgente',
};

const statusLabels = {
  [TaskStatus.PENDING]: 'Pendiente',
  [TaskStatus.IN_PROGRESS]: 'En Progreso',
  [TaskStatus.COMPLETED]: 'Completada',
  [TaskStatus.CANCELLED]: 'Cancelada',
};

export function TaskDetailsModal({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
}: TaskDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  // Reset form only when a NEW task is selected or modal is opened from closed state
  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      // Format date for datetime-local input
      if (task.dueDate) {
        const date = new Date(task.dueDate);
        const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setDueDate(formattedDate);
      } else {
        setDueDate('');
      }
      setIsEditing(false);
      setError('');
    }
  }, [task?.id, open]); // Only re-run when task ID changes or modal opens

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }

    if (!task) return;

    setIsSubmitting(true);

    try {
      await tasksApi.updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: dueDate || undefined,
      });

      setIsEditing(false);
      onTaskUpdated();
      // Close the modal after successful update
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar la tarea');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!task) return;
    
    setIsDeleting(true);
    try {
      await tasksApi.deleteTask(task.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
      onTaskUpdated();
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Error al eliminar la tarea');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No establecida';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleCancel = () => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      if (task.dueDate) {
        const date = new Date(task.dueDate);
        const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setDueDate(formattedDate);
      } else {
        setDueDate('');
      }
    }
    setIsEditing(false);
    setError('');
  };

  if (!task) return null;

  const handleClose = () => {
    if (!isEditing) {
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent 
          className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
          onEscapeKeyDown={(e) => {
            if (isEditing) {
              e.preventDefault();
              setIsEditing(false);
            }
          }}
          onPointerDownOutside={(e) => {
            if (isEditing) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl pr-8">
              {isEditing ? (
                <Edit2 className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              ) : (
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              )}
              {isEditing ? 'Editar Tarea' : 'Detalles de la Tarea'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {isEditing
                ? 'Modifica la información de tu tarea'
                : 'Información detallada de la tarea'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* View Mode */}
              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Título</h3>
                    <p className="text-base font-semibold text-gray-900">{task.title}</p>
                  </div>

                  {task.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Descripción</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {task.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Prioridad</h3>
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                          task.priority === TaskPriority.LOW
                            ? 'bg-gray-50 text-gray-600'
                            : task.priority === TaskPriority.MEDIUM
                            ? 'bg-yellow-50 text-yellow-600'
                            : task.priority === TaskPriority.HIGH
                            ? 'bg-orange-50 text-orange-600'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {priorityLabels[task.priority]}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Estado</h3>
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                          task.status === TaskStatus.PENDING
                            ? 'bg-gray-50 text-gray-600'
                            : task.status === TaskStatus.IN_PROGRESS
                            ? 'bg-purple-50 text-purple-600'
                            : task.status === TaskStatus.COMPLETED
                            ? 'bg-green-50 text-green-600'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {statusLabels[task.status]}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Fecha límite</h3>
                    <p className="text-sm text-gray-700">{formatDate(task.dueDate)}</p>
                  </div>

                  {(task.createdAt || task.updatedAt) && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                        {task.createdAt && (
                          <div>
                            <span className="font-medium">Creada:</span>{' '}
                            {new Date(task.createdAt).toLocaleDateString('es-ES')}
                          </div>
                        )}
                        {task.updatedAt && (
                          <div>
                            <span className="font-medium">Actualizada:</span>{' '}
                            {new Date(task.updatedAt).toLocaleDateString('es-ES')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium text-gray-700">
                      Título *
                    </label>
                    <Input
                      id="title"
                      placeholder="Título de la tarea"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <label htmlFor="status" className="text-sm font-medium text-gray-700">
                        Estado
                      </label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as TaskStatus)}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={TaskStatus.PENDING}>Pendiente</option>
                        <option value={TaskStatus.IN_PROGRESS}>En Progreso</option>
                        <option value={TaskStatus.COMPLETED}>Completada</option>
                        <option value={TaskStatus.CANCELLED}>Cancelada</option>
                      </select>
                    </div>
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
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {!isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeleteClick}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title="Eliminar Tarea"
        description={`¿Estás seguro de que deseas eliminar la tarea "${task.title}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}
