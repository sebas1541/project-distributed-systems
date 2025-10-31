import { Injectable, Logger } from '@nestjs/common';

export interface TaskData {
  title: string;
  description: string;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high';
}

@Injectable()
export class NlpService {
  private readonly logger = new Logger(NlpService.name);
  private readonly ollamaUrl =
    process.env.OLLAMA_URL || 'http://host.docker.internal:11434';
  private readonly model = process.env.OLLAMA_MODEL || 'llama3.2:3b';

  async extractTaskFromTranscription(
    transcription: string,
  ): Promise<TaskData | null> {
    this.logger.log(
      `Extracting task data from transcription: ${transcription}`,
    );

    try {
      const prompt = this.buildPrompt(transcription);
      const response = await this.callOllama(prompt);
      const taskData = this.parseResponse(response);

      this.logger.log(`Extracted task data: ${JSON.stringify(taskData)}`);
      return taskData;
    } catch (error) {
      this.logger.error(`Failed to extract task: ${error.message}`);
      return null;
    }
  }

  private buildPrompt(transcription: string): string {
    const today = new Date().toISOString();

    return `You are a task extraction assistant. Extract task information from the user's speech and return ONLY valid JSON.

Current date/time: ${today}

Rules:
- title: Short task name (max 100 characters)
- description: Full details from the speech
- dueDate: ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ) or null if not mentioned
- priority: "low", "medium", or "high" (default: "medium")
- Parse relative dates like "tomorrow", "next week", etc.
- Detect urgency keywords: "urgent", "important", "asap" → high priority
- If no task intent detected, return null

Examples:
Input: "Buy milk tomorrow"
Output: {"title":"Buy milk","description":"Buy milk tomorrow","dueDate":"2025-10-31T12:00:00.000Z","priority":"medium"}

Input: "Call doctor urgent"
Output: {"title":"Call doctor","description":"Call doctor urgent","dueDate":null,"priority":"high"}

Input: "Finish report by Friday 3pm"
Output: {"title":"Finish report","description":"Finish report by Friday 3pm","dueDate":"2025-11-01T15:00:00.000Z","priority":"medium"}

Now extract from: "${transcription}"

Return ONLY the JSON object, no extra text.`;
  }

  private async callOllama(prompt: string): Promise<string> {
    this.logger.log(`Calling Ollama at ${this.ollamaUrl}`);

    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        temperature: 0.1, // Low temperature for consistent output
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data.response;
  }

  private parseResponse(response: string): TaskData | null {
    try {
      // Remove markdown code blocks if present
      let cleaned = response.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
      }

      // Parse JSON
      const parsed = JSON.parse(cleaned);

      // Validate required fields
      if (!parsed.title || typeof parsed.title !== 'string') {
        this.logger.warn('Invalid task data: missing or invalid title');
        return null;
      }

      // Return validated task data
      return {
        title: parsed.title.substring(0, 100),
        description: parsed.description || parsed.title,
        dueDate: parsed.dueDate || null,
        priority: ['low', 'medium', 'high'].includes(parsed.priority)
          ? parsed.priority
          : 'medium',
      };
    } catch (error) {
      this.logger.error(`Failed to parse LLM response: ${error.message}`);
      this.logger.debug(`Raw response: ${response}`);
      return null;
    }
  }
}
