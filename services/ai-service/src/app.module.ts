import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TranscribeModule } from './transcribe/transcribe.module';
import { HealthController } from './health.controller';

@Module({
  imports: [TranscribeModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
