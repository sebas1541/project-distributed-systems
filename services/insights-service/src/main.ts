import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisLoggerService } from './redis-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new RedisLoggerService('insights-service'),
  });
  
  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3005;
  await app.listen(port);
  console.log(`🚀 Insights Service is running on port ${port}`);
}

bootstrap();
