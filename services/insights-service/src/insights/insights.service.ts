import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private readonly rabbitMQService: RabbitMQService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not configured');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateInsights(userId: string): Promise<any> {
    try {
      const tasks = this.rabbitMQService.getTasksByUser(userId);
      
      if (tasks.length === 0) {
        return {
          summary: 'No tienes tareas registradas aún.',
          insights: [],
          recommendations: ['Comienza agregando tus primeras tareas para recibir insights personalizados.'],
        };
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `Analiza las siguientes tareas del usuario y proporciona insights útiles en español:

Tareas:
${tasks.map(t => `- ${t.title} (Prioridad: ${t.priority}, Estado: ${t.status}, Vencimiento: ${t.dueDate || 'Sin fecha'})`).join('\n')}

Proporciona un análisis en formato JSON con esta estructura:
{
  "summary": "Resumen general de las tareas (2-3 oraciones)",
  "insights": [
    "Insight 1: Observación sobre patrones o tendencias",
    "Insight 2: Otra observación relevante",
    "Insight 3: Análisis de prioridades o deadlines"
  ],
  "recommendations": [
    "Recomendación 1: Sugerencia concreta para mejorar productividad",
    "Recomendación 2: Otra acción recomendada",
    "Recomendación 3: Consejo adicional"
  ],
  "productivity": {
    "score": número_del_1_al_10,
    "trend": "mejorando" | "estable" | "disminuyendo",
    "comment": "Breve comentario sobre productividad"
  }
}

Sé específico, útil y positivo en tus observaciones.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0]);
        return insights;
      }
      
      return {
        summary: 'No se pudo generar el análisis.',
        insights: [],
        recommendations: [],
      };
    } catch (error) {
      this.logger.error('Error generating insights:', error);
      throw error;
    }
  }

  async getAnalytics(userId: string): Promise<any> {
    try {
      const tasks = this.rabbitMQService.getTasksByUser(userId);
      
      const analytics = {
        total: tasks.length,
        byStatus: {
          pending: tasks.filter(t => t.status === 'PENDING').length,
          inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
          completed: tasks.filter(t => t.status === 'COMPLETED').length,
        },
        byPriority: {
          low: tasks.filter(t => t.priority === 'LOW').length,
          medium: tasks.filter(t => t.priority === 'MEDIUM').length,
          high: tasks.filter(t => t.priority === 'HIGH').length,
        },
        upcomingCount: this.rabbitMQService.getUpcomingTasks(userId).length,
        overdueCount: tasks.filter(t => {
          if (!t.dueDate || t.status === 'COMPLETED') return false;
          return new Date(t.dueDate) < new Date();
        }).length,
      };
      
      return analytics;
    } catch (error) {
      this.logger.error('Error getting analytics:', error);
      throw error;
    }
  }

  async getUpcoming(userId: string): Promise<any[]> {
    try {
      const upcomingTasks = this.rabbitMQService.getUpcomingTasks(userId);
      return upcomingTasks.sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        return dateA - dateB;
      });
    } catch (error) {
      this.logger.error('Error getting upcoming tasks:', error);
      throw error;
    }
  }

  async streamInsights(userId: string, res: any): Promise<void> {
    try {
      const tasks = this.rabbitMQService.getTasksByUser(userId);
      const now = new Date();
      const currentDate = now.toLocaleDateString('es-CO', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const currentTime = now.toLocaleTimeString('es-CO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      if (tasks.length === 0) {
        res.write(`data: ${JSON.stringify({ 
          content: 'No tienes tareas registradas aún. ¡Comienza agregando tus primeras tareas para recibir insights personalizados! 📝',
          done: true 
        })}\n\n`);
        res.end();
        return;
      }

      // Calculate analytics
      const overdueTasks = tasks.filter(t => {
        if (!t.dueDate || t.status === 'COMPLETED') return false;
        return new Date(t.dueDate) < now;
      });
      
      const upcomingTasks = tasks.filter(t => {
        if (!t.dueDate || t.status === 'COMPLETED') return false;
        const dueDate = new Date(t.dueDate);
        const hoursUntil = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntil > 0 && hoursUntil <= 24;
      });

      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `Eres un asistente personal de productividad inteligente. Analiza las tareas del usuario y proporciona insights útiles y personalizados.

CONTEXTO ACTUAL:
📅 Fecha: ${currentDate}
🕐 Hora: ${currentTime}
⚠️ IMPORTANTE: La hora mostrada es UTC. El usuario está en Colombia (UTC-5), así que RESTA 5 HORAS para el saludo correcto.
   Ejemplo: Si son las 22:15 UTC → Son las 17:15 en Colombia (5:15 p.m.) → Saluda con "Buenas tardes"

TAREAS DEL USUARIO (${tasks.length} total):
${tasks.map(t => {
  const status = t.status === 'COMPLETED' ? '✅' : t.status === 'IN_PROGRESS' ? '🔄' : '⏳';
  const priority = t.priority === 'HIGH' ? '🔴' : t.priority === 'MEDIUM' ? '🟡' : '🟢';
  let dueInfo = '';
  if (t.dueDate) {
    const dueDate = new Date(t.dueDate);
    const hoursUntil = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntil < 0) {
      dueInfo = ` - ⚠️ VENCIDA hace ${Math.abs(Math.round(hoursUntil))}h`;
    } else if (hoursUntil <= 24) {
      dueInfo = ` - ⏰ Vence en ${Math.round(hoursUntil)}h`;
    } else {
      dueInfo = ` - Vence: ${dueDate.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}`;
    }
  }
  return `${status} ${priority} ${t.title}${dueInfo}`;
}).join('\n')}

ESTADÍSTICAS:
- Tareas vencidas: ${overdueTasks.length}
- Tareas próximas (24h): ${upcomingTasks.length}
- Completadas: ${tasks.filter(t => t.status === 'COMPLETED').length}
- En progreso: ${tasks.filter(t => t.status === 'IN_PROGRESS').length}
- Pendientes: ${tasks.filter(t => t.status === 'PENDING').length}

INSTRUCCIONES:
1. **SÉ BREVE Y CONCISO** - Máximo 150 palabras en total
2. Saluda rápidamente mencionando la hora
3. Si hay tareas vencidas/urgentes, menciónalas por nombre (máximo 2-3)
4. Da solo 2-3 recomendaciones concretas y priorizadas
5. Usa emojis para hacer el mensaje más visual
6. Escribe en párrafos cortos y directos
7. NO escribas textos largos o detallados

Formato ideal:
- Saludo breve (1 línea)
- Estado actual (2-3 líneas)
- Top 2-3 recomendaciones (bullets)
- Motivación final (1 línea)

Escribe en español, directo al punto, como un asistente personal eficiente.`;

      const result = await model.generateContentStream(prompt);
      
      // Stream the response token by token
      for await (const chunk of result.stream) {
        const text = chunk.text();
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
      
      // Send done signal
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      
    } catch (error) {
      this.logger.error('Error streaming insights:', error);
      res.write(`data: ${JSON.stringify({ 
        error: 'Error al generar insights',
        done: true 
      })}\n\n`);
      res.end();
    }
  }
}
