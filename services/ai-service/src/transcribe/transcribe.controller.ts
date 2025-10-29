import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TranscribeService } from './transcribe.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('transcribe')
export class TranscribeController {
  constructor(private readonly transcribeService: TranscribeService) {}

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
  async transcribe(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No audio file provided');
    }

    try {
      const transcription = await this.transcribeService.transcribe(file.path);
      return {
        success: true,
        transcription,
        filename: file.filename,
      };
    } catch (error) {
      throw new BadRequestException(`Transcription failed: ${error.message}`);
    }
  }
}

