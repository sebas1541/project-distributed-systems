import { Injectable, OnModuleInit, Logger, Inject, forwardRef } from '@nestjs/common';
import * as amqp from 'amqplib';
import { NotificationsGateway } from '../websocket/websocket.gateway';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private tasks: Map<string, Task> = new Map();

  constructor(
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async onModuleInit() {
    await this.connect();
  }

  private async connect() {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      this.connection = await amqp.connect(rabbitmqUrl) as any;
      this.channel = await (this.connection as any).createChannel();
      
      // Declare exchanges and queues
      await this.channel.assertExchange('tasks', 'topic', { durable: true });
      await this.channel.assertQueue('insights_queue', { durable: true });
      
      // Bind queue to exchange for task events
      await this.channel.bindQueue('insights_queue', 'tasks', 'task.created');
      await this.channel.bindQueue('insights_queue', 'tasks', 'task.updated');
      await this.channel.bindQueue('insights_queue', 'tasks', 'task.deleted');
      
      // Declare notifications exchange and queue for WebSocket broadcasting
      await this.channel.assertExchange('notifications', 'fanout', { durable: true });
      await this.channel.assertQueue('insights_notifications_queue', { durable: true });
      await this.channel.bindQueue('insights_notifications_queue', 'notifications', '');
      
      this.logger.log('✅ Connected to RabbitMQ');
      
      // Start consuming after setup is complete
      await this.consumeTaskEvents();
      await this.consumeNotifications();
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      // Retry connection after 5 seconds
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async consumeTaskEvents() {
    try {
      await this.channel.consume('insights_queue', async (msg) => {
        if (msg) {
          const content = msg.content.toString();
          const routingKey = msg.fields.routingKey;
          
          try {
            const data = JSON.parse(content);
            
            switch (routingKey) {
              case 'task.created':
              case 'task.updated':
                // Map taskId to id for consistency
                const task = {
                  id: data.taskId || data.id,
                  userId: data.userId,
                  title: data.title,
                  description: data.description,
                  priority: data.priority || 'MEDIUM',
                  status: data.status || 'PENDING',
                  dueDate: data.dueDate,
                  createdAt: data.createdAt || new Date(),
                  updatedAt: data.updatedAt || new Date(),
                };
                this.tasks.set(task.id, task);
                this.logger.log(`Task ${routingKey.split('.')[1]}: ${task.title} (ID: ${task.id})`);
                break;
              
              case 'task.deleted':
                const taskId = data.taskId || data.id;
                this.tasks.delete(taskId);
                this.logger.log(`Task deleted: ${taskId}`);
                break;
            }
            
            this.channel.ack(msg);
          } catch (error) {
            this.logger.error('Error processing message:', error);
            this.channel.nack(msg, false, false);
          }
        }
      });
      
      this.logger.log('📥 Consuming task events from insights_queue');
    } catch (error) {
      this.logger.error('Error setting up consumer:', error);
    }
  }

  // Get all cached tasks
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  // Get tasks by user
  getTasksByUser(userId: string): Task[] {
    return this.getAllTasks().filter(task => task.userId === userId);
  }

  // Get upcoming tasks (next 24 hours)
  getUpcomingTasks(userId: string): Task[] {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return this.getTasksByUser(userId).filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= now && dueDate <= tomorrow && task.status !== 'COMPLETED';
    });
  }

  // Get tasks due in 10 minutes
  getTasksDueIn10Minutes(): Task[] {
    const now = new Date();
    const in10Minutes = new Date(now.getTime() + 10 * 60 * 1000);
    const in11Minutes = new Date(now.getTime() + 11 * 60 * 1000);
    
    return this.getAllTasks().filter(task => {
      if (!task.dueDate || task.status === 'COMPLETED') return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= in10Minutes && dueDate < in11Minutes;
    });
  }

  // Consume notifications and emit via WebSocket
  private async consumeNotifications() {
    try {
      await this.channel.consume('insights_notifications_queue', async (msg) => {
        if (msg) {
          const content = msg.content.toString();
          
          try {
            const notification = JSON.parse(content);
            this.logger.log(`📩 Received notification: ${notification.type} for user ${notification.userId}`);
            
            // Emit to specific user via WebSocket
            const emitted = this.notificationsGateway.emitToUser(
              notification.userId,
              notification.type.toLowerCase(),
              notification
            );
            
            if (emitted) {
              this.logger.log(`✅ Notification sent via WebSocket to user ${notification.userId}`);
            } else {
              this.logger.warn(`⚠️ User ${notification.userId} not connected, notification queued`);
            }
            
            this.channel.ack(msg);
          } catch (error) {
            this.logger.error('Error processing notification:', error);
            this.channel.nack(msg, false, false);
          }
        }
      });
      
      this.logger.log('📥 Consuming notifications from insights_notifications_queue');
    } catch (error) {
      this.logger.error('Error setting up notifications consumer:', error);
    }
  }

  // Publish notification
  async publishNotification(notification: any) {
    try {
      await this.channel.assertExchange('notifications', 'fanout', { durable: true });
      this.channel.publish(
        'notifications',
        '',
        Buffer.from(JSON.stringify(notification)),
        { persistent: true }
      );
      this.logger.log(`📢 Published notification: ${notification.type}`);
    } catch (error) {
      this.logger.error('Error publishing notification:', error);
    }
  }
}
