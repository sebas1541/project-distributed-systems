import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { InsightsModule } from './insights/insights.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { WebSocketModule } from './websocket/websocket.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    WebSocketModule,
    InsightsModule,
    RabbitMQModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
