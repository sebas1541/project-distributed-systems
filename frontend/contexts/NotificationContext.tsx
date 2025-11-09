'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface Notification {
  type: string;
  message: string;
  timestamp: string;
  task?: {
    id: string;
    title: string;
    dueDate: string;
    priority: string;
  };
  summary?: any;
}

interface NotificationContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadCount: number;
  notifications: Notification[];
  markAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const user = JSON.parse(userStr);
    const userId = user.id;

    // Connect to WebSocket server
    const socketUrl = process.env.NEXT_PUBLIC_INSIGHTS_WS_URL || 'http://localhost:3005';
    const newSocket = io(socketUrl, {
      path: '/notifications/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to notifications server');
      setIsConnected(true);
      
      // Register user with socket
      newSocket.emit('register', userId);
    });

    newSocket.on('registered', (data) => {
      console.log('✅ Registered for notifications:', data);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from notifications server');
      setIsConnected(false);
    });

    // Listen for task reminders
    newSocket.on('task_reminder', (data) => {
      console.log('🔔 Task reminder received:', data);
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [data, ...prev].slice(0, 50)); // Keep last 50 notifications
      
      toast.warning(data.message, {
        description: `Prioridad: ${data.task.priority}`,
        duration: 5000,
        action: {
          label: 'Ver tarea',
          onClick: () => {
            window.location.href = '/tasks';
          },
        },
      });
    });

    // Listen for morning summaries
    newSocket.on('morning_summary', (data) => {
      console.log('☀️ Morning summary received:', data);
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [data, ...prev].slice(0, 50));
      
      toast.info(data.message, {
        description: `${data.summary.totalPending} pendientes, ${data.summary.totalInProgress} en progreso`,
        duration: 7000,
      });
    });

    // Listen for insights updates
    newSocket.on('insights_update', (data) => {
      console.log('✨ Insights update received:', data);
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [data, ...prev].slice(0, 50));
      
      toast.success('Nuevos insights disponibles', {
        description: 'Haz clic en el botón de insights para ver más',
        duration: 5000,
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ socket, isConnected, unreadCount, notifications, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
