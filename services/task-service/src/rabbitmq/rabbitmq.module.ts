import { Module } from '@nestjs/common';
import { RabbitmqConsumerService } from './rabbitmq-consumer.service';
import { RabbitmqPublisherService } from './rabbitmq-publisher.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TasksModule],
  providers: [RabbitmqConsumerService, RabbitmqPublisherService],
  exports: [RabbitmqPublisherService],
})
export class RabbitmqModule {}
