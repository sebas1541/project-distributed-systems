'use client';

import { useState } from 'react';
import { Sparkles, X, TrendingUp, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InsightsData {
  summary: string;
  insights: string[];
  recommendations: string[];
  productivity?: {
    score: number;
    trend: 'mejorando' | 'estable' | 'disminuyendo';
    comment: string;
  };
}

interface Analytics {
  total: number;
  byStatus: {
    pending: number;
    inProgress: number;
    completed: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
  upcomingCount: number;
  overdueCount: number;
}

export function InsightsButton() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      const userId = user.id;

      const insightsUrl = process.env.NEXT_PUBLIC_INSIGHTS_URL || 'http://localhost/api/insights';
      
      // Fetch insights and analytics in parallel
      const [insightsRes, analyticsRes] = await Promise.all([
        fetch(`${insightsUrl}/summary/${userId}`),
        fetch(`${insightsUrl}/analytics/${userId}`),
      ]);

      const insightsData = await insightsRes.json();
      const analyticsData = await analyticsRes.json();

      if (insightsData.success) {
        setInsights(insightsData.data);
      }
      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setShowModal(true);
    fetchInsights();
  };

  const getProductivityColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'mejorando') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'disminuyendo') return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
    return <TrendingUp className="h-4 w-4 text-gray-600" />;
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600 font-semibold shadow-md"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Ver Insights
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-black" />
                <h2 className="text-2xl font-bold text-black">Insights IA</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full hover:bg-black/10 transition-colors"
              >
                <X className="h-5 w-5 text-black" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent"></div>
                </div>
              ) : (
                <>
                  {/* Analytics Cards */}
                  {analytics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                        <div className="text-2xl font-bold text-blue-600">{analytics.total}</div>
                        <div className="text-sm text-blue-700">Total Tareas</div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl">
                        <div className="text-2xl font-bold text-yellow-600">{analytics.byStatus.pending}</div>
                        <div className="text-sm text-yellow-700">Pendientes</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
                        <div className="text-2xl font-bold text-orange-600">{analytics.byStatus.inProgress}</div>
                        <div className="text-sm text-orange-700">En Progreso</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                        <div className="text-2xl font-bold text-green-600">{analytics.byStatus.completed}</div>
                        <div className="text-sm text-green-700">Completadas</div>
                      </div>
                    </div>
                  )}

                  {/* Productivity Score */}
                  {insights?.productivity && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-800">Score de Productividad</h3>
                        {getTrendIcon(insights.productivity.trend)}
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className={`text-4xl font-bold ${getProductivityColor(insights.productivity.score)}`}>
                          {insights.productivity.score}
                        </span>
                        <span className="text-gray-500">/10</span>
                      </div>
                      <p className="text-sm text-gray-600">{insights.productivity.comment}</p>
                    </div>
                  )}

                  {/* Summary */}
                  {insights?.summary && (
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-3">📊 Resumen</h3>
                      <p className="text-gray-700 leading-relaxed">{insights.summary}</p>
                    </div>
                  )}

                  {/* Insights */}
                  {insights?.insights && insights.insights.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        Observaciones
                      </h3>
                      {insights.insights.map((insight, index) => (
                        <div key={index} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                          <p className="text-gray-700">{insight}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {insights?.recommendations && insights.recommendations.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Recomendaciones
                      </h3>
                      {insights.recommendations.map((rec, index) => (
                        <div key={index} className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400 flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-700">{rec}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upcoming Tasks Warning */}
                  {analytics && analytics.upcomingCount > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-start gap-3">
                      <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-yellow-800">
                          Tienes {analytics.upcomingCount} tarea{analytics.upcomingCount !== 1 ? 's' : ''} próxima{analytics.upcomingCount !== 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-yellow-700">En las próximas 24 horas</p>
                      </div>
                    </div>
                  )}

                  {/* Overdue Tasks Warning */}
                  {analytics && analytics.overdueCount > 0 && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-800">
                          ¡Atención! {analytics.overdueCount} tarea{analytics.overdueCount !== 1 ? 's' : ''} vencida{analytics.overdueCount !== 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-red-700">Revísalas lo antes posible</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <Button
                onClick={() => setShowModal(false)}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
