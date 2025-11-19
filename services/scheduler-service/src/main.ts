import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RedisLoggerService } from './redis-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new RedisLoggerService('scheduler-service'),
  });
  
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  
  await app.listen(3004);
  console.log('🗓️  Scheduler Service running on port 3004');
}

bootstrap();
