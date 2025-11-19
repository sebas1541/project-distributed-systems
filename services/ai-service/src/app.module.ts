import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TranscribeModule } from './transcribe/transcribe.module';
import { HealthController } from './health.controller';
import { LogsController } from './logs.controller';

@Module({
  imports: [TranscribeModule],
  controllers: [AppController, HealthController, LogsController],
  providers: [AppService],
})
export class AppModule {}
