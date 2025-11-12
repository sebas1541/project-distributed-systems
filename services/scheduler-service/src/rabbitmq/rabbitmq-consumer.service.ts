import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { connect, Connection, Channel } from 'amqplib';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleCalendarService } from '../calendar/google-calendar.service';
import { TaskCalendarMapping } from '../entities/task-calendar-mapping.entity';

interface TaskEvent {
  taskId: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string;
}

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQConsumerService.name);
  private connection: Connection;
  private channel: Channel;

  constructor(
    private calendarService: GoogleCalendarService,
    @InjectRepository(TaskCalendarMapping)
    private mappingRepository: Repository<TaskCalendarMapping>,
  ) {}

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

      // Queue for task.created events
      const createdQueue = 'scheduler-service-task-created';
      await this.channel.assertQueue(createdQueue, { durable: true });
      await this.channel.bindQueue(createdQueue, exchange, 'task.created');

      // Queue for task.updated events
      const updatedQueue = 'scheduler-service-task-updated';
      await this.channel.assertQueue(updatedQueue, { durable: true });
      await this.channel.bindQueue(updatedQueue, exchange, 'task.updated');

      // Queue for task.deleted events
      const deletedQueue = 'scheduler-service-task-deleted';
      await this.channel.assertQueue(deletedQueue, { durable: true });
      await this.channel.bindQueue(deletedQueue, exchange, 'task.deleted');

      // Consume messages
      this.consumeCreated(createdQueue);
      this.consumeUpdated(updatedQueue);
      this.consumeDeleted(deletedQueue);

      this.logger.log('Connected to RabbitMQ and listening for task events');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private consumeCreated(queue: string) {
    this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const event: TaskEvent = JSON.parse(msg.content.toString());
          await this.handleTaskCreated(event);
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error('Error processing task.created:', error);
          this.channel.nack(msg, false, false);
        }
      }
    });
  }

  private consumeUpdated(queue: string) {
    this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const event: TaskEvent = JSON.parse(msg.content.toString());
          await this.handleTaskUpdated(event);
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error('Error processing task.updated:', error);
          this.channel.nack(msg, false, false);
        }
      }
    });
  }

  private consumeDeleted(queue: string) {
    this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const event: { taskId: string; userId: string } = JSON.parse(msg.content.toString());
          await this.handleTaskDeleted(event);
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error('Error processing task.deleted:', error);
          this.channel.nack(msg, false, false);
        }
      }
    });
  }

  private async handleTaskCreated(event: TaskEvent) {
    this.logger.log(`Task created: ${event.taskId} for user ${event.userId}`);

    // Check if mapping already exists to prevent duplicates
    const existingMapping = await this.mappingRepository.findOne({
      where: { taskId: event.taskId, userId: event.userId },
    });

    if (existingMapping) {
      this.logger.log(`Mapping already exists for task ${event.taskId}, skipping creation`);
      return;
    }

    const isConnected = await this.calendarService.isConnected(event.userId);
    if (!isConnected) {
      this.logger.log(`User ${event.userId} not connected to Google Calendar`);
      return;
    }

    if (!event.dueDate) {
      this.logger.log(`Task ${event.taskId} has no due date, skipping calendar event`);
      return;
    }

    const googleEventId = await this.calendarService.createEvent(
      event.userId,
      event.title,
      event.description,
      new Date(event.dueDate),
    );

    if (googleEventId) {
      await this.mappingRepository.save({
        taskId: event.taskId,
        userId: event.userId,
        googleEventId,
        calendarId: 'primary',
      });
      this.logger.log(`Mapped task ${event.taskId} to event ${googleEventId}`);
    }
  }

  private async handleTaskUpdated(event: TaskEvent) {
    this.logger.log(`Task updated: ${event.taskId} for user ${event.userId}`);

    const mapping = await this.mappingRepository.findOne({
      where: { taskId: event.taskId, userId: event.userId },
    });

    if (!mapping) {
      this.logger.log(`No mapping found for task ${event.taskId}, creating event`);
      await this.handleTaskCreated(event);
      return;
    }

    if (!event.dueDate) {
      // If due date removed, delete calendar event
      await this.calendarService.deleteEvent(event.userId, mapping.googleEventId);
      await this.mappingRepository.delete(mapping.id);
      this.logger.log(`Deleted event ${mapping.googleEventId} (no due date)`);
      return;
    }

    const success = await this.calendarService.updateEvent(
      event.userId,
      mapping.googleEventId,
      event.title,
      event.description,
      new Date(event.dueDate),
    );

    if (success) {
      this.logger.log(`Updated event ${mapping.googleEventId}`);
    }
  }

  private async handleTaskDeleted(event: { taskId: string; userId: string }) {
    this.logger.log(`Task deleted: ${event.taskId} for user ${event.userId}`);

    const mapping = await this.mappingRepository.findOne({
      where: { taskId: event.taskId, userId: event.userId },
    });

    if (mapping) {
      await this.calendarService.deleteEvent(event.userId, mapping.googleEventId);
      await this.mappingRepository.delete(mapping.id);
      this.logger.log(`Deleted event ${mapping.googleEventId}`);
    }
  }
}
