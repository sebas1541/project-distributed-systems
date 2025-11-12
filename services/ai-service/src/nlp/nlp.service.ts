import { Injectable, Logger } from '@nestjs/common';

export interface TaskData {
  confidence: number; // 0-100 scale
  title: string;
  description: string;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high';
}

@Injectable()
export class NlpService {
  private readonly logger = new Logger(NlpService.name);
  private readonly geminiApiKey = process.env.GEMINI_API_KEY;
  private readonly geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  async extractTaskFromTranscription(
    transcription: string,
  ): Promise<TaskData | null> {
    this.logger.log(
      `Extracting task data from transcription: ${transcription}`,
    );

    try {
      const prompt = this.buildPrompt(transcription);
      const response = await this.callGemini(prompt);
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
    
    // Colombia timezone (UTC-5)
    const colombiaTime = new Date(now.getTime() - (5 * 60 * 60 * 1000));
    const todayReadable = now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota',
    });

    return `You are a BILINGUAL task extraction assistant (English/Spanish). You MUST extract task information from user speech and return ONLY valid JSON.

IMPORTANT: This text comes from voice-to-text transcription (Whisper small model), so it may contain:
- Typos and spelling errors (in English or Spanish)
- Homophones (words that sound alike but are spelled differently)
- Missing punctuation
- Informal speech patterns
- Run-on sentences
- The input can be in ENGLISH or SPANISH

Your job is to:
1. DETECT the language (English or Spanish)
2. CORRECT any obvious typos or transcription errors in that language
3. INTERPRET what the user likely meant to say
4. EXTRACT the core task information accurately
5. KEEP the title and description in the ORIGINAL LANGUAGE
6. CREATE A SMART DESCRIPTION: Remove redundant time/date info from description and add helpful context instead

USER TIMEZONE: America/Bogota (UTC-5 / Colombia Time)
CRITICAL: When the user says a time like "3pm" or "3 de la tarde", they mean 3pm Colombia time (UTC-5).
You MUST convert this to UTC by ADDING 5 hours.
Example: User says "3pm" → They mean 3pm Colombia → Store as 20:00 UTC (3pm + 5 hours)
Example: User says "10am" or "10 de la mañana" → They mean 10am Colombia → Store as 15:00 UTC (10am + 5 hours)

CURRENT DATE AND TIME:
- ISO Format (UTC): ${today}
- Human Readable (Colombia Time): ${todayReadable}

STEP-BY-STEP INSTRUCTIONS:
1. READ the user's input carefully and FIX any obvious errors (in English or Spanish)
2. IDENTIFY the task action (what needs to be done)
3. EXTRACT the date/time if mentioned:
   
   ENGLISH DATE KEYWORDS:
   - "tomorrow" = add 1 day to current date
   - "today" = current date  
   - "next week" = add 7 days
   
   SPANISH DATE KEYWORDS:
   - "mañana" = add 1 day to current date
   - "hoy" = current date
   - "próxima semana" or "la próxima semana" = add 7 days
   - "pasado mañana" = add 2 days to current date
   
   TIME EXTRACTION (CRITICAL - WORKS FOR BOTH LANGUAGES):
     ENGLISH TIME FORMATS:
     * Look for times like: "3pm", "3 pm", "3 p.m.", "15:00", "three pm", "at 5", "by 3", etc.
     * "3pm" or "3 p.m." or "by 3 p.m." = 15:00 (3:00 PM in 24-hour format)
     * "5pm" or "5 p.m." = 17:00 (5:00 PM in 24-hour format)
     * "10am" or "10 a.m." = 10:00 (10:00 AM in 24-hour format)
     * "3:30pm" = 15:30
     
     SPANISH TIME FORMATS:
     * "3 de la tarde" or "a las 3 de la tarde" = 15:00 (3:00 PM)
     * "10 de la mañana" or "a las 10 de la mañana" = 10:00 (10:00 AM)
     * "3 de la madrugada" = 03:00 (3:00 AM)
     * "para las 3" or "antes de las 3" = 15:00 (assuming afternoon context)
     * "a las" = "at", "para las" = "by"
     
     CONVERSION RULES:
     * Always convert PM times: add 12 to hour (1pm=13:00, 2pm=14:00, 3pm=15:00, etc.)
     * Keep AM times as is (9am=09:00, 10am=10:00, 11am=11:00)
     * "de la tarde" (afternoon) = PM times (12:00-18:59)
     * "de la mañana" (morning) = AM times (06:00-11:59)
     * "de la madrugada" (early morning) = AM times (00:00-05:59)
     * If time mentioned without AM/PM and it's 1-12, assume PM for afternoon context
   - If date mentioned without time, use 12:00 (noon)
   - If time mentioned without date, use today's date
   
4. DETECT priority keywords:
   ENGLISH PRIORITY KEYWORDS:
   - "urgent", "asap", "important", "critical" → "high"
   - "sometime", "eventually", "when possible" → "low"
   - Otherwise → "medium"
   
   SPANISH PRIORITY KEYWORDS:
   - "urgente", "importante", "crítico", "crítica", "asap", "ya", "inmediatamente" → "high"
   - "tal vez", "algún día", "eventualmente", "cuando sea posible" → "low"
   - Otherwise → "medium"
   
5. CREATE A SMART DESCRIPTION (CRITICAL):
   DO NOT just repeat the transcription with date/time!
   
   INSTEAD:
   - Extract the CORE ACTION (what needs to be done)
   - ADD helpful context, reminders, or suggestions based on the task type
   - The date/time is already in dueDate field, so DON'T repeat it in description
   
   SMART DESCRIPTION PATTERNS:
   
   ENGLISH EXAMPLES:
   - Input: "Walk my dog at 3:15pm tomorrow"
     ❌ BAD: "Walk my dog at 3:15pm tomorrow"
     ✅ GOOD: "Don't forget the leash and water bowl"
   
   - Input: "Buy groceries tomorrow at 5pm"
     ❌ BAD: "Buy groceries tomorrow at 5pm"
     ✅ GOOD: "Remember to check the pantry first and bring reusable bags"
   
   - Input: "Call mom at 7pm today"
     ❌ BAD: "Call mom at 7pm today"
     ✅ GOOD: "Catch up on recent events and ask how she's doing"
   
   - Input: "Dentist appointment next week at 2pm"
     ❌ BAD: "Dentist appointment next week at 2pm"
     ✅ GOOD: "Bring insurance card and arrive 10 minutes early"
   
   - Input: "Submit report by Friday 5pm"
     ❌ BAD: "Submit report by Friday 5pm"
     ✅ GOOD: "Review thoroughly and check all data before submitting"
   
   SPANISH EXAMPLES:
   - Input: "Sacar a pasear al perro mañana a las 3 y 15"
     ❌ BAD: "Sacar a pasear al perro mañana a las 3 y 15"
     ✅ GOOD: "No olvidar la correa y el agua"
   
   - Input: "Comprar mercado mañana a las 5 de la tarde"
     ❌ BAD: "Comprar mercado mañana a las 5 de la tarde"
     ✅ GOOD: "Revisar la alacena primero y llevar bolsas reutilizables"
   
   - Input: "Llamar a mamá hoy a las 7 de la noche"
     ❌ BAD: "Llamar a mamá hoy a las 7 de la noche"
     ✅ GOOD: "Preguntar cómo ha estado y ponerse al día"
   
   - Input: "Cita con el dentista la próxima semana a las 2"
     ❌ BAD: "Cita con el dentista la próxima semana a las 2"
     ✅ GOOD: "Llevar carnet del seguro y llegar 10 minutos antes"
   
   - Input: "Entregar informe el viernes a las 5"
     ❌ BAD: "Entregar informe el viernes a las 5"
     ✅ GOOD: "Revisar bien y verificar todos los datos antes de enviar"
   
   COMMON TASK SUGGESTIONS BY TYPE:
   - Shopping: "Check inventory first" / "Revisar qué falta primero"
   - Appointments: "Arrive early" / "Llegar temprano", "Bring documents" / "Llevar documentos"
   - Calls: "Prepare talking points" / "Preparar temas a hablar"
   - Exercise: "Prepare workout clothes" / "Preparar ropa deportiva"
   - Meetings: "Review agenda" / "Revisar agenda", "Prepare materials" / "Preparar materiales"
   - Errands: "Bring necessary items" / "Llevar lo necesario"
   - Work tasks: "Double-check before submitting" / "Revisar bien antes de enviar"
   
6. FORMAT the output as valid JSON

CONFIDENCE SCORING (CRITICAL):
You MUST include a "confidence" score (0-100) that indicates how certain you are this is a VALID TASK REQUEST.

HIGH CONFIDENCE (80-100): Clear task with specific action
ENGLISH EXAMPLES:
- "Buy milk tomorrow"
- "Call John at 3pm"
- "Finish report by Friday"
- "Schedule dentist appointment next week"

SPANISH EXAMPLES:
- "Comprar leche mañana"
- "Llamar a Juan a las 3 de la tarde"
- "Terminar el informe para el viernes"
- "Agendar cita con el dentista la próxima semana"

MEDIUM CONFIDENCE (60-79): Vague but still actionable
ENGLISH EXAMPLES:
- "Do something tomorrow" (vague but has intent)
- "Remember to call" (missing who, but still a task)
- "Maybe buy groceries" (uncertain but actionable)

SPANISH EXAMPLES:
- "Hacer algo mañana" (vague but has intent)
- "Recordar llamar" (missing who, but still a task)
- "Tal vez comprar víveres" (uncertain but actionable)

LOW CONFIDENCE (0-59): NOT a task request - REJECT THESE
ENGLISH EXAMPLES:
- "Hello" / "Hi there" / "Testing"
- "What's the weather?"
- Random conversation: "I like pizza"
- Unclear speech: "um... uh... maybe... I don't know"
- Questions: "Can you help me?"
- Non-task statements: "I'm tired" / "It's a nice day"

SPANISH EXAMPLES:
- "Hola" / "Buenas" / "Prueba"
- "¿Cómo está el clima?"
- Random conversation: "Me gusta la pizza"
- Unclear speech: "em... eh... tal vez... no sé"
- Questions: "¿Puedes ayudarme?"
- Non-task statements: "Estoy cansado" / "Es un día bonito"

If confidence < 60: Set title to "REJECTED", description to reason, and all other fields to null.

CRITICAL RULES:
- ALWAYS include confidence score (0-100) as the FIRST field
- dueDate MUST be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
- If ANY date or time is mentioned, you MUST calculate and include dueDate
- If no date/time mentioned at all, use null for dueDate
- ALWAYS include all fields: confidence, title, description, dueDate, priority
- Description should be SMART: helpful context/reminders, NOT just repeating date/time

EXAMPLES (study these carefully):

=== ENGLISH EXAMPLES ===

Input: "Buy milk tomorrow"
Step 1: Confidence = 95 (clear, specific task)
Step 2: Task = "Buy milk"
Step 3: Date = tomorrow = ${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}
Step 4: Time = not mentioned, use 12:00 noon
Step 5: Priority = not mentioned, use "medium"
Step 6: Smart description = Add helpful context about shopping
Output: {"confidence":95,"title":"Buy milk","description":"Check if other dairy products are needed too","dueDate":"${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}T12:00:00.000Z","priority":"medium"}

Input: "Call doctor at 5pm tomorrow urgent"
Step 1: Confidence = 98 (very clear, specific task with details)
Step 2: Task = "Call doctor"
Step 3: Date = tomorrow = ${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}
Step 4: Time = "5pm" = 17:00 (5 + 12 = 17 in 24-hour format)
Step 5: Priority = "urgent" mentioned = "high"
Step 6: Smart description = Add helpful reminder about appointments
Output: {"confidence":98,"title":"Call doctor","description":"Have insurance card and symptoms list ready","dueDate":"${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}T17:00:00.000Z","priority":"high"}

Input: "Go shopping tomorrow by 3 p.m."
Step 1: Confidence = 92 (clear task with deadline)
Step 2: Task = "Go shopping"
Step 3: Date = tomorrow = ${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}
Step 4: Time = "3 p.m." Colombia time = 15:00 Colombia = 20:00 UTC (15 + 5 = 20)
Step 5: Priority = not mentioned = "medium"
Step 6: Smart description = Add helpful shopping reminder
Output: {"confidence":92,"title":"Go shopping","description":"Check pantry first and bring reusable bags","dueDate":"${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}T20:00:00.000Z","priority":"medium"}

Input: "Meeting at 10am today"
Step 1: Confidence = 90 (clear task with time)
Step 2: Task = "Meeting"
Step 3: Date = today = ${today.split('T')[0]}
Step 4: Time = "10am" Colombia time = 10:00 Colombia = 15:00 UTC (10 + 5 = 15)
Step 5: Priority = not mentioned = "medium"
Step 6: Smart description = Add meeting preparation reminder
Output: {"confidence":90,"title":"Meeting","description":"Review agenda and prepare materials beforehand","dueDate":"${today.split('T')[0]}T15:00:00.000Z","priority":"medium"}

Input: "Finish report by Friday 3pm"
Step 1: Confidence = 95 (clear task with deadline)
Step 2: Task = "Finish report"
Step 3: Date = Friday = 2025-11-08
Step 4: Time = "3pm" = 15:00 (3 + 12 = 15)
Step 5: Priority = not mentioned = "medium"
Step 6: Smart description = Add quality check reminder
Output: {"confidence":95,"title":"Finish report","description":"Double-check all data and proofread before submitting","dueDate":"2025-11-08T15:00:00.000Z","priority":"medium"}

Input: "Clean room"
Step 1: Confidence = 88 (clear task, no deadline)
Step 2: Task = "Clean room"
Step 3: Date = not mentioned
Step 4: Time = not mentioned
Step 5: Priority = not mentioned
Step 6: Smart description = Add helpful cleaning reminder
Output: {"confidence":88,"title":"Clean room","description":"Organize items and put everything in its place","dueDate":null,"priority":"medium"}

=== SPANISH EXAMPLES ===

Input: "Comprar leche mañana"
Step 1: Confidence = 95 (clear, specific task in Spanish)
Step 2: Task = "Comprar leche" (Keep in Spanish)
Step 3: Date = mañana (tomorrow) = ${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}
Step 4: Time = not mentioned, use 12:00 noon
Step 5: Priority = not mentioned, use "medium"
Step 6: Smart description = Add helpful context about shopping (in Spanish)
Output: {"confidence":95,"title":"Comprar leche","description":"Verificar si hacen falta otros lácteos también","dueDate":"${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}T12:00:00.000Z","priority":"medium"}

Input: "Llamar al doctor a las 5 de la tarde mañana urgente"
Step 1: Confidence = 98 (very clear, specific task with details in Spanish)
Step 2: Task = "Llamar al doctor" (Keep in Spanish)
Step 3: Date = mañana (tomorrow) = ${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}
Step 4: Time = "5 de la tarde" = 17:00 (5pm in 24-hour format)
Step 5: Priority = "urgente" mentioned = "high"
Step 6: Smart description = Add helpful reminder about appointments (in Spanish)
Output: {"confidence":98,"title":"Llamar al doctor","description":"Tener listo el carnet del seguro y lista de síntomas","dueDate":"${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}T17:00:00.000Z","priority":"high"}

Input: "Ir de compras mañana para las 3 de la tarde"
Step 1: Confidence = 92 (clear task with deadline in Spanish)
Step 2: Task = "Ir de compras" (Keep in Spanish)
Step 3: Date = mañana (tomorrow) = ${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}
Step 4: Time = "3 de la tarde" Colombia time = 15:00 Colombia = 20:00 UTC (15 + 5 = 20)
Step 5: Priority = not mentioned = "medium"
Step 6: Smart description = Add helpful shopping reminder (in Spanish)
Output: {"confidence":92,"title":"Ir de compras","description":"Revisar la alacena primero y llevar bolsas reutilizables","dueDate":"${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}T20:00:00.000Z","priority":"medium"}

Input: "Reunión a las 10 de la mañana hoy"
Step 1: Confidence = 90 (clear task with time in Spanish)
Step 2: Task = "Reunión" (Keep in Spanish)
Step 3: Date = hoy (today) = ${today.split('T')[0]}
Step 4: Time = "10 de la mañana" Colombia time = 10:00 Colombia = 15:00 UTC (10 + 5 = 15)
Step 5: Priority = not mentioned = "medium"
Step 6: Smart description = Add meeting preparation reminder (in Spanish)
Output: {"confidence":90,"title":"Reunión","description":"Revisar agenda y preparar materiales con anticipación","dueDate":"${today.split('T')[0]}T15:00:00.000Z","priority":"medium"}

Input: "Terminar informe para el viernes a las 3 de la tarde importante"
Step 1: Confidence = 97 (clear task with deadline and priority in Spanish)
Step 2: Task = "Terminar informe" (Keep in Spanish)
Step 3: Date = viernes (Friday) = 2025-11-08
Step 4: Time = "3 de la tarde" = 15:00 (3pm in 24-hour format)
Step 5: Priority = "importante" mentioned = "high"
Step 6: Smart description = Add quality check reminder (in Spanish)
Output: {"confidence":97,"title":"Terminar informe","description":"Revisar bien todos los datos y corregir antes de enviar","dueDate":"2025-11-08T15:00:00.000Z","priority":"high"}

Input: "Limpiar el cuarto"
Step 1: Confidence = 88 (clear task, no deadline in Spanish)
Step 2: Task = "Limpiar el cuarto" (Keep in Spanish)
Step 3: Date = not mentioned
Step 4: Time = not mentioned
Step 5: Priority = not mentioned
Step 6: Smart description = Add helpful cleaning reminder (in Spanish)
Output: {"confidence":88,"title":"Limpiar el cuarto","description":"Organizar las cosas y poner todo en su lugar","dueDate":null,"priority":"medium"}

TRANSCRIPTION ERROR EXAMPLES (with corrections):

=== ENGLISH ERROR EXAMPLES ===

Input: "by melk tommorow" (transcription error)
Corrected: "buy milk tomorrow"
Output: {"confidence":90,"title":"Buy milk","description":"Buy milk tomorrow","dueDate":"${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}T12:00:00.000Z","priority":"medium"}

Input: "call docter five pm tuday urgent" (multiple errors)
Corrected: "call doctor 5pm today urgent"
Output: {"confidence":88,"title":"Call doctor","description":"Call doctor at 5pm today urgent","dueDate":"${today.split('T')[0]}T17:00:00.000Z","priority":"high"}

Input: "finnish the reprt by friday tree pm" (errors)
Corrected: "finish the report by friday 3pm"
Output: {"confidence":85,"title":"Finish the report","description":"Finish the report by Friday 3pm","dueDate":"2025-11-08T15:00:00.000Z","priority":"medium"}

Input: "meat with john next weak" (homophones)
Corrected: "meet with john next week"
Output: {"confidence":92,"title":"Meet with John","description":"Meet with John next week","dueDate":"${new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0]}T12:00:00.000Z","priority":"medium"}

=== SPANISH ERROR EXAMPLES ===

Input: "compra leche manana" (missing accent, transcription error)
Corrected: "comprar leche mañana"
Output: {"confidence":90,"title":"Comprar leche","description":"Comprar leche mañana","dueDate":"${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}T12:00:00.000Z","priority":"medium"}

Input: "yamar al dotor cinco de la tarde oy urgente" (multiple errors: llamar, doctor, hoy)
Corrected: "llamar al doctor 5 de la tarde hoy urgente"
Output: {"confidence":88,"title":"Llamar al doctor","description":"Llamar al doctor a las 5 de la tarde hoy urgente","dueDate":"${today.split('T')[0]}T17:00:00.000Z","priority":"high"}

Input: "termina el infome para el biernes tres de la tarde" (errors: terminar, informe, viernes)
Corrected: "terminar el informe para el viernes 3 de la tarde"
Output: {"confidence":85,"title":"Terminar el informe","description":"Terminar el informe para el viernes a las 3 de la tarde","dueDate":"2025-11-08T15:00:00.000Z","priority":"medium"}

REJECTION EXAMPLES (confidence < 60):

=== ENGLISH REJECTION EXAMPLES ===

Input: "Hello" or "Hi there" or "Testing"
Confidence = 5 (greeting, not a task)
Output: {"confidence":5,"title":"REJECTED","description":"This appears to be a greeting, not a task request. Please describe what you'd like to do.","dueDate":null,"priority":"medium"}

Input: "What's the weather today?"
Confidence = 10 (question, not a task)
Output: {"confidence":10,"title":"REJECTED","description":"This is a question, not a task request. Please tell me what task you'd like to create.","dueDate":null,"priority":"medium"}

Input: "I like pizza"
Confidence = 8 (statement, not a task)
Output: {"confidence":8,"title":"REJECTED","description":"This doesn't appear to be a task request. Please describe what you need to do.","dueDate":null,"priority":"medium"}

=== SPANISH REJECTION EXAMPLES ===

Input: "Hola" or "Buenas" or "Prueba"
Confidence = 5 (greeting, not a task)
Output: {"confidence":5,"title":"REJECTED","description":"Esto parece ser un saludo, no una tarea. Por favor describe qué te gustaría hacer.","dueDate":null,"priority":"medium"}

Input: "¿Cómo está el clima hoy?"
Confidence = 10 (question, not a task)
Output: {"confidence":10,"title":"REJECTED","description":"Esto es una pregunta, no una tarea. Por favor dime qué tarea quieres crear.","dueDate":null,"priority":"medium"}

Input: "Me gusta la pizza"
Confidence = 8 (statement, not a task)
Output: {"confidence":8,"title":"REJECTED","description":"Esto no parece ser una tarea. Por favor describe qué necesitas hacer.","dueDate":null,"priority":"medium"}

Input: "um... uh... maybe... I don't know"
Confidence = 15 (unclear, no actionable task)
Output: {"confidence":15,"title":"REJECTED","description":"I couldn't understand a clear task. Please speak more clearly about what you'd like to do.","dueDate":null,"priority":"medium"}

Input: "Can you help me?"
Confidence = 20 (help request, not specific task)
Output: {"confidence":20,"title":"REJECTED","description":"Please be more specific about what task you'd like to create.","dueDate":null,"priority":"medium"}

NOW PROCESS THIS INPUT STEP BY STEP:
"${transcription}"

First, silently correct any obvious transcription errors or typos.
Then think through each step.
Finally, return ONLY the final JSON object with no extra text or explanation.`;
  }

  private async callGemini(prompt: string): Promise<string> {
    if (!this.geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.logger.log(`Calling Google Gemini API`);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
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

      // Extract confidence score (default to 50 if missing)
      const confidence = typeof parsed.confidence === 'number' 
        ? parsed.confidence 
        : 50;

      this.logger.log(`Task extraction confidence: ${confidence}%`);

      // Validate confidence threshold
      if (confidence < 60) {
        this.logger.warn(
          `Task rejected due to low confidence: ${confidence}% (threshold: 60%)`,
        );
        this.logger.warn(`Reason: ${parsed.description || 'No description provided'}`);
        return null;
      }

      // Validate required fields
      if (!parsed.title || typeof parsed.title !== 'string') {
        this.logger.warn('Invalid task data: missing or invalid title');
        return null;
      }

      // Check if task was explicitly rejected
      if (parsed.title === 'REJECTED') {
        this.logger.warn('Task explicitly rejected by AI');
        this.logger.warn(`Reason: ${parsed.description}`);
        return null;
      }

      // Return validated task data
      return {
        confidence,
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
