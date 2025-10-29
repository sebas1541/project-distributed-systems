import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { unlink } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

@Injectable()
export class TranscribeService {
  private readonly logger = new Logger(TranscribeService.name);
  private readonly whisperPath = join(
    __dirname,
    '../../whisper.cpp/build/bin/whisper-cli',
  );
  private readonly modelPath = join(
    __dirname,
    '../../whisper.cpp/models/ggml-base.bin',
  );

  async transcribe(audioFilePath: string): Promise<string> {
    this.logger.log(`Starting transcription for: ${audioFilePath}`);

    try {
      // Call whisper.cpp with the audio file
      const command = `${this.whisperPath} -m ${this.modelPath} -f ${audioFilePath} --output-txt --output-file /tmp/whisper-output`;

      this.logger.log(`Executing command: ${command}`);

      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      this.logger.log(`Whisper stdout: ${stdout}`);
      if (stderr) {
        this.logger.warn(`Whisper stderr: ${stderr}`);
      }

      // Whisper.cpp outputs the transcription to stdout
      // Parse the output to extract just the transcribed text
      const transcription = this.parseWhisperOutput(stdout);

      // Clean up the uploaded audio file
      await unlink(audioFilePath).catch((err) =>
        this.logger.warn(`Failed to delete file: ${err.message}`),
      );

      this.logger.log(`Transcription completed: ${transcription}`);
      return transcription;
    } catch (error) {
      this.logger.error(`Transcription error: ${error.message}`);
      // Clean up the uploaded audio file even on error
      await unlink(audioFilePath).catch(() => {});
      throw new Error(`Whisper transcription failed: ${error.message}`);
    }
  }

  private parseWhisperOutput(output: string): string {
    // Whisper.cpp outputs timestamps and text
    // Format: [00:00:00.000 --> 00:00:05.000]  Transcribed text here
    // We want to extract just the text part

    const lines = output.split('\n');
    const transcriptionLines = lines
      .filter((line) => line.includes('-->'))
      .map((line) => {
        // Remove timestamp part and trim
        const parts = line.split(']');
        return parts.length > 1 ? parts[1].trim() : '';
      })
      .filter((line) => line.length > 0);

    return transcriptionLines.join(' ').trim();
  }
}

