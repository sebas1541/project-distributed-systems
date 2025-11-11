import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleRef } from '@nestjs/core';
import { TasksModule } from './tasks/tasks.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { TasksService } from './tasks/tasks.service';
import { RabbitmqPublisherService } from './rabbitmq/rabbitmq-publisher.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV === 'development',
      }),
      inject: [ConfigService],
    }),
    TasksModule,
    RabbitmqModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements OnModuleInit {
  constructor(private moduleRef: ModuleRef) {}

  onModuleInit() {
    // Wire RabbitMQ publisher to TasksService
    const tasksService = this.moduleRef.get(TasksService, { strict: false });
    const rabbitmqPublisher = this.moduleRef.get(RabbitmqPublisherService, { strict: false });
    tasksService.setRabbitmqPublisher(rabbitmqPublisher);
  }
}
