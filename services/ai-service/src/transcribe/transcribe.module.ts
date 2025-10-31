import { Module } from '@nestjs/common';
import { TranscribeController } from './transcribe.controller';
import { TranscribeService } from './transcribe.service';
import { NlpModule } from '../nlp/nlp.module';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [NlpModule, RabbitmqModule],
  controllers: [TranscribeController],
  providers: [TranscribeService],
})
export class TranscribeModule {}
