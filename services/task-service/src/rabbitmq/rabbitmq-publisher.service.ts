import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { connect, Connection, Channel } from 'amqplib';

interface TaskEventPayload {
  taskId: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: string;
}

@Injectable()
export class RabbitmqPublisherService implements OnModuleInit {
  private readonly logger = new Logger(RabbitmqPublisherService.name);
  private connection: Connection;
  private channel: Channel;
  private isConnected = false;

  async onModuleInit() {
    await this.connect();
  }

  private async connect() {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
      this.connection = await connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      const exchange = 'tasks';
      await this.channel.assertExchange(exchange, 'topic', { durable: true });

      this.isConnected = true;
      this.logger.log('Connected to RabbitMQ for publishing');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publishTaskCreated(task: any): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('RabbitMQ not connected, skipping event publication');
      return;
    }

    const payload: TaskEventPayload = {
      taskId: task.id,
      userId: task.userId,
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      priority: task.priority || 'medium',
    };

    try {
      this.channel.publish(
        'tasks',
        'task.created',
        Buffer.from(JSON.stringify(payload)),
        { persistent: true },
      );
      this.logger.log(`Published task.created event for task ${task.id}`);
    } catch (error) {
      this.logger.error('Failed to publish task.created event:', error);
    }
  }

  async publishTaskUpdated(task: any): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('RabbitMQ not connected, skipping event publication');
      return;
    }

    const payload: TaskEventPayload = {
      taskId: task.id,
      userId: task.userId,
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      priority: task.priority || 'medium',
    };

    try {
      this.channel.publish(
        'tasks',
        'task.updated',
        Buffer.from(JSON.stringify(payload)),
        { persistent: true },
      );
      this.logger.log(`Published task.updated event for task ${task.id}`);
    } catch (error) {
      this.logger.error('Failed to publish task.updated event:', error);
    }
  }

  async publishTaskDeleted(taskId: string, userId: string): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('RabbitMQ not connected, skipping event publication');
      return;
    }

    const payload = {
      taskId,
      userId,
    };

    try {
      this.channel.publish(
        'tasks',
        'task.deleted',
        Buffer.from(JSON.stringify(payload)),
        { persistent: true },
      );
      this.logger.log(`Published task.deleted event for task ${taskId}`);
    } catch (error) {
      this.logger.error('Failed to publish task.deleted event:', error);
    }
  }
}
