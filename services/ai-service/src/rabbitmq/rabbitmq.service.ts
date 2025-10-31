import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';

interface TaskCreationEvent {
  userId: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high';
  source: 'voice' | 'manual';
}

@Injectable()
export class RabbitmqService implements OnModuleInit {
  private readonly logger = new Logger(RabbitmqService.name);
  private channelWrapper: ChannelWrapper;
  private readonly exchange = 'tasks';
  private readonly routingKey = 'task.create';

  async onModuleInit() {
    const rabbitmqUrl =
      process.env.RABBITMQ_URL || 'amqp://smartplanner:rabbitmq_password@rabbitmq:5672';

    try {
      const connection = amqp.connect([rabbitmqUrl]);

      this.channelWrapper = connection.createChannel({
        json: true,
        setup: async (channel) => {
          await channel.assertExchange(this.exchange, 'topic', {
            durable: true,
          });
          this.logger.log(
            `Connected to RabbitMQ and exchange "${this.exchange}" created`,
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

  async publishTaskCreation(event: TaskCreationEvent): Promise<void> {
    try {
      await this.channelWrapper.publish(this.exchange, this.routingKey, event);

      this.logger.log(
        `Published task creation event: ${JSON.stringify(event)}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish task creation event: ${error.message}`,
      );
      throw error;
    }
  }
}
