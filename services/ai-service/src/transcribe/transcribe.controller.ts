import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Headers,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TranscribeService } from './transcribe.service';
import { NlpService } from '../nlp/nlp.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('transcribe')
export class TranscribeController {
  private readonly logger = new Logger(TranscribeController.name);

  constructor(
    private readonly transcribeService: TranscribeService,
    private readonly nlpService: NlpService,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(webm|wav|mp3|m4a|ogg)$/)) {
          return cb(new Error('Only audio files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-user-id') userId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No audio file provided');
    }

    try {
      // Step 1: Transcribe audio to text
      const transcription = await this.transcribeService.transcribe(file.path);
      this.logger.log(`Transcription: ${transcription}`);

      // Step 2: Extract task data using NLP
      const taskData = await this.nlpService.extractTaskFromTranscription(
        transcription,
      );

      // Step 3: If task data extracted, publish to RabbitMQ
      if (taskData && userId) {
        try {
          await this.rabbitmqService.publishTaskCreation({
            userId,
            ...taskData,
            source: 'voice',
          });

          this.logger.log(`Task creation event published for user ${userId}`);

          return {
            success: true,
            transcription,
            taskCreated: true,
            taskData,
            filename: file.filename,
          };
        } catch (rabbitmqError) {
          this.logger.error(
            `RabbitMQ publish failed: ${rabbitmqError.message}`,
          );
          // Still return success for transcription, but indicate task wasn't created
          return {
            success: true,
            transcription,
            taskCreated: false,
            taskData,
            error: 'Failed to create task automatically',
            filename: file.filename,
          };
        }
      }

      // No task detected or no userId
      return {
        success: true,
        transcription,
        taskCreated: false,
        message: taskData
          ? 'Task detected but no user ID provided'
          : 'No task detected in transcription',
        filename: file.filename,
      };
    } catch (error) {
      throw new BadRequestException(`Transcription failed: ${error.message}`);
    }
  }
}

