import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { AuthController } from './auth/auth.controller';
import { GoogleCalendarService } from './calendar/google-calendar.service';
import { RabbitMQConsumerService } from './rabbitmq/rabbitmq-consumer.service';
import { UserCalendarToken } from './entities/user-calendar-token.entity';
import { TaskCalendarMapping } from './entities/task-calendar-mapping.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'postgres',
      port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'scheduler_db',
      entities: [UserCalendarToken, TaskCalendarMapping],
      synchronize: true, // Auto-create tables (disable in production)
    }),
    TypeOrmModule.forFeature([UserCalendarToken, TaskCalendarMapping]),
  ],
  controllers: [HealthController, AuthController],
  providers: [GoogleCalendarService, RabbitMQConsumerService],
})
export class AppModule {}
