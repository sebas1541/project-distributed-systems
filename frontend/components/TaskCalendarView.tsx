'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import { Task, TaskStatus } from '@/types/task.types';

interface TaskCalendarViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export function TaskCalendarView({ tasks, onTaskClick }: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const dayNamesFull = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const days = [];

  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayTasks = getTasksForDate(date);
    const isToday = 
      date.getDate() === new Date().getDate() &&
      date.getMonth() === new Date().getMonth() &&
      date.getFullYear() === new Date().getFullYear();
    
    const isSelected = selectedDate &&
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();

    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(date)}
        className={`aspect-square p-1 flex flex-col items-center justify-start transition-colors relative ${
          isSelected 
            ? 'bg-yellow-400 text-black' 
            : isToday 
            ? 'bg-yellow-100' 
            : 'hover:bg-gray-100'
        }`}
      >
        <span className={`text-sm sm:text-base font-medium ${
          isSelected ? 'text-black font-semibold' : isToday ? 'text-yellow-600' : 'text-gray-900'
        }`}>
          {day}
        </span>
        {dayTasks.length > 0 && (
          <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
            {dayTasks.slice(0, 3).map((task, idx) => (
              <Circle
                key={idx}
                className={`h-1 w-1 sm:h-1.5 sm:w-1.5 fill-current ${
                  isSelected 
                    ? 'text-black' 
                    : task.status === TaskStatus.COMPLETED
                    ? 'text-green-500'
                    : task.status === TaskStatus.IN_PROGRESS
                    ? 'text-orange-500'
                    : 'text-yellow-500'
                }`}
              />
            ))}
          </div>
        )}
      </button>
    );
  }

  // Get tasks for selected date
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-3 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-2xl font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goToToday}
                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 text-xs sm:text-sm px-2 sm:px-3"
              >
                Hoy
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={previousMonth}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={nextMonth}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-0 mb-2">
            {dayNames.map((day, idx) => (
              <div
                key={`day-${idx}`}
                className="text-center text-[10px] sm:text-sm font-semibold text-gray-500 sm:text-gray-600 py-1 sm:py-2"
              >
                <span className="sm:hidden">{day}</span>
                <span className="hidden sm:inline">{dayNamesFull[idx]}</span>
              </div>
            ))}
          </div>

          {/* Mobile Calendar grid - iPhone style */}
          <div className="grid grid-cols-7 gap-1 sm:hidden">
            {days}
          </div>

          {/* Desktop Calendar grid - Original style */}
          <div className="hidden sm:grid grid-cols-7 gap-0 border-t border-l border-gray-200">
            {days.map((day, idx) => {
              if (day.key?.toString().startsWith('empty')) {
                return <div key={day.key} className="min-h-[120px] bg-gray-50 border-r border-b border-gray-200" />;
              }
              
              const dayNum = parseInt(day.key?.toString() || '0');
              if (dayNum === 0) return day;
              
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
              const dayTasks = getTasksForDate(date);
              const isToday = 
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day.key}
                  className={`min-h-[120px] border-r border-b border-gray-200 p-2 overflow-hidden hover:bg-gray-50 transition-colors ${
                    isToday ? 'bg-yellow-50' : 'bg-white'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-yellow-600' : 'text-gray-700'}`}>
                    {dayNum}
                    {isToday && <span className="ml-1 text-xs">(Hoy)</span>}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onTaskClick?.(task)}
                        className={`w-full text-left text-xs p-1.5 rounded truncate transition-colors ${
                          task.status === TaskStatus.COMPLETED
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : task.status === TaskStatus.IN_PROGRESS
                            ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {task.title}
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        +{dayTasks.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Desktop Legend */}
      <Card className="hidden sm:block">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 rounded"></div>
              <span className="text-gray-600">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 rounded"></div>
              <span className="text-gray-600">En Progreso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded"></div>
              <span className="text-gray-600">Completada</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected date tasks - Mobile only */}
      {selectedDate && selectedDateTasks.length > 0 && (
        <Card className="sm:hidden">
          <CardContent className="p-4">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              {selectedDate.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h4>
            <div className="space-y-2">
              {selectedDateTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick?.(task)}
                  className={`w-full text-left p-3 rounded-lg transition-all hover:shadow-md ${
                    task.status === TaskStatus.COMPLETED
                      ? 'bg-green-50 border border-green-200'
                      : task.status === TaskStatus.IN_PROGRESS
                      ? 'bg-orange-50 border border-orange-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className={`font-medium text-sm sm:text-base truncate ${
                        task.status === TaskStatus.COMPLETED
                          ? 'text-green-900 line-through'
                          : task.status === TaskStatus.IN_PROGRESS
                          ? 'text-orange-900'
                          : 'text-yellow-900'
                      }`}>
                        {task.title}
                      </h5>
                      {task.description && (
                        <p className={`text-xs sm:text-sm mt-1 line-clamp-2 ${
                          task.status === TaskStatus.COMPLETED
                            ? 'text-green-700'
                            : task.status === TaskStatus.IN_PROGRESS
                            ? 'text-orange-700'
                            : 'text-yellow-700'
                        }`}>
                          {task.description}
                        </p>
                      )}
                      {task.dueDate && (
                        <p className={`text-xs mt-1 ${
                          task.status === TaskStatus.COMPLETED
                            ? 'text-green-600'
                            : task.status === TaskStatus.IN_PROGRESS
                            ? 'text-orange-600'
                            : 'text-yellow-600'
                        }`}>
                          {new Date(task.dueDate).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                    <Circle className={`h-2 w-2 sm:h-3 sm:w-3 fill-current flex-shrink-0 mt-1 ${
                      task.status === TaskStatus.COMPLETED
                        ? 'text-green-500'
                        : task.status === TaskStatus.IN_PROGRESS
                        ? 'text-orange-500'
                        : 'text-yellow-500'
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDate && selectedDateTasks.length === 0 && (
        <Card className="sm:hidden">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 text-sm">
              No hay tareas para {selectedDate.toLocaleDateString('es-ES', { 
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
