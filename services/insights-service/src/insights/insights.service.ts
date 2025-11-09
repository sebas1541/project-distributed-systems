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

      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
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
}
