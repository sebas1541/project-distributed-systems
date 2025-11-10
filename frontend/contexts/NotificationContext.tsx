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
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Load notifications from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notifications');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });

  // Persist notifications to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const user = JSON.parse(userStr);
    const userId = user.id;

    // Connect to WebSocket server through Traefik
    // In development, connect to Traefik on localhost:80
    // In production, use the same origin or env variable
    const socketUrl = process.env.NEXT_PUBLIC_INSIGHTS_WS_URL || 'http://localhost';
    console.log('🔌 Connecting to WebSocket at:', socketUrl);
    console.log('📍 Path:', '/notifications/socket.io');
    
    const newSocket = io(socketUrl, {
      path: '/notifications/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to notifications server');
      console.log('🆔 Socket ID:', newSocket.id);
      console.log('👤 Registering user:', userId);
      setIsConnected(true);
      
      // Register user with socket
      newSocket.emit('register', userId);
    });

    newSocket.on('registered', (data) => {
      console.log('✅ Registered for notifications:', data);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      console.error('🔍 Error details:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from notifications server');
      console.log('📋 Reason:', reason);
      setIsConnected(false);
    });

    const removeEmojis = (text: string) => {
      return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
    };

    // Listen for task reminders
    newSocket.on('task_reminder', (data) => {
      console.log('🔔 Task reminder received:', data);
      setUnreadCount((prev) => {
        console.log('📊 Unread count:', prev + 1);
        return prev + 1;
      });
      setNotifications((prev) => {
        const updated = [data, ...prev].slice(0, 50);
        console.log('📝 Total notifications:', updated.length);
        return updated;
      });
      
      toast.warning(removeEmojis(data.message), {
        description: `Prioridad: ${data.task.priority}`,
        duration: 8000,
      });
    });

    // Listen for morning summaries
    newSocket.on('morning_summary', (data) => {
      console.log('☀️ Morning summary received:', data);
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [data, ...prev].slice(0, 50));
      
      toast.info(removeEmojis(data.message), {
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

  const clearNotifications = () => {
    console.log('🗑️ Clearing all notifications');
    setNotifications([]);
    setUnreadCount(0);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('notifications');
    }
  };

  return (
    <NotificationContext.Provider value={{ socket, isConnected, unreadCount, notifications, markAsRead, clearNotifications }}>
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
