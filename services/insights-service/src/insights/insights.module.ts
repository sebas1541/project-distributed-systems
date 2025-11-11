import { Module } from '@nestjs/common';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { SchedulerService } from '../scheduler/scheduler.service';

@Module({
  imports: [RabbitMQModule],
  controllers: [InsightsController],
  providers: [InsightsService, SchedulerService],
})
export class InsightsModule {}
