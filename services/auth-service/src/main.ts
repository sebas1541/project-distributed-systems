import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RedisLoggerService } from './redis-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new RedisLoggerService('auth-service'),
  });
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`Auth Service is running on: http://localhost:${port}`);
}

bootstrap();
