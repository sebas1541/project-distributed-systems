import { Module } from '@nestjs/common';
import { RabbitmqConsumerService } from './rabbitmq-consumer.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TasksModule],
  providers: [RabbitmqConsumerService],
})
export class RabbitmqModule {}
