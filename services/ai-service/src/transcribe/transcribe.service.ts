import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { unlink } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

@Injectable()
export class TranscribeService {
  private readonly logger = new Logger(TranscribeService.name);
  private readonly whisperPath = process.env.WHISPER_PATH || join(
    __dirname,
    '../../whisper.cpp/build/bin/whisper-cli',
  );
  private readonly modelPath = process.env.WHISPER_MODEL_PATH || join(
    __dirname,
    '../../whisper.cpp/models/ggml-small.bin',
  );
  private readonly language =
    process.env.WHISPER_LANGUAGE?.trim() || 'auto';

  async transcribe(audioFilePath: string, language: string = 'en'): Promise<string> {
    this.logger.log(`Starting transcription for: ${audioFilePath} in language: ${language}`);

    let wavFilePath: string | null = null;

    try {
      // Convert to WAV format for Whisper.cpp
      wavFilePath = audioFilePath.replace(/\.[^.]+$/, '.wav');
      const convertCommand = `ffmpeg -i ${audioFilePath} -ar 16000 -ac 1 -c:a pcm_s16le ${wavFilePath}`;
      
      this.logger.log(`Converting audio: ${convertCommand}`);
      await execAsync(convertCommand);

      // Call whisper.cpp with the WAV file with specific language
      const command = `${this.whisperPath} -m ${this.modelPath} -f ${wavFilePath} --language ${language} --output-txt --output-file /tmp/whisper-output`;

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

      // Clean up both audio files
      await unlink(audioFilePath).catch((err) =>
        this.logger.warn(`Failed to delete original file: ${err.message}`),
      );
      if (wavFilePath) {
        await unlink(wavFilePath).catch((err) =>
          this.logger.warn(`Failed to delete WAV file: ${err.message}`),
        );
      }

      this.logger.log(`Transcription completed: ${transcription}`);
      return transcription;
    } catch (error) {
      this.logger.error(`Transcription error: ${error.message}`);
      // Clean up both files even on error
      await unlink(audioFilePath).catch(() => {});
      if (wavFilePath) {
        await unlink(wavFilePath).catch(() => {});
      }
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
