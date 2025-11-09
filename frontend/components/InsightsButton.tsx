'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

interface Analytics {
  total: number;
  byStatus: {
    pending: number;
    inProgress: number;
    completed: number;
  };
  upcomingCount: number;
  overdueCount: number;
}

export function InsightsButton() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchInsightsStream = async () => {
    setLoading(true);
    setStreamedText('');
    setIsStreaming(true);
    
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      const userId = user.id;

      const insightsUrl = process.env.NEXT_PUBLIC_INSIGHTS_URL || 'http://localhost/api/insights';
      
      // Fetch analytics first
      const analyticsRes = await fetch(`${insightsUrl}/analytics/${userId}`);
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
      }

      // Stream insights
      abortControllerRef.current = new AbortController();
      const response = await fetch(`${insightsUrl}/stream/${userId}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Stream failed');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setStreamedText((prev) => prev + data.content);
              }
              if (data.done) {
                setIsStreaming(false);
              }
              if (data.error) {
                console.error('Stream error:', data.error);
                setIsStreaming(false);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching insights:', error);
      }
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  const handleOpen = () => {
    setShowModal(true);
    fetchInsightsStream();
  };

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setShowModal(false);
    setStreamedText('');
    setAnalytics(null);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Insights IA</h2>
                  <p className="text-sm text-gray-500">Análisis personalizado de tus tareas</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
              {/* Analytics Cards */}
              {analytics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900">{analytics.total}</div>
                    <div className="text-xs text-gray-500 mt-1">Total Tareas</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-yellow-200 shadow-sm">
                    <div className="text-2xl font-bold text-yellow-600">{analytics.byStatus.pending}</div>
                    <div className="text-xs text-gray-500 mt-1">Pendientes</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm">
                    <div className="text-2xl font-bold text-orange-600">{analytics.byStatus.inProgress}</div>
                    <div className="text-xs text-gray-500 mt-1">En Progreso</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{analytics.byStatus.completed}</div>
                    <div className="text-xs text-gray-500 mt-1">Completadas</div>
                  </div>
                </div>
              )}

              {/* AI Insights Stream */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm min-h-[300px]">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <h3 className="text-sm font-semibold text-gray-700">Análisis Personalizado</h3>
                </div>
                
                {loading && !streamedText ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-3 border-yellow-400 border-t-transparent mb-3"></div>
                    <p className="text-gray-500 text-sm">Analizando tus tareas...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-lg font-bold text-gray-900 mt-3 mb-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-base font-bold text-gray-900 mt-2 mb-1.5" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-gray-900 mt-2 mb-1" {...props} />,
                        p: ({node, ...props}) => <p className="text-gray-700 text-sm leading-relaxed mb-2" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 mb-2 ml-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 mb-2 ml-2" {...props} />,
                        li: ({node, ...props}) => <li className="text-gray-700 text-sm" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                        em: ({node, ...props}) => <em className="italic text-gray-600" {...props} />,
                        code: ({node, ...props}) => <code className="bg-yellow-50 px-1.5 py-0.5 rounded text-xs text-gray-800 font-mono" {...props} />,
                      }}
                    >
                      {streamedText}
                    </ReactMarkdown>
                    {isStreaming && (
                      <span className="inline-block w-1.5 h-4 bg-yellow-500 animate-pulse ml-0.5 align-middle"></span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-white flex gap-3">
              <Button
                onClick={handleClose}
                className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setStreamedText('');
                  fetchInsightsStream();
                }}
                className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500"
                disabled={isStreaming}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Regenerar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
