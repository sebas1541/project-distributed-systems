import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { TasksService } from '../tasks/tasks.service';

interface TaskCreationEvent {
  userId: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high';
  source: 'voice' | 'manual';
}

@Injectable()
export class RabbitmqConsumerService implements OnModuleInit {
  private readonly logger = new Logger(RabbitmqConsumerService.name);
  private channelWrapper: ChannelWrapper;
  private readonly exchange = 'tasks';
  private readonly routingKey = 'task.create';
  private readonly queue = 'task-service-task-create';

  constructor(private readonly tasksService: TasksService) {}

  async onModuleInit() {
    const rabbitmqUrl =
      process.env.RABBITMQ_URL ||
      'amqp://smartplanner:rabbitmq_password@rabbitmq:5672';

    try {
      const connection = amqp.connect([rabbitmqUrl]);

      this.channelWrapper = connection.createChannel({
        json: true,
        setup: async (channel) => {
          await channel.assertExchange(this.exchange, 'topic', {
            durable: true,
          });

          await channel.assertQueue(this.queue, { durable: true });
          await channel.bindQueue(this.queue, this.exchange, this.routingKey);

          await channel.consume(this.queue, async (msg) => {
            if (msg) {
              try {
                const event: TaskCreationEvent = JSON.parse(
                  msg.content.toString(),
                );
                this.logger.log(
                  `Received task creation event: ${JSON.stringify(event)}`,
                );

                await this.handleTaskCreation(event);

                channel.ack(msg);
                this.logger.log(
                  `Task created successfully for user ${event.userId}`,
                );
              } catch (error) {
                this.logger.error(
                  `Failed to process task creation: ${error.message}`,
                );
                // Negative acknowledgment - message will be requeued
                channel.nack(msg, false, true);
              }
            }
          });

          this.logger.log(
            `Connected to RabbitMQ and listening on queue "${this.queue}"`,
          );
        },
      });

      this.channelWrapper.on('error', (err) => {
        this.logger.error(`RabbitMQ channel error: ${err.message}`);
      });

      this.channelWrapper.on('close', () => {
        this.logger.warn('RabbitMQ channel closed');
      });
    } catch (error) {
      this.logger.error(`Failed to connect to RabbitMQ: ${error.message}`);
    }
  }

  private async handleTaskCreation(event: TaskCreationEvent): Promise<void> {
    // Create the task using TasksService
    await this.tasksService.create(event.userId, {
      title: event.title,
      description: event.description,
      priority: event.priority as any, // Cast to match TaskPriority enum
      dueDate: event.dueDate || undefined,
    });
  }
}
