import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Set global prefix
  app.setGlobalPrefix('api/ai');

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`🤖 AI Service running on: http://localhost:${port}`);
}
bootstrap();

