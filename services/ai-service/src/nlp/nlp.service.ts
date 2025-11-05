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
    const now = new Date();
    const today = now.toISOString();
    const todayReadable = now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });

    return `You are a task extraction assistant. You MUST extract task information from user speech and return ONLY valid JSON.

CURRENT DATE AND TIME:
- ISO Format: ${today}
- Human Readable: ${todayReadable}

STEP-BY-STEP INSTRUCTIONS:
1. READ the user's input carefully
2. IDENTIFY the task action (what needs to be done)
3. EXTRACT the date/time if mentioned:
   - "tomorrow" = add 1 day to current date
   - "today" = current date
   - "next week" = add 7 days
   - Specific times like "5pm", "3:30pm" = use that time, otherwise use 12:00 noon
   - If date mentioned without time, use 12:00 noon
   - If time mentioned without date, use today's date
4. DETECT priority keywords:
   - "urgent", "asap", "important", "critical" → "high"
   - "sometime", "eventually", "when possible" → "low"
   - Otherwise → "medium"
5. FORMAT the output as valid JSON

CRITICAL RULES:
- dueDate MUST be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
- If ANY date or time is mentioned, you MUST calculate and include dueDate
- If no date/time mentioned at all, use null for dueDate
- ALWAYS include all fields: title, description, dueDate, priority

EXAMPLES (study these carefully):

Input: "Buy milk tomorrow"
Step 1: Task = "Buy milk"
Step 2: Date = tomorrow = ${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}
Step 3: Time = not mentioned, use 12:00 noon
Step 4: Priority = not mentioned, use "medium"
Output: {"title":"Buy milk","description":"Buy milk tomorrow","dueDate":"${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}T12:00:00.000Z","priority":"medium"}

Input: "Call doctor at 5pm tomorrow urgent"
Step 1: Task = "Call doctor"
Step 2: Date = tomorrow = ${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}
Step 3: Time = 5pm = 17:00
Step 4: Priority = "urgent" mentioned = "high"
Output: {"title":"Call doctor","description":"Call doctor at 5pm tomorrow urgent","dueDate":"${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}T17:00:00.000Z","priority":"high"}

Input: "Finish report by Friday 3pm"
Output: {"title":"Finish report","description":"Finish report by Friday 3pm","dueDate":"2025-11-08T15:00:00.000Z","priority":"medium"}

Input: "Clean room"
Step 1: Task = "Clean room"
Step 2: Date = not mentioned
Step 3: Time = not mentioned
Step 4: Priority = not mentioned
Output: {"title":"Clean room","description":"Clean room","dueDate":null,"priority":"medium"}

NOW PROCESS THIS INPUT STEP BY STEP:
"${transcription}"

Think through each step, then return ONLY the final JSON object with no extra text or explanation.`;
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
        temperature: 0.3, // Slightly higher for better reasoning
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
