import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private notifiedTasks: Set<string> = new Set();

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  // Check every minute for tasks due in 10 minutes
  @Cron(CronExpression.EVERY_MINUTE)
  async checkUpcomingTasks() {
    try {
      const tasksDueIn10Min = this.rabbitMQService.getTasksDueIn10Minutes();
      
      for (const task of tasksDueIn10Min) {
        // Avoid sending duplicate notifications
        const notificationKey = `${task.id}-10min`;
        if (this.notifiedTasks.has(notificationKey)) {
          continue;
        }
        
        // Send notification
        await this.rabbitMQService.publishNotification({
          type: 'TASK_REMINDER',
          userId: task.userId,
          task: {
            id: task.id,
            title: task.title,
            dueDate: task.dueDate,
            priority: task.priority,
          },
          message: `⏰ Recordatorio: "${task.title}" vence en 10 minutos`,
          timestamp: new Date().toISOString(),
        });
        
        this.notifiedTasks.add(notificationKey);
        this.logger.log(`Sent reminder for task: ${task.title}`);
      }
    } catch (error) {
      this.logger.error('Error checking upcoming tasks:', error);
    }
  }

  // Morning summary at 8 AM
  @Cron('0 8 * * *')
  async sendMorningSummary() {
    try {
      const allTasks = this.rabbitMQService.getAllTasks();
      const userTasksMap = new Map<string, any[]>();
      
      // Group tasks by user
      allTasks.forEach(task => {
        if (!userTasksMap.has(task.userId)) {
          userTasksMap.set(task.userId, []);
        }
        userTasksMap.get(task.userId).push(task);
      });
      
      // Send summary to each user
      for (const [userId, tasks] of userTasksMap) {
        const pendingTasks = tasks.filter(t => t.status === 'PENDING');
        const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
        const todayTasks = tasks.filter(t => {
          if (!t.dueDate) return false;
          const today = new Date();
          const dueDate = new Date(t.dueDate);
          return dueDate.toDateString() === today.toDateString();
        });
        
        await this.rabbitMQService.publishNotification({
          type: 'MORNING_SUMMARY',
          userId,
          summary: {
            totalPending: pendingTasks.length,
            totalInProgress: inProgressTasks.length,
            dueToday: todayTasks.length,
          },
          message: `☀️ Buenos días! Tienes ${todayTasks.length} tareas para hoy`,
          timestamp: new Date().toISOString(),
        });
      }
      
      this.logger.log('Sent morning summaries');
    } catch (error) {
      this.logger.error('Error sending morning summary:', error);
    }
  }

  // Clean up old notification keys every hour
  @Cron(CronExpression.EVERY_HOUR)
  cleanupNotifications() {
    this.notifiedTasks.clear();
    this.logger.log('Cleaned up notification cache');
  }
}
